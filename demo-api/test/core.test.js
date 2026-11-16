// Every test runs handleAsk with a mocked fetch: no network, no keys, no money.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAsk } from '../lib/core.js';
import { DEMO_MODELS } from '../lib/catalog.generated.js';

const ORIGIN = 'https://royc4515.github.io';
const ENV = { DEMO_SALT: 'pepper', GROQ_API_KEY: 'k-groq', GEMINI_API_KEY: 'k-gemini', ANTHROPIC_API_KEY: 'k-claude',
  UPSTASH_REDIS_REST_URL: 'https://store.test', UPSTASH_REDIS_REST_TOKEN: 'k-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const UPSTREAM = {
  groq: () => json({ choices: [{ message: { content: 'groq says hi' } }] }),
  gemini: () => json({ candidates: [{ content: { parts: [{ text: 'thinking', thought: true }, { text: 'gemini says hi' }] } }] }),
  claude: () => json({ content: [{ type: 'thinking', thinking: 'hm' }, { type: 'text', text: 'claude says hi' }] }),
};

/** A fake Redis plus fake providers. `over` replaces one provider's reply; `storeDown` breaks the store. */
function world({ over = {}, storeDown = false, counts = {} } = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    const host = new URL(url).host;
    calls.push({ url: String(url), init });
    if (host === 'store.test') {
      if (storeDown) return json({ error: 'down' }, 500);
      return json(JSON.parse(init.body).map(([cmd, key, n]) => ({ result: cmd === 'INCRBY' ? (counts[key] = (counts[key] || 0) + n) : 1 })));
    }
    const id = host.includes('groq') ? 'groq' : host.includes('google') ? 'gemini' : 'claude';
    return (over[id] || UPSTREAM[id])();
  };
  const called = (name) => calls.filter((c) => c.url.includes(name)).length;
  return { fetch, calls, counts, called };
}

function ask(w, { body = { question: 'Is Aside free?', lang: 'en' }, env = ENV, country = 'IL', origin = ORIGIN, method = 'POST', ip = '1.2.3.4', headers: extra = {} } = {}) {
  const headers = { origin, 'x-forwarded-for': ip, 'content-type': 'application/json', ...extra };
  if (country) headers['x-vercel-ip-country'] = country;
  const request = new Request('https://demo.test/api/ask', { method, headers, body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined });
  return handleAsk(request, { env, fetch: w.fetch, now: () => new Date('2026-11-16T10:00:00Z') });
}

test('answers from the first free provider and says which model answered', async () => {
  const w = world();
  const res = await ask(w);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { answer: 'groq says hi', provider: 'groq', model: DEMO_MODELS.groq[0].label });
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(w.called('googleapis') + w.called('anthropic'), 0);
});

test('the server owns the context: client-sent context and system text are ignored', async () => {
  const w = world();
  await ask(w, { body: { question: 'Is Aside free?', lang: 'he', context: 'EVIL-CONTEXT', system: 'EVIL-SYSTEM' } });
  const sent = w.calls.find((c) => c.url.includes('groq')).init.body;
  assert.ok(!sent.includes('EVIL'));
  assert.ok(sent.includes('Reply in Hebrew'));
  assert.ok(sent.includes('Facts about Aside'));
});

test('a rate-limited provider falls through to the next one', async () => {
  const w = world({ over: { groq: () => json({ error: 'rate' }, 429) } });
  assert.equal((await (await ask(w)).json()).provider, 'gemini');
  const gemini = w.calls.find((c) => c.url.includes('googleapis'));
  assert.ok(!gemini.url.includes('key='), 'the Gemini key must not be in the URL');
  assert.equal(gemini.init.headers['x-goog-api-key'], 'k-gemini');
});

test('thinking parts are not shown as the answer', async () => {
  const w = world({ over: { groq: () => json({}, 500) } });
  assert.equal((await (await ask(w)).json()).answer, 'gemini says hi');
  const w2 = world({ over: { groq: () => json({}, 500), gemini: () => json({}, 500) } });
  assert.equal((await (await ask(w2)).json()).answer, 'claude says hi');
});

