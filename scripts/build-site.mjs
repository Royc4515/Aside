#!/usr/bin/env node
/**
 * Builds the search-facing parts of the landing site from the dictionary in
 * site/assets/i18n.js, so they can never drift from what visitors see:
 *
 *   1. site/index.html     - static English text = the `en` dictionary, plus
 *                            the JSON-LD block between the jsonld markers.
 *   2. site/he/index.html  - a static Hebrew copy of the landing page.
 *   3. The "Latest models" chips in both pages and site/demo/catalog.js (the
 *      live demo's model names), from providers/models.js.
 *   4. The "Updated <month>" badge (models.eyebrow in site/assets/i18n.js,
 *      both languages), from CATALOG_VERIFIED in providers/models.js.
 *   5. demo-api/lib/*.generated.js - the models the demo server may call and
 *      the facts it answers from, so the server never drifts from the catalog
 *      or from the page it is answering about.
 *
 * Why: the site translates in the browser, so crawlers that don't run JS
 * (most AI crawlers) only ever saw the HTML fallback text, which had drifted
 * from the dictionary. And hreflang needs a real URL per language, so Hebrew
 * gets its own page at /Aside/he/ instead of existing only after a JS swap.
 *
 * Usage:
 *   node scripts/build-site.mjs           write both files
 *   node scripts/build-site.mjs --check   exit 1 if either is stale (CI)
 *
 * Run it after editing site/index.html, site/assets/i18n.js or
 * providers/models.js.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const BASE_URL = 'https://royc4515.github.io/Aside/';
const PAGE_URL = { en: BASE_URL, he: `${BASE_URL}he/` };
const OG_LOCALE = { en: 'en_US', he: 'he_IL' };
const CHECK = process.argv.includes('--check');

// ── Dictionary ───────────────────────────────────────────────────────────────

function loadDict(src) {
  // Just enough of a browser for the IIFE to define the dictionary; init()
  // waits for DOMContentLoaded, which never fires here.
  const sandbox = {
    window: {},
    document: { readyState: 'loading', addEventListener() {} },
    navigator: { language: 'en' },
    localStorage: { getItem: () => null, setItem() {} },
  };
  vm.runInNewContext(src, sandbox, { filename: 'site/assets/i18n.js' });
  const dict = sandbox.window.ASIDE_SITE_DICT;
  if (!dict?.en || !dict?.he) throw new Error('site/assets/i18n.js no longer exposes window.ASIDE_SITE_DICT');
  return dict;
}

// ── Model catalog ────────────────────────────────────────────────────────────

const PROVIDER_IDS = ['claude', 'openai', 'gemini', 'grok', 'groq', 'ollama'];
// Six cards share one row height, so more chips than this would wrap unevenly.
const MAX_CHIPS = 4;

function loadCatalog() {
  const sandbox = {};
  vm.runInNewContext(readFileSync(join(ROOT, 'providers', 'models.js'), 'utf8'), { self: sandbox },
    { filename: 'providers/models.js' });
  if (!sandbox.PROVIDER_MODELS) throw new Error('providers/models.js no longer defines PROVIDER_MODELS');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(sandbox.CATALOG_VERIFIED || '')) {
    throw new Error('providers/models.js: CATALOG_VERIFIED must be "YYYY-MM"');
  }
  return sandbox;
}

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'],
  he: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר',
    'נובמבר', 'דצמבר'],
};

/** "2026-11" -> { en: "Updated November 2026", he: "עודכן בנובמבר 2026" } */
function badgeText(verified) {
  const [year, month] = verified.split('-').map(Number);
  return {
    en: `Updated ${MONTHS.en[month - 1]} ${year}`,
    he: `עודכן ב${MONTHS.he[month - 1]} ${year}`,
  };
}

/** Rewrite both "models.eyebrow" entries in i18n.js (en first, then he, as the dictionary is ordered). */
function withBadge(i18nSrc, badge) {
  let n = 0;
  const out = i18nSrc.replace(/("models\.eyebrow": )"[^"]*"/g, (_, key) => key + JSON.stringify(n++ ? badge.he : badge.en));
  if (n !== 2) throw new Error(`site/assets/i18n.js: expected 2 "models.eyebrow" entries, found ${n}`);
  return out;
}

/** Chip name: "Claude Sonnet 5.5" -> "Sonnet 5.5", "GPT-OSS 20B (fastest)" -> "GPT-OSS 20B". */
const chipName = (o) => o.short || o.label.replace(/\s*\(.*\)\s*$/, '').replace(/^(?:Claude|Gemini) /, '');

