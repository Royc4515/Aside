#!/usr/bin/env node
/**
 * Captures site/assets/img/og-card.png, the social share image: a real
 * screenshot of the unpacked extension (repo root) open on article.html.
 *
 * No API key or network: the Claude request is answered by a local mock
 * stream, so the answer text is scripted but every pixel is the real sidebar.
 * The sidebar is set to 470px because at the default 420px the header
 * crowds the "Aside" name.
 *
 * Usage (needs `playwright` resolvable, e.g. NODE_PATH, and Python Pillow):
 *   CHROME=/path/to/chrome node marketing/og/capture-og.mjs
 *   python3 -c "from PIL import Image; Image.open('og-raw.png').convert('RGB')\
 *     .resize((1200,630), Image.LANCZOS).save('site/assets/img/og-card.png', optimize=True)"
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ext = join(HERE, '..', '..');
const out = process.argv[2] || 'og-raw.png';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(join(HERE, 'article.html')));
}).listen(8765);

const answer = [
  '**Sleep turns the day into long-term memory.**\n\n',
  '- **Replay:** during slow-wave sleep the hippocampus re-fires the day\'s patterns, compressed in time.\n',
  '- **Transfer:** replay locks onto cortical spindles and slow oscillations, moving memories into the neocortex.\n',
  '- **Causal:** weakening that coupling worsens recall; boosting it with timed sounds improves it.\n',
  '- **Pruning:** synapses strengthened while awake are scaled back overnight, saving energy and cutting noise.',
];
const sse = () => {
  const ev = (o) => `event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`;
  let body = ev({ type: 'message_start', message: { id: 'm', role: 'assistant', content: [] } });
  body += ev({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
  for (const t of answer) body += ev({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } });
  body += ev({ type: 'content_block_stop', index: 0 });
  body += ev({ type: 'message_delta', delta: { stop_reason: 'end_turn' } });
  body += ev({ type: 'message_stop' });
  return body;
};

const ctx = await chromium.launchPersistentContext('', {
  executablePath: process.env.CHROME || undefined,
  headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new', '--no-sandbox'],
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
await ctx.route('https://api.anthropic.com/**', (route) =>
  route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' }, body: sse() }));

let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
await sw.evaluate(() => chrome.storage.local.set({
  'aside._migratedToLocal': true,
  activeProvider: 'claude',
  apiKeys: { claude: 'sk-ant-mock-not-a-real-key' },
  theme: 'light',
}));

const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('http://localhost:8765/article.html');
await page.evaluate(() => localStorage.setItem('aside.width', '470'));
await page.reload();
await page.waitForTimeout(800);
await sw.evaluate(async () => {
  const [t] = await chrome.tabs.query({ url: 'http://localhost:8765/*' });
  await chrome.tabs.sendMessage(t.id, { type: 'TOGGLE_SIDEBAR' });
});
await page.waitForTimeout(1500);
const frame = page.frames().find((f) => f.url().includes('/sidebar/sidebar.html'));
if (!frame) throw new Error('sidebar frame not found');
await frame.getByText('Summarize this page', { exact: false }).first().click();
await page.waitForTimeout(2500);
await page.mouse.move(10, 10);
await page.screenshot({ path: out });
await ctx.close();
server.close();
console.log('saved', out);