test('Gemini free tier is skipped for the EEA, the UK, Switzerland and unknown countries', async () => {
  for (const country of ['DE', 'GB', 'CH', 'NO', '']) {
    const w = world({ over: { groq: () => json({}, 429) } });
    assert.equal((await (await ask(w, { country })).json()).provider, 'claude', country || 'unknown');
    assert.equal(w.called('googleapis'), 0);
  }
});

test('Claude is never called without its key', async () => {
  const w = world({ over: { groq: () => json({}, 429), gemini: () => json({}, 429) } });
  const res = await ask(w, { env: { ...ENV, ANTHROPIC_API_KEY: '' } });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { fallback: true, reason: 'unavailable' });
  assert.equal(w.called('anthropic'), 0);
});

test('Claude has its own daily cap', async () => {
  const w = world({ over: { groq: () => json({}, 429), gemini: () => json({}, 429) }, counts: { 'demo:claude:2026-11-16': 30 } });
  assert.equal((await ask(w)).status, 503);
  assert.equal(w.called('anthropic'), 0);
});

test('per-visitor cap: the eleventh call of the day gets no model call', async () => {
  const w = world();
  for (let i = 0; i < 10; i++) assert.equal((await ask(w)).status, 200);
  const res = await ask(w);
  assert.equal(res.status, 429);
  assert.equal((await res.json()).reason, 'visitor_cap');
  assert.equal(w.called('groq'), 10);
  assert.equal((await ask(w, { ip: '5.6.7.8' })).status, 200, 'another visitor is not affected');
});

test('global daily cap', async () => {
  const w = world({ counts: { 'demo:all:2026-11-16': 300 } });
  const res = await ask(w);
  assert.equal((await res.json()).reason, 'daily_cap');
  assert.equal(w.called('groq'), 0);
});

test('caps are configurable, and 0 turns live answers off', async () => {
  const w = world();
  const res = await ask(w, { env: { ...ENV, DEMO_ALL_VISITORS_PER_DAY: '0' } });
  assert.equal(res.status, 429);
  assert.equal(w.called('groq'), 0);
});

test('fails closed when the store is missing or down', async () => {
  const noStore = world();
  const { UPSTASH_REDIS_REST_URL, ...env } = ENV;
  assert.equal((await (await ask(noStore, { env })).json()).reason, 'no_store');
  const down = world({ storeDown: true });
  assert.equal((await (await ask(down)).json()).reason, 'store_error');
  assert.equal(noStore.called('groq') + down.called('groq'), 0);
});

test('Vercel\'s own IP header wins over a forwarded-for header', async () => {
  const w = world();
  const forged = (n) => ask(w, { ip: `9.9.9.${n}`, headers: { 'x-vercel-forwarded-for': '1.2.3.4' } });
  for (let i = 0; i < 10; i++) assert.equal((await forged(i)).status, 200);
  assert.equal((await forged(9)).status, 429, 'a new x-forwarded-for each time must not reset the cap');
});

test('DEMO_PROVIDERS picks and orders providers', async () => {
  const only = world();
  assert.equal((await (await ask(only, { env: { ...ENV, DEMO_PROVIDERS: 'claude' } })).json()).provider, 'claude');
  assert.equal(only.called('groq') + only.called('googleapis'), 0);
  const off = world({ over: { groq: () => json({}, 429), gemini: () => json({}, 429) } });
  assert.equal((await ask(off, { env: { ...ENV, DEMO_PROVIDERS: ' Groq , gemini, bogus' } })).status, 503);
  assert.equal(off.called('anthropic'), 0, 'Claude stays off when it is not listed');
  const junk = world();
  assert.equal((await (await ask(junk, { env: { ...ENV, DEMO_PROVIDERS: 'bogus' } })).json()).provider, 'groq', 'nothing valid: default order');
});

test('the store never sees an IP address', async () => {
  const w = world();
  await ask(w);
  assert.ok(Object.keys(w.counts).every((k) => !k.includes('1.2.3.4')));
});