/** Per provider: the default's id and chip name, then up to MAX_CHIPS distinct chip names, default first. */
function showcase(catalog) {
  const out = {};
  for (const pid of PROVIDER_IDS) {
    const entry = catalog[pid];
    const def = entry.options.find((o) => o.id === entry.default);
    const chips = [];
    for (const o of [def, ...entry.options]) {
      const name = chipName(o);
      if (!chips.includes(name) && chips.length < MAX_CHIPS) chips.push(name);
    }
    out[pid] = { default: entry.default, defaultName: chipName(def), chips };
  }
  return out;
}

function withModelChips(html, models) {
  const seen = new Set();
  html = html.replace(/(<ul class="model-chips" data-catalog="([a-z]+)">)[\s\S]*?(<\/ul>)/g, (whole, open, pid, close) => {
    if (!models[pid]) throw new Error(`site/index.html: unknown data-catalog="${pid}"`);
    seen.add(pid);
    const items = models[pid].chips.map((name, i) =>
      `<li class="model-chip${i ? '' : ' is-default'}">${escText(name)}</li>`).join('');
    return open + items + close;
  });
  const missing = PROVIDER_IDS.filter((pid) => !seen.has(pid));
  if (missing.length) throw new Error(`site/index.html has no model-chips list for: ${missing.join(', ')}`);
  return html;
}

function demoCatalog(models) {
  return '// Generated by scripts/build-site.mjs from providers/models.js. Do not edit.\n'
    + `window.ASIDE_CATALOG = ${JSON.stringify(models, null, 2)};\n`;
}

// ── Demo API (demo-api/): which models answer, and what they know ────────────

// The models a visitor may pick in the try-it preview, up to two per provider. The first of each is the one
// the automatic chain uses, so put the cheaper or free-tier-friendlier model first. Ids must exist in the catalog.
// Only models that answer reliably on the free tier: Gemini 3.8 Flash was tried and dropped (2026-11), it timed
// out or returned 503 on most calls while 3.5 Flash-Lite answered every time.
const DEMO_PICKS = {
  groq: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
  gemini: ['gemini-3.5-flash-lite'],
  claude: ['claude-haiku-5-5', 'claude-sonnet-5-5'],
};
// The dictionary entries the model answers from. Kept short: Groq's free tier allows 8K tokens a minute.
const DEMO_FACT_KEYS = ['about.body', 'privacy.body'];
const DEMO_FACTS_MAX_CHARS = 6000;

const generatedModule = (source, name, value) =>
  `// Generated by scripts/build-site.mjs from ${source}. Do not edit.\n`
  + `export const ${name} = ${JSON.stringify(value, null, 2)};\n`;

function demoApiCatalog(catalog) {
  const out = {};
  for (const [pid, ids] of Object.entries(DEMO_PICKS)) {
    out[pid] = ids.map((id) => {
      const opt = catalog[pid]?.options.find((o) => o.id === id);
      if (!opt) throw new Error(`build-site.mjs: DEMO_PICKS.${pid} "${id}" is not in providers/models.js`);
      // `key` is what the page sends; the server looks it up here and never puts a client string in a request.
      return { key: `${pid}:${id}`, provider: pid, id, label: opt.label.replace(/\s*\(.*\)\s*$/, ''), ...(opt.effort ? { effort: opt.effort } : {}) };
    });
  }
  return generatedModule('providers/models.js', 'DEMO_MODELS', out);
}

/** The same picks for the page's model picker: only what it shows and sends, never ids for a provider request. */
function tryModels(catalog) {
  const list = Object.entries(DEMO_PICKS).flatMap(([provider, ids]) => ids.map((id) => {
    const opt = catalog[provider].options.find((o) => o.id === id);
    return { key: `${provider}:${id}`, provider, label: opt.label.replace(/\s*\(.*\)\s*$/, '') };
  }));
  return '// Generated by scripts/build-site.mjs from providers/models.js. Do not edit.\n'
    + `window.ASIDE_TRY_MODELS = ${JSON.stringify(list, null, 2)};\n`;
}

