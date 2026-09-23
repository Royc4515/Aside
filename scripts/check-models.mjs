#!/usr/bin/env node
/**
 * Static consistency check for the model catalog. No network, no deps.
 *
 *   node scripts/check-models.mjs
 *
 * Verifies that providers/models.js is well-formed and that every other place
 * that names a model (provider fallbacks, README, ARCHITECTURE, landing site,
 * UI fallback labels) agrees with it. Exits 1 on any problem, so it can gate
 * CI and the monthly tech update (docs/MONTHLY_UPDATE.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

// ── Load the catalog exactly as the extension does (it assigns onto `self`) ──
const sandbox = {};
vm.runInNewContext(read('providers/models.js'), { self: sandbox }, { filename: 'providers/models.js' });
const CATALOG = sandbox.PROVIDER_MODELS;
const RETIRED = sandbox.RETIRED_MODELS || {};
const PROVIDERS = ['claude', 'openai', 'gemini', 'grok', 'groq', 'ollama'];

// ── 1. Catalog shape ─────────────────────────────────────────────────────────
for (const pid of PROVIDERS) {
  const entry = CATALOG[pid];
  if (!entry) { fail('providers/models.js', `missing provider "${pid}"`); continue; }
  const ids = entry.options.map(o => o.id);
  if (!ids.includes(entry.default)) fail('providers/models.js', `${pid}: default "${entry.default}" is not one of its options`);
  if (new Set(ids).size !== ids.length) fail('providers/models.js', `${pid}: duplicate option ids`);
  for (const o of entry.options) {
    if (!o.id || !o.label) fail('providers/models.js', `${pid}: option without id/label`);
  }
  for (const [oldId, newId] of Object.entries(RETIRED[pid] || {})) {
    if (ids.includes(oldId)) fail('providers/models.js', `${pid}: "${oldId}" is marked retired but still offered`);
    if (!ids.includes(newId)) fail('providers/models.js', `${pid}: retired "${oldId}" points to "${newId}", which is not in the catalog`);
  }
}

// ── 2. Provider constructors fall back to the catalog default ────────────────
for (const pid of PROVIDERS) {
  const file = `providers/${pid}-provider.js`;
  const src = read(file);
  const m = src.match(/model \|\| '([^']+)'/);
  if (!m) fail(file, 'could not find the `model || \'…\'` fallback');
  else if (m[1] !== CATALOG[pid].default) fail(file, `fallback model "${m[1]}" ≠ catalog default "${CATALOG[pid].default}"`);
}
{
  const m = read('providers/groq-provider.js').match(/fallbackModel = '([^']+)'/);
  if (m && !CATALOG.groq.options.some(o => o.id === m[1])) {
    fail('providers/groq-provider.js', `fallbackModel "${m[1]}" is not in the Groq catalog`);
  }
}

// ── 3. Docs tables mirror the catalog ────────────────────────────────────────
const tableRow = (text, name) => text.split('\n').find(l => l.startsWith(`| **${name}**`));
const DOC_NAMES = { claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini', grok: 'Grok', groq: 'Groq', ollama: 'Ollama' };
{
  const readme = read('README.md');
  for (const pid of PROVIDERS) {
    const row = tableRow(readme, DOC_NAMES[pid]);
    if (!row) { fail('README.md', `no Providers-table row for ${DOC_NAMES[pid]}`); continue; }
    if (!row.includes(`\`${CATALOG[pid].default}\``)) fail('README.md', `${DOC_NAMES[pid]} row doesn't show default \`${CATALOG[pid].default}\``);
  }
  const arch = read('docs/ARCHITECTURE.md');
  for (const pid of PROVIDERS) {
    const row = tableRow(arch, DOC_NAMES[pid]);
    if (!row) { fail('docs/ARCHITECTURE.md', `no Provider-matrix row for ${DOC_NAMES[pid]}`); continue; }
    const cells = row.split('|').map(c => c.trim());
    if (!cells[2]?.includes(`\`${CATALOG[pid].default}\``)) fail('docs/ARCHITECTURE.md', `${DOC_NAMES[pid]} default column ≠ \`${CATALOG[pid].default}\``);
    for (const o of CATALOG[pid].options) {
      if (!row.includes(`\`${o.id}\``)) fail('docs/ARCHITECTURE.md', `${DOC_NAMES[pid]} row is missing \`${o.id}\``);
    }
  }
}

// ── 4. No stale model names anywhere user-facing ─────────────────────────────
// Any model id or human model name mentioned outside the catalog must be one
// the catalog still offers. Historical files (changelog, runbook) are exempt.
const allIds = new Set(PROVIDERS.flatMap(pid => CATALOG[pid].options.map(o => o.id)));
const allLabels = PROVIDERS.flatMap(pid => CATALOG[pid].options.map(o => o.label)).join(' | ');

const ID_PATTERNS = [
  /\bclaude-(?:fable|mythos|opus|sonnet|haiku|\d)[a-z0-9-]*/g,
  /\bgpt-\d[a-z0-9.-]*/g,
  /\bgemini-\d[a-z0-9.-]*/g,
  /\bgrok-\d[a-z0-9.-]*/g,
  /\b(?:meta-llama|openai|qwen|moonshotai|groq|deepseek-ai|mistralai|google)\/[a-z0-9.-]+/g,
];
// Human names → the catalog must contain a label with the same text.
const LABEL_PATTERNS = [
  /\b(?:Fable|Mythos|Opus|Sonnet|Haiku) \d+(?:\.\d+)?/g,
  /\bGPT-\d[\w.]*(?: mini| nano)?/g,
  /\bGemini \d+(?:\.\d+)? (?:Flash-Lite|Flash|Pro)/g,
  /\bGrok \d+(?:\.\d+)?(?: mini| Fast)?/g,
];

const SCAN_DIRS = ['README.md', 'docs', 'site', 'sidebar', 'options', 'popup', '_locales', 'background.js', 'content'];
const EXEMPT = new Set(['CHANGELOG.md', 'docs/MONTHLY_UPDATE.md']);
const SCAN_EXT = /\.(md|html|js|json)$/;

function* walk(p) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isFile()) { yield abs; return; }
  for (const name of fs.readdirSync(abs)) yield* walk(path.join(p, name));
}

for (const target of SCAN_DIRS) {
  for (const file of walk(target)) {
    const r = rel(file);
    if (EXEMPT.has(r) || !SCAN_EXT.test(r)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const re of ID_PATTERNS) {
        for (const [id] of line.matchAll(re)) {
          const clean = id.replace(/[.-]+$/, '');
          if (!allIds.has(clean)) fail(`${r}:${i + 1}`, `mentions model id "${clean}", which is not in the catalog`);
        }
      }
      for (const re of LABEL_PATTERNS) {
        for (const [name] of line.matchAll(re)) {
          if (!allLabels.includes(name)) fail(`${r}:${i + 1}`, `mentions "${name}", which matches no catalog label`);
        }
      }
    });
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`✗ Model catalog check failed (${problems.length}):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const counts = PROVIDERS.map(pid => `${pid} ${CATALOG[pid].options.length}`).join(', ');
console.log(`✓ Model catalog consistent (${counts}).`);