test('rejects other origins, bad methods and bad input before spending anything', async () => {
  const w = world();
  assert.equal((await ask(w, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await ask(w, { origin: '' })).status, 403);
  assert.equal((await ask(w, { method: 'GET' })).status, 405);
  assert.equal((await ask(w, { body: 'not json' })).status, 400);
  assert.equal((await ask(w, { body: { question: 'x'.repeat(301) } })).status, 400);
  assert.equal((await ask(w, { body: { question: ' ' } })).status, 400);
  assert.equal((await ask(w, { body: { question: 42 } })).status, 400);
  assert.equal((await ask(w, { body: 'x'.repeat(3000) })).status, 413);
  assert.equal(w.calls.length, 0);
});

test('CORS preflight', async () => {
  const res = await ask(world(), { method: 'OPTIONS' });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
});

test('not configured: no provider keys means no store call either', async () => {
  const w = world();
  const res = await ask(w, { env: { DEMO_SALT: 'pepper', UPSTASH_REDIS_REST_URL: ENV.UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN: 'k' } });
  assert.equal((await res.json()).reason, 'not_configured');
  assert.equal(w.calls.length, 0);
});

test('an answer cut off by the token cap is not shown; the next provider answers', async () => {
  const w = world({ over: {
    groq: () => json({ choices: [{ finish_reason: 'length', message: { content: 'half an ans' } }] }),
    gemini: () => json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'half' }] } }] }),
  } });
  assert.equal((await (await ask(w)).json()).answer, 'claude says hi');
  const cut = world({ over: { groq: () => json({}, 500), gemini: () => json({}, 500), claude: () => json({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'half' }] }) } });
  assert.equal((await ask(cut)).status, 503);
});

test('refuses to run without the salt that keeps the visitor hash one-way', async () => {
  const w = world();
  const res = await ask(w, { env: { ...ENV, DEMO_SALT: '' } });
  assert.equal((await res.json()).reason, 'not_configured');
  assert.equal(w.calls.length, 0);
});

test('no response ever contains a key', async () => {
  const w = world({ over: { groq: () => json({ error: 'bad key k-groq' }, 401), gemini: () => json({ error: 'k-gemini' }, 403), claude: () => json({ error: 'k-claude' }, 401) } });
  const text = await (await ask(w)).text();
  assert.ok(!/k-(groq|gemini|claude|store)/.test(text));
});

test('a very long answer is cut', async () => {
  const w = world({ over: { groq: () => json({ choices: [{ message: { content: 'a'.repeat(5000) } }] }) } });
  assert.equal((await (await ask(w)).json()).answer.length, 1200);
});

// ── The visitor's own pick, and compare ─────────────────────────────────────

const K = { g120: 'groq:openai/gpt-oss-120b', g20: 'groq:openai/gpt-oss-20b', lite: 'gemini:gemini-3.5-flash-lite', flash: 'gemini:gemini-3.8-flash', haiku: 'claude:claude-haiku-5-5', sonnet: 'claude:claude-sonnet-5-5' };
const pick = (...models) => ({ body: { question: 'Is Aside free?', lang: 'en', models } });
const sentModel = (w, host) => JSON.parse(w.calls.find((c) => c.url.includes(host)).init.body).model;

test('every pick key exists in the generated catalog', () => {
  const keys = Object.values(DEMO_MODELS).flat().map((m) => m.key);
  assert.deepEqual(Object.values(K).sort(), keys.sort());
});

test('a single pick calls exactly that model', async () => {
  const w = world();
  const { answers } = await (await ask(w, pick(K.sonnet))).json();
  assert.equal(answers.length, 1);
  assert.equal(answers[0].key, K.sonnet);
  assert.equal(answers[0].provider, 'claude');
  assert.equal(sentModel(w, 'anthropic'), 'claude-sonnet-5-5');
  assert.equal(w.called('groq') + w.called('googleapis'), 0);
  const w2 = world();
  await ask(w2, pick(K.flash));
  assert.ok(w2.calls.find((c) => c.url.includes('googleapis')).url.includes('/models/gemini-3.8-flash:generateContent'));
});

test('compare runs two models side by side and counts two calls', async () => {
  const w = world();
  const { answers } = await (await ask(w, pick(K.g20, K.haiku))).json();
  assert.deepEqual(answers.map((a) => a.key), [K.g20, K.haiku]);
  assert.deepEqual(answers.map((a) => a.answer), ['groq says hi', 'claude says hi']);
  assert.equal(sentModel(w, 'groq'), 'openai/gpt-oss-20b');
  assert.equal(w.counts['demo:all:2026-11-16'], 2);
  assert.equal(w.counts['demo:claude:2026-11-16'], 1);
});

