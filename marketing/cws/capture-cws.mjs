#!/usr/bin/env node
/**
 * Captures the Chrome Web Store screenshots (1280x800) from the real unpacked
 * extension (repo root): English summary, Hebrew/RTL page, compare mode,
 * provider picker and the Tools tab. Shots are taken at 2x and saved as
 * <name>-2x.png; downscale to 1280x800 for upload (see README.md here).
 *
 * No API key or network: Claude, OpenAI and Groq requests are answered by
 * local mock streams, so answer text is scripted but the UI is real.
 *
 * Usage (needs `playwright` resolvable, e.g. NODE_PATH):
 *   CHROME=/path/to/chrome node marketing/cws/capture-cws.mjs [outDir]
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ext = join(HERE, '..', '..');
const out = process.argv[2] || 'cws-out';
mkdirSync(out, { recursive: true });

const pages = { '/en': join(HERE, '..', 'og', 'article.html'), '/he': join(HERE, 'article-he.html') };
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(pages[req.url] || pages['/en']));
}).listen(8766);

const EN = [
  '**Sleep turns the day into long-term memory.**\n\n',
  '- **Replay:** during slow-wave sleep the hippocampus re-fires the day\'s patterns, compressed in time.\n',
  '- **Transfer:** replay locks onto cortical spindles and slow oscillations, moving memories into the neocortex.\n',
  '- **Causal:** weakening that coupling worsens recall; boosting it with timed sounds improves it.\n',
  '- **Pruning:** synapses strengthened while awake are scaled back overnight, saving energy and cutting noise.',
];
const EN_SHORT = [
  '**Sleep consolidates memory.**\n\n',
  '- Hippocampal replay during slow-wave sleep\n',
  '- Coupling with cortical spindles moves memories to the neocortex\n',
  '- Boosting that coupling improves recall',
];
const HE = [
  '**השינה הופכת את היום לזיכרון ארוך טווח.**\n\n',
  '- **חזרה:** בשנת גלים איטיים ההיפוקמפוס מריץ מחדש את דפוסי היום, דחוסים בזמן.\n',
  '- **העברה:** החזרה מתוזמנת מול כישורי שינה בקליפת המוח ומעבירה זיכרונות לניאוקורטקס.\n',
  '- **סיבתיות:** החלשת הצימוד פוגעת בזכירה, וחיזוקו בצלילים מתוזמנים משפר אותה.\n',
  '- **גיזום:** סינפסות שהתחזקו ביום נחלשות בלילה, וכך נחסכת אנרגיה ופוחת הרעש.',
];
const anthropic = (parts) => {
  const ev = (o) => `event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`;
  return ev({ type: 'message_start', message: { id: 'm', role: 'assistant', content: [] } })
    + ev({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
    + parts.map((t) => ev({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } })).join('')
    + ev({ type: 'content_block_stop', index: 0 }) + ev({ type: 'message_delta', delta: { stop_reason: 'end_turn' } })
    + ev({ type: 'message_stop' });
};
const openai = (parts) => parts.map((t) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: t } }] })}\n\n`).join('')
  + `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`;

const ctx = await chromium.launchPersistentContext('', {
  executablePath: process.env.CHROME || undefined, headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new', '--no-sandbox'],
  viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: 'light',
});
let answers = { claude: EN, openai: EN_SHORT, groq: HE };
const sse = (body) => ({ status: 200, headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' }, body });
await ctx.route('https://api.anthropic.com/**', (r) => r.fulfill(sse(anthropic(answers.claude))));
await ctx.route('https://api.openai.com/**', (r) => r.fulfill(sse(openai(answers.openai))));
await ctx.route('https://api.groq.com/**', (r) => r.fulfill(sse(openai(answers.groq))));

let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
await new Promise((r) => setTimeout(r, 1000));   // the worker's chrome.* APIs need a moment

const page = ctx.pages()[0] || await ctx.newPage();
async function open(path, settings, position = 'right') {
  await sw.evaluate((s) => chrome.storage.local.clear().then(() => chrome.storage.local.set({ 'aside._migratedToLocal': true, theme: 'light', ...s })), settings);
  await page.goto(`http://localhost:8766${path}`);
  await page.evaluate((pos) => { localStorage.setItem('aside.width', '470'); localStorage.setItem('aside.position', pos); }, position);
  await page.reload();
  await page.waitForTimeout(700);
  await sw.evaluate(async () => {
    const [t] = await chrome.tabs.query({ url: 'http://localhost:8766/*' });
    await chrome.tabs.sendMessage(t.id, { type: 'TOGGLE_SIDEBAR' });
  });
  await page.waitForTimeout(1500);
  const frame = page.frames().find((f) => f.url().includes('/sidebar/sidebar.html'));
  if (!frame) throw new Error('sidebar frame not found');
  return frame;
}
const shot = async (name) => { await page.mouse.move(5, 5); await page.screenshot({ path: join(out, `${name}-2x.png`) }); console.log('saved', name); };

// 1. Summarize an English article with Claude.
let f = await open('/en', { activeProvider: 'claude', apiKeys: { claude: 'mock' } });
await f.locator('.sb-suggest-btn[data-action="summarize"]').click();
await page.waitForTimeout(2500);
await shot('1-summarize');

// 2. Hebrew page: the sidebar follows the page into Hebrew and RTL. Docked on
// the left so it doesn't cover the right-aligned article; the question is
// typed, since quick-action labels in the chat bubble stay English.
f = await open('/he', { activeProvider: 'groq', apiKeys: { groq: 'mock' } }, 'left');
await f.locator('#ask-input').fill('סכם לי את הכתבה בכמה נקודות');
// Enter, not a click on the send button: headless Chromium doesn't route
// clicks to the lower part of the extension iframe (headed works fine).
await f.locator('#ask-input').press('Enter');
await page.waitForTimeout(500);
if (!(await f.locator('.sb-turn--user').count())) throw new Error('the Hebrew question did not send');
await page.waitForTimeout(2500);
await shot('2-hebrew-rtl');

// 3. Compare mode: one prompt, two providers.
f = await open('/en', { activeProvider: 'claude', apiKeys: { claude: 'mock', openai: 'mock' } });
answers = { ...answers, claude: EN.slice(0, 3) };
await f.locator('#compare-btn').click();
await page.waitForTimeout(400);
await f.locator('.sb-suggest-btn[data-action="summarize"]').click();
await page.waitForTimeout(3000);
await shot('3-compare');

// 4. Provider picker.
f = await open('/en', { activeProvider: 'claude', apiKeys: { claude: 'mock', openai: 'mock', gemini: 'mock', groq: 'mock' } });
await f.locator('#model-btn').click();
await page.waitForTimeout(600);
await shot('4-providers');

// 5. Tools tab: page and selection actions.
f = await open('/en', { activeProvider: 'claude', apiKeys: { claude: 'mock' } });
await f.locator('.sb-tab[data-tab="tools"]').click();
await page.waitForTimeout(600);
await shot('5-tools');

await ctx.close();
server.close();
