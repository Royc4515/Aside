/**
 * Screenshot generator for README / social media.
 * Usage: xvfb-run -a node take-screenshots.js
 * Output: screenshots/ directory
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http');
const path = require('path');
const fs   = require('fs');

const EXTENSION_PATH = '/home/user/ai-sidebar';
const CHROME_BIN     = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const USER_DATA      = '/tmp/screenshots-profile-' + Date.now();
const OUT_DIR        = '/home/user/ai-sidebar/screenshots';
const PORT           = 7892;

const wait = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Demo page — realistic article ─────────────────────────────────────────
const DEMO_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Future of AI Assistants — TechReview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #f9f7f4; color: #1a1a1a; line-height: 1.7; }
  header { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 14px 40px; display: flex; align-items: center; gap: 24px; }
  header .logo { font-family: 'Helvetica Neue', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: -0.5px; color: #111; }
  header nav a { font-family: sans-serif; font-size: 13px; color: #555; text-decoration: none; margin-right: 18px; }
  .hero-img { width: 100%; height: 220px; background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 50%, #4a9eda 100%); display: flex; align-items: center; justify-content: center; }
  .hero-img span { color: rgba(255,255,255,0.15); font-size: 80px; }
  article { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
  .tag { font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #2d6a9f; margin-bottom: 12px; }
  h1 { font-size: 36px; line-height: 1.2; font-weight: 700; margin-bottom: 16px; }
  .byline { font-family: sans-serif; font-size: 13px; color: #777; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
  p { margin-bottom: 20px; font-size: 18px; }
  h2 { font-size: 24px; font-weight: 700; margin: 40px 0 16px; }
  .highlight { background: #fffbe6; border-left: 3px solid #f59e0b; padding: 16px 20px; margin: 28px 0; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 28px 0; font-family: sans-serif; font-size: 14px; }
  th { background: #f0f4f8; text-align: left; padding: 10px 14px; border: 1px solid #dde; }
  td { padding: 10px 14px; border: 1px solid #dde; }
  tr:nth-child(even) td { background: #f9fafb; }
</style>
</head>
<body>
<header>
  <span class="logo">TechReview</span>
  <nav><a href="#">AI</a><a href="#">Products</a><a href="#">Opinion</a><a href="#">Research</a></nav>
</header>
<div class="hero-img"><span>🤖</span></div>
<article>
  <div class="tag">Artificial Intelligence</div>
  <h1>The Future of AI Assistants in Everyday Browsing</h1>
  <div class="byline">By Sarah Chen &nbsp;·&nbsp; May 2026 &nbsp;·&nbsp; 6 min read</div>

  <p>The way we interact with information on the web is undergoing a quiet revolution. Browser-integrated AI assistants — once the domain of enterprise tools and expensive plugins — are now available to anyone willing to bring their own API key.</p>

  <p>The appeal is straightforward: rather than copying text into a separate chat window, you get an AI that already knows what's on the page. Ask it to summarize, translate, or extract structured data, and it draws directly from the content in front of you.</p>

  <div class="highlight">"The best interface is one that doesn't make you leave the page you're already reading." — design principle behind Aside</div>

  <h2>What today's browser AI can do</h2>
  <p>Modern sidebar assistants go well beyond simple Q&amp;A. Users can trigger one-click actions — summarize into bullets, pull out all dates and prices, translate a foreign-language article — without typing a single word. The page content travels with every request.</p>

  <p>Language detection is another recent leap. When you open a Hebrew news article, the assistant can switch its own interface to Hebrew and respond in Hebrew automatically, with the layout flipping to right-to-left.</p>

  <h2>Provider landscape</h2>
  <table>
    <tr><th>Provider</th><th>Strengths</th><th>Best for</th></tr>
    <tr><td>Claude (Anthropic)</td><td>Long context, careful reasoning</td><td>Long-form analysis</td></tr>
    <tr><td>Gemini (Google)</td><td>Multimodal, fast flash model</td><td>Quick lookups</td></tr>
    <tr><td>GPT-4o (OpenAI)</td><td>Broad knowledge, coding</td><td>General purpose</td></tr>
    <tr><td>Groq</td><td>Ultra-fast inference</td><td>Low-latency chat</td></tr>
    <tr><td>Ollama</td><td>Fully local, private</td><td>Sensitive content</td></tr>
  </table>

  <p>The ability to switch providers on the fly — without leaving the page, without reconfiguring anything — is increasingly seen as a core feature rather than a nice-to-have.</p>

  <h2>What's next</h2>
  <p>The next wave is likely to bring per-domain memory, inline annotation, and deeper integration with form-filling and reading queues. But the foundational pattern — an AI that lives beside the page rather than replacing it — seems here to stay.</p>
</article>
</body>
</html>`;

// ── Mock Claude SSE ────────────────────────────────────────────────────────
function mockSseBody(text) {
  const words = text.split(' ');
  return words
    .map(w => `data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"${w.replace(/"/g, '\\"')} "}}`)
    .join('\n\n')
    + '\n\ndata: {"type":"message_stop"}\n\ndata: [DONE]\n\n';
}

const SUMMARY_RESPONSE = `## Summary

**The Future of AI Assistants in Everyday Browsing** explores how browser-integrated AI is becoming mainstream.

**Key points:**
- Sidebar AI assistants let users interact with page content without leaving the tab
- One-click actions (summarize, translate, extract) work directly on visible content
- Language auto-detection now switches the sidebar's UI and responses to match the page language
- Five major providers (Claude, Gemini, GPT-4o, Groq, Ollama) each have different strengths
- Switching providers on the fly is now considered a core feature
- Next wave: per-domain memory, inline annotations, and reading queue integration`;

// ── Start local server ─────────────────────────────────────────────────────
const startServer = () => new Promise(resolve => {
  const srv = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DEMO_PAGE);
  });
  srv.listen(PORT, '127.0.0.1', () => resolve(srv));
});

async function shot(frame, page, name, opts = {}) {
  const target = opts.full ? page : (opts.sidebar ? frame.locator('#app') : page);
  const clipEl = opts.clip;
  const shotPath = path.join(OUT_DIR, `${name}.png`);

  if (opts.sidebar) {
    // Screenshot the sidebar iframe content area
    const box = await page.evaluate(() => {
      const host = document.getElementById('aside-sidebar-host');
      if (!host) return null;
      const r = host.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (box) {
      await page.screenshot({ path: shotPath, clip: box });
    }
  } else if (opts.clip) {
    await page.screenshot({ path: shotPath, clip: opts.clip });
  } else {
    await page.screenshot({ path: shotPath });
  }
  console.log(`  📸  ${name}.png`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const server = await startServer();
  let ctx;

  try {
    ctx = await chromium.launchPersistentContext(USER_DATA, {
      executablePath: CHROME_BIN,
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox',
        '--window-size=1400,900',
        '--force-device-scale-factor=1',
      ],
      viewport: { width: 1400, height: 900 },
    });

    // Wait for SW
    let sw = ctx.serviceWorkers()[0];
    if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => ctx.serviceWorkers()[0]);
    await wait(1500);

    // Inject mock settings
    await sw.evaluate(() =>
      new Promise(r => chrome.storage.sync.set({
        activeProvider: 'claude',
        apiKeys: { claude: 'sk-ant-mock-screenshot-key' },
        selectedModels: { claude: 'claude-sonnet-4-6' },
        language: 'auto',
      }, r))
    );

    // Intercept API
    await ctx.route('**/api.anthropic.com/**', route =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: mockSseBody(SUMMARY_RESPONSE),
      })
    );

    const page = await ctx.newPage();
    page.on('pageerror', e => console.error('  [err]', e.message));

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await wait(2000);

    const tabId = await sw.evaluate(async (port) => {
      const tabs = await new Promise(r => chrome.tabs.query({}, r));
      return tabs.find(t => t.url?.includes(`127.0.0.1:${port}`))?.id ?? null;
    }, PORT);

    const toggle = () => sw.evaluate(id =>
      new Promise(r => chrome.tabs.sendMessage(id, { type: 'TOGGLE_SIDEBAR' }, r))
    , tabId);

    // ── Shot 1: Page alone (no sidebar) ───────────────────────────────────
    console.log('\n── Taking screenshots ──\n');
    await page.screenshot({ path: path.join(OUT_DIR, '01-page-alone.png') });
    console.log('  📸  01-page-alone.png');

    // ── Open sidebar ──────────────────────────────────────────────────────
    await toggle();
    await wait(1800);
    const frame = page.frameLocator('#aside-sidebar-frame');
    await frame.locator('#hero').waitFor({ state: 'visible', timeout: 8000 });

    // ── Shot 2: Full page + sidebar (hero state) ──────────────────────────
    await page.screenshot({ path: path.join(OUT_DIR, '02-sidebar-hero.png') });
    console.log('  📸  02-sidebar-hero.png');

    // ── Shot 3: Sidebar only — hero ───────────────────────────────────────
    await shot(frame, page, '03-sidebar-only-hero', { sidebar: true });

    // ── Shot 4: Switch to Tools tab ───────────────────────────────────────
    await frame.locator('.sb-tab[data-tab="tools"]').click();
    await wait(500);
    await shot(frame, page, '04-sidebar-tools', { sidebar: true });

    // ── Shot 5: Full page + sidebar — tools tab ───────────────────────────
    await page.screenshot({ path: path.join(OUT_DIR, '05-page-tools.png') });
    console.log('  📸  05-page-tools.png');

    // ── Shot 6: Trigger a summary ─────────────────────────────────────────
    await frame.locator('.sb-tab[data-tab="chat"]').click();
    await wait(300);
    await frame.locator('.sb-suggest-btn').first().click(); // "Summarize this page"
    await wait(3500); // let the mock stream complete

    await shot(frame, page, '06-sidebar-response', { sidebar: true });

    // ── Shot 7: Full page + sidebar — response ────────────────────────────
    await page.screenshot({ path: path.join(OUT_DIR, '07-page-response.png') });
    console.log('  📸  07-page-response.png');

    // ── Shot 8: Open language picker ──────────────────────────────────────
    const langBtn = frame.locator('#lang-btn');
    const langBtnExists = await langBtn.count();
    if (langBtnExists) {
      await langBtn.click();
      await wait(400);
      await shot(frame, page, '08-lang-picker', { sidebar: true });
      // close it
      await page.keyboard.press('Escape');
      await wait(300);
    }

    // ── Shot 9: Model picker ──────────────────────────────────────────────
    const modelBtn = frame.locator('#model-btn');
    const modelExists = await modelBtn.count();
    if (modelExists) {
      await modelBtn.click();
      await wait(400);
      await shot(frame, page, '09-model-picker', { sidebar: true });
      await page.keyboard.press('Escape');
      await wait(300);
    }

    console.log('\n✅  Done. Screenshots saved to:', OUT_DIR);
    console.log(fs.readdirSync(OUT_DIR).map(f => `   ${f}`).join('\n'));

  } finally {
    await ctx?.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