/** The English About, Privacy and FAQ text, as plain lines. The model answers in the visitor's language from these. */
function demoApiFacts(en) {
  const lines = DEMO_FACT_KEYS.map((key) => en[key]);
  for (const key of Object.keys(en)) {
    const n = /^faq\.q(\d+)$/.exec(key)?.[1];
    if (n && en[`faq.a${n}`]) lines.push(`Q: ${en[key]} A: ${en[`faq.a${n}`]}`);
  }
  if (lines.some((line) => !line)) throw new Error('build-site.mjs: a DEMO_FACT_KEYS entry is missing from the dictionary');
  const facts = lines.join('\n');
  if (facts.length > DEMO_FACTS_MAX_CHARS) {
    throw new Error(`build-site.mjs: demo facts are ${facts.length} chars (max ${DEMO_FACTS_MAX_CHARS}); trim DEMO_FACT_KEYS`);
  }
  return generatedModule('site/assets/i18n.js', 'FACTS', facts);
}

// ── HTML helpers (regex-based: the page is hand-written and regular) ─────────

const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escText(s).replace(/"/g, '&quot;');

/** Mirrors apply() in i18n.js: data-i18n sets textContent, data-i18n-attr sets one attribute. */
function translate(html, table, lang) {
  const missing = new Set();
  const lookup = (key) => {
    if (table[key] == null) { missing.add(key); return null; }
    return table[key];
  };

  // Tags with data-i18n never nest a same-name tag, so the lazy match is safe.
  html = html.replace(
    /<([a-z][a-z0-9]*)\b([^>]*?\sdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (whole, tag, attrs, key) => {
      const text = lookup(key);
      return text == null ? whole : `<${tag}${attrs}>${escText(text)}</${tag}>`;
    },
  );

  html = html.replace(/<[a-z][^>]*?\sdata-i18n-attr="([^":]+):([^"]+)"[^>]*>/g, (tag, attr, key) => {
    const value = lookup(key);
    if (value == null) return tag;
    const re = new RegExp(`(\\s${attr}=")[^"]*(")`);
    return re.test(tag)
      ? tag.replace(re, `$1${escAttr(value)}$2`)
      : tag.replace(/\s*\/?>$/, (end) => ` ${attr}="${escAttr(value)}"${end}`);
  });

  if (missing.size) throw new Error(`i18n.js "${lang}" is missing: ${[...missing].join(', ')}`);
  return html;
}

/** The Hebrew page lives one folder down, so every relative URL gains "../". */
function rebaseRelativeUrls(html) {
  const rebase = (url) => (/^(#|[a-z][a-z0-9+.-]*:|\/)/i.test(url) ? url : `../${url}`);
  html = html.replace(/(\s(?:href|src|poster)=")([^"]*)(")/g, (_, a, url, b) => a + rebase(url) + b);
  return html.replace(/(\ssrcset=")([^"]*)(")/g, (_, a, set, b) =>
    a + set.split(',').map((part) => part.replace(/^(\s*)(\S+)/, (m, ws, url) => ws + rebase(url))).join(',') + b);
}

// ── JSON-LD ──────────────────────────────────────────────────────────────────

/** FAQ entries in page order, so the FAQPage matches the visible questions exactly. */
function faqKeys(html) {
  return [...html.matchAll(/<summary data-i18n="(faq\.q\d+)"/g)].map((m) => m[1]);
}

function jsonLd(html, table, lang) {
  const pageUrl = PAGE_URL[lang];
  const app = {
    '@type': 'SoftwareApplication',
    '@id': `${BASE_URL}#app`,
    name: 'Aside',
    alternateName: 'Aside AI sidebar',
    description: table['meta.description'],
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'AI assistant',
    operatingSystem: 'Google Chrome',
    // manifest.json minimum_chrome_version
    browserRequirements: 'Requires Google Chrome 114 or later',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    url: BASE_URL,
    downloadUrl: 'https://github.com/Royc4515/Aside/releases/latest/download/aside.zip',
    image: `${BASE_URL}assets/img/og-card.png`,
    screenshot: ['shot-answer-1x.png', 'shot-ask-1x.png', 'shot-switch-1x.png', 'shot-followup-1x.png']
      .map((f) => `${BASE_URL}assets/img/${f}`),
    featureList: [1, 2, 3, 4, 5, 6].map((n) => table[`feat.${n}.title`]),
    inLanguage: ['en', 'he'],
    author: { '@type': 'Person', name: 'Roy Carmelli', url: 'https://github.com/Royc4515' },
    sameAs: ['https://github.com/Royc4515/Aside'],
  };
  const page = {
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: table['meta.title'],
    description: table['meta.description'],
    inLanguage: lang,
    about: { '@id': app['@id'] },
  };
  const faq = {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: lang,
    mainEntity: faqKeys(html).map((q) => ({
      '@type': 'Question',
      name: table[q],
      acceptedAnswer: { '@type': 'Answer', text: table[q.replace('.q', '.a')] },
    })),
  };
  // don't touch / "<" escaped so a string can never close the script tag
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': [app, page, faq] }, null, 2)
    .replace(/</g, '\\u003c');
  return `  <script type="application/ld+json">\n${json.replace(/^/gm, '  ')}\n  </script>\n`;
}

const JSONLD_RE = /(<!-- jsonld:start[^>]*-->\n)[\s\S]*?(  <!-- jsonld:end -->)/;

function withJsonLd(html, table, lang) {
  if (!JSONLD_RE.test(html)) throw new Error('site/index.html lost its jsonld:start / jsonld:end markers');
  return html.replace(JSONLD_RE, (_, start, end) => start + jsonLd(html, table, lang) + end);
}

// ── Pages ────────────────────────────────────────────────────────────────────

function buildEnglish(src, dict) {
  return withJsonLd(translate(src, dict.en, 'en'), dict.en, 'en');
}

function buildHebrew(src, dict) {
  let html = translate(src, dict.he, 'he');
  html = html.replace(/<html lang="en">/, '<html lang="he" dir="rtl" data-page-lang="he">');
  html = html.replace('<!-- jsonld:start - generated by scripts/build-site.mjs, edit the script instead -->',
    '<!-- jsonld:start - generated by scripts/build-site.mjs from site/index.html, do not edit -->');
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${PAGE_URL.he}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${PAGE_URL.he}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${OG_LOCALE.he}$2`);
  html = html.replace(/(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1${OG_LOCALE.en}$2`);
  html = html.replace(/(<button class="lang-toggle"[^>]*aria-label=")[^"]*("[^>]*>)EN(<)/, '$1החלף לאנגלית$2עב$3');
  // The Hebrew page shows the Hebrew hero screenshot, so that is the one to load eagerly here.
  const swapLoading = (h, cls, from, to) => {
    const re = new RegExp(`(<picture class="shot-pic ${cls}">[\\s\\S]*?loading=")${from}(")`);
    if (!re.test(h)) throw new Error(`site/index.html lost its ${cls} hero screenshot`);
    return h.replace(re, `$1${to}$2`);
  };
  html = swapLoading(swapLoading(html, 'shot-en', 'eager', 'lazy'), 'shot-he', 'lazy', 'eager');
  html = rebaseRelativeUrls(html);
  if (!html.includes('data-page-lang="he"')) throw new Error('could not mark the Hebrew page (html tag changed?)');
  return withJsonLd(html, dict.he, 'he');
}

const catalog = loadCatalog();
const i18nPath = join(SITE, 'assets', 'i18n.js');
const i18nSrc = withBadge(readFileSync(i18nPath, 'utf8'), badgeText(catalog.CATALOG_VERIFIED));
const dict = loadDict(i18nSrc);
const models = showcase(catalog.PROVIDER_MODELS);
const indexPath = join(SITE, 'index.html');
const hePath = join(SITE, 'he', 'index.html');
const catalogPath = join(SITE, 'demo', 'catalog.js');
const src = withModelChips(readFileSync(indexPath, 'utf8'), models);
const outputs = [
  [i18nPath, i18nSrc],
  [indexPath, buildEnglish(src, dict)],
  [hePath, buildHebrew(src, dict)],
  [catalogPath, demoCatalog(models)],
  [join(ROOT, 'demo-api', 'lib', 'catalog.generated.js'), demoApiCatalog(catalog.PROVIDER_MODELS)],
  [join(SITE, 'assets', 'try-models.js'), tryModels(catalog.PROVIDER_MODELS)],
  [join(ROOT, 'demo-api', 'lib', 'context.generated.js'), demoApiFacts(dict.en)],
];

let stale = 0;
for (const [path, html] of outputs) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === html) continue;
  const rel = path.slice(ROOT.length + 1);
  if (CHECK) {
    console.error(`stale: ${rel}`);
    stale++;
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, html);
    console.log(`wrote ${rel}`);
  }
}
if (stale) {
  console.error('Run: node scripts/build-site.mjs');
  process.exit(1);
}
if (CHECK) console.log('site is in sync with site/assets/i18n.js and providers/models.js');
