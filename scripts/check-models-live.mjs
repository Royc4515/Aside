#!/usr/bin/env node
/**
 * Live check: is every catalog model still served by its provider?
 *
 *   ANTHROPIC_API_KEY=… OPENAI_API_KEY=… GEMINI_API_KEY=… XAI_API_KEY=… \
 *   GROQ_API_KEY=… node scripts/check-models-live.mjs
 *
 * Providers without a key are skipped (Ollama needs none — it's checked
 * against the public registry). Read-only: it only calls the providers'
 * model-metadata endpoints, never a completion, so it costs nothing.
 *
 * Exits 1 if any catalog id is no longer served. Also lists models the
 * provider serves that the catalog doesn't offer yet — candidates for the
 * next monthly tech update (docs/MONTHLY_UPDATE.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'providers/models.js'), 'utf8'), { self: sandbox });
const CATALOG = sandbox.PROVIDER_MODELS;

const env = process.env;
const missing = [];   // catalog ids a provider no longer serves
const skipped = [];

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// A model "exists" if the provider's metadata endpoint returns 200 for it.
async function checkEach(pid, exists) {
  const results = await Promise.all(CATALOG[pid].options.map(async o => [o.id, await exists(o.id)]));
  for (const [id, status] of results) {
    if (status === 200) console.log(`  ✓ ${id}`);
    else if (status === 404) { console.log(`  ✗ ${id} — not served (404)`); missing.push(`${pid}/${id}`); }
    else console.log(`  ? ${id} — HTTP ${status} (auth/rate limit? not counted as missing)`);
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

const KEYS = { claude: env.ANTHROPIC_API_KEY, openai: env.OPENAI_API_KEY, gemini: env.GEMINI_API_KEY, grok: env.XAI_API_KEY, groq: env.GROQ_API_KEY, ollama: 'n/a' };

for (const [pid, run] of Object.entries(CHECKS)) {
  if (!KEYS[pid]) { skipped.push(pid); continue; }
  console.log(`\n${pid}`);
  try { await run(KEYS[pid]); }
  catch (e) { console.log(`  ? request failed: ${e.message} (not counted as missing)`); }
}

if (skipped.length) console.log(`\nSkipped (no API key in env): ${skipped.join(', ')}`);
if (missing.length) {
  console.error(`\n✗ ${missing.length} catalog model(s) no longer served: ${missing.join(', ')}`);
  console.error('  Replace them in providers/models.js and add them to RETIRED_MODELS.');
  process.exit(1);
}
console.log('\n✓ Every checked catalog model is still served.');
