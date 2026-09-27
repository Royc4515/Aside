#!/usr/bin/env node
/**
 * Live check: is every catalog model still served by its provider?
 *
 *   node scripts/check-models-live.mjs
 *
 * Keys come from the environment (ANTHROPIC_API_KEY, OPENAI_API_KEY,
 * GEMINI_API_KEY, XAI_API_KEY, GROQ_API_KEY) or from a local `.env` file at
 * the repo root (copy `.env.example`). `.env` is git-ignored and never
 * shipped in aside.zip; a real environment variable wins over it.
 *
 * Providers without a key are skipped (Ollama needs none — it's checked
 * against the public registry). Read-only: it only calls the providers'
 * model-metadata endpoints, never a completion, so it costs nothing.
 *
 * Exits 1 if any catalog id is no longer served, or if a provider rejects
 * its API key (401/403): an expired key would otherwise hide a retired model
 * behind a green run. Rate limits and network errors only warn. Also lists
 * models the provider serves that the catalog doesn't offer yet — candidates
 * for the next monthly tech update (docs/MONTHLY_UPDATE.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'providers/models.js'), 'utf8'), { self: sandbox });
const CATALOG = sandbox.PROVIDER_MODELS;

// Minimal .env reader (no deps): KEY=value per line, `#` comments, optional
// quotes and `export`. Missing file → {}.
function readDotEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return {}; }
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}
const dotEnv = readDotEnv(path.join(ROOT, '.env'));
const setInProcess = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v));
const env = { ...dotEnv, ...setInProcess };
const missing = [];   // catalog ids a provider no longer serves
const badKeys = new Set(); // providers whose API key was rejected
const skipped = [];

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  // Gemini (and sometimes xAI) answer a bad key with 400 "API key not valid";
  // report it as the auth failure it is.
  const badKey = res.status === 400 && /api[ _-]?key/i.test(JSON.stringify(body));
  return { status: badKey ? 401 : res.status, body };
}

// A model "exists" if the provider's metadata endpoint returns 200 for it.
async function checkEach(pid, exists) {
  const results = await Promise.all(CATALOG[pid].options.map(async o => [o.id, await exists(o.id)]));
  for (const [id, status] of results) {
    if (status === 200) console.log(`  ✓ ${id}`);
    else if (status === 404) { console.log(`  ✗ ${id} — not served (404)`); missing.push(`${pid}/${id}`); }
    else if (status === 401 || status === 403) { console.log(`  ✗ ${id} — API key rejected (HTTP ${status})`); badKeys.add(pid); }
    else console.log(`  ? ${id} — HTTP ${status} (rate limit or outage? not counted as missing)`);
  }
}

function reportNew(pid, servedIds, isChat = () => true) {
  const offered = new Set(CATALOG[pid].options.map(o => o.id));
  const fresh = servedIds.filter(id => !offered.has(id) && isChat(id)).sort();
  if (fresh.length) console.log(`  + served but not in catalog: ${fresh.join(', ')}`);
}

const CHECKS = {
  async claude(key) {
    const h = { 'x-api-key': key, 'anthropic-version': '2023-06-01' };
    await checkEach('claude', async id => (await getJson(`https://api.anthropic.com/v1/models/${id}`, h)).status);
    const { body } = await getJson('https://api.anthropic.com/v1/models?limit=1000', h);
    reportNew('claude', (body.data || []).map(m => m.id));
  },
  async openai(key) {
    const h = { Authorization: `Bearer ${key}` };
    await checkEach('openai', async id => (await getJson(`https://api.openai.com/v1/models/${id}`, h)).status);
    const { body } = await getJson('https://api.openai.com/v1/models', h);
    const nonChat = /(embed|tts|whisper|transcribe|dall-e|image|audio|realtime|moderation|search|codex|instruct|babbage|davinci|sora)/;
    reportNew('openai', (body.data || []).map(m => m.id), id => /^(gpt-|o\d)/.test(id) && !nonChat.test(id) && !/\d{4}-\d{2}-\d{2}$/.test(id));
  },
  async gemini(key) {
    const base = 'https://generativelanguage.googleapis.com/v1beta/models';
    await checkEach('gemini', async id => (await getJson(`${base}/${id}?key=${encodeURIComponent(key)}`)).status);
    const { body } = await getJson(`${base}?pageSize=1000&key=${encodeURIComponent(key)}`);
    const chat = (body.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'));
    reportNew('gemini', chat.map(m => m.name.replace(/^models\//, '')), id => /^gemini-/.test(id) && !/(tts|image|embedding|live|audio)/.test(id));
  },
  async grok(key) {
    const h = { Authorization: `Bearer ${key}` };
    await checkEach('grok', async id => (await getJson(`https://api.x.ai/v1/models/${id}`, h)).status);
    const { body } = await getJson('https://api.x.ai/v1/models', h);
    reportNew('grok', (body.data || []).map(m => m.id), id => !/(image|vision|imagine)/.test(id));
  },
  async groq(key) {
    // Groq ids contain "/", so check membership in the list instead of per-id.
    const { status, body } = await getJson('https://api.groq.com/openai/v1/models', { Authorization: `Bearer ${key}` });
    const served = new Set((body.data || []).map(m => m.id));
    await checkEach('groq', async id => (status !== 200 ? status : served.has(id) ? 200 : 404));
    reportNew('groq', [...served], id => !/(whisper|tts|guard|playai|orpheus|prompt-guard)/.test(id));
  },
  async ollama() {
    // Public registry — no key. A tag without ":" means ":latest".
    const accept = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' };
    await checkEach('ollama', async id => {
      const [name, tag = 'latest'] = id.split(':');
      const res = await fetch(`https://registry.ollama.ai/v2/library/${name}/manifests/${tag}`, { method: 'HEAD', headers: accept });
      return res.status;
    });
  },
};

const KEY_NAMES = { claude: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY', grok: 'XAI_API_KEY', groq: 'GROQ_API_KEY' };
const KEYS = { ...Object.fromEntries(Object.entries(KEY_NAMES).map(([pid, name]) => [pid, env[name]])), ollama: 'n/a' };

const fromFile = Object.entries(KEYS).filter(([pid, v]) => pid !== 'ollama' && v && !setInProcess[KEY_NAMES[pid]]).map(([pid]) => pid);
if (fromFile.length) console.log(`Using keys from .env for: ${fromFile.join(', ')}`);

for (const [pid, run] of Object.entries(CHECKS)) {
  if (!KEYS[pid]) { skipped.push(pid); continue; }
  console.log(`\n${pid}`);
  try { await run(KEYS[pid]); }
  catch (e) { console.log(`  ? request failed: ${e.message} (not counted as missing)`); }
}

if (skipped.length) console.log(`\nSkipped (no API key in env or .env): ${skipped.join(', ')}`);
let failed = false;
if (badKeys.size) {
  console.error(`\n✗ API key rejected for: ${[...badKeys].join(', ')}. These providers were not checked.`);
  console.error('  Update the matching repository secret (see .github/workflows/model-catalog.yml).');
  failed = true;
}
if (missing.length) {
  console.error(`\n✗ ${missing.length} catalog model(s) no longer served: ${missing.join(', ')}`);
  console.error('  Replace them in providers/models.js and add them to RETIRED_MODELS.');
  failed = true;
}
if (failed) process.exit(1);
console.log('\n✓ Every checked catalog model is still served.');