test('unknown, unlisted, malformed or duplicate picks are refused before anything is counted', async () => {
  for (const models of [['claude:claude-opus-5-5'], ['openai/gpt-oss-120b'], ['groq:../../evil'], [K.g20, K.g20], [K.g20, K.lite, K.haiku], [], 'groq', [42], { 0: K.g20 }]) {
    const w = world();
    const res = await ask(w, { body: { question: 'Is Aside free?', models } });
    assert.equal(res.status, 400, JSON.stringify(models));
    assert.equal((await res.json()).reason, 'bad_model');
    assert.equal(w.calls.length, 0);
  }
});

test('a failed single pick falls back to a free provider and says so; never to Claude', async () => {
  const w = world({ over: { gemini: () => json({}, 429) } });
  const { answers } = await (await ask(w, pick(K.flash))).json();
  assert.equal(answers[0].provider, 'groq');
  assert.equal(answers[0].requested, K.flash);
  assert.equal(answers[0].notice, 'unavailable');
  const w2 = world({ over: { groq: () => json({}, 429), gemini: () => json({}, 429) } });
  assert.equal((await ask(w2, pick(K.g120))).status, 503);
  assert.equal(w2.called('anthropic'), 0);
});

test('a failed side of a comparison stays failed; the other side still answers', async () => {
  const w = world({ over: { claude: () => json({}, 500) } });
  const { answers } = await (await ask(w, pick(K.g120, K.sonnet))).json();
  assert.equal(answers[0].answer, 'groq says hi');
  assert.deepEqual(answers[1], { error: 'unavailable', key: K.sonnet });
  assert.equal(w.called('groq'), 1, 'no stand-in for the failed side');
});

test('Gemini picked from a blocked region: the reason is "region"', async () => {
  const w = world();
  const { answers } = await (await ask(w, { ...pick(K.lite, K.g20), country: 'FR' })).json();
  assert.deepEqual(answers[0], { error: 'region', key: K.lite });
  assert.equal(w.called('googleapis'), 0);
  const single = await (await ask(world(), { ...pick(K.lite), country: '' })).json();
  assert.equal(single.answers[0].notice, 'region');
  assert.equal(single.answers[0].provider, 'groq');
});

test('each provider has its own daily cap', async () => {
  const w = world({ counts: { 'demo:gemini:2026-11-16': 200 } });
  const { answers } = await (await ask(w, pick(K.lite, K.g20))).json();
  assert.deepEqual(answers[0], { error: 'cap', key: K.lite });
  assert.equal(w.called('googleapis'), 0);
  const c = world({ counts: { 'demo:claude:2026-11-16': 30 } });
  assert.equal((await (await ask(c, pick(K.haiku, K.sonnet))).json()).reason, 'cap');
  assert.equal(c.called('anthropic'), 0);
});

test('a provider switched off by DEMO_PROVIDERS or without a key cannot be picked into a call', async () => {
  const w = world();
  const { answers } = await (await ask(w, { ...pick(K.haiku, K.g20), env: { ...ENV, DEMO_PROVIDERS: 'groq,gemini' } })).json();
  assert.equal(answers[0].error, 'unavailable');
  const w2 = world();
  await ask(w2, { ...pick(K.sonnet), env: { ...ENV, ANTHROPIC_API_KEY: '' } });
  assert.equal(w.called('anthropic') + w2.called('anthropic'), 0);
});

test('compare counts against the visitor cap as two', async () => {
  const w = world();
  for (let i = 0; i < 5; i++) assert.equal((await ask(w, pick(K.g20, K.lite))).status, 200);
  assert.equal((await (await ask(w, pick(K.g20))).json()).reason, 'visitor_cap');
});

test('no answer from either side of a comparison: fallback', async () => {
  const w = world({ over: { groq: () => json({}, 500), gemini: () => json({}, 500) } });
  const res = await ask(w, pick(K.g20, K.lite));
  assert.equal(res.status, 503);
  assert.equal((await res.json()).fallback, true);
});
