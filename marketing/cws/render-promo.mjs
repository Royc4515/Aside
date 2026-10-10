#!/usr/bin/env node
/**
 * Renders the Chrome Web Store promo images from promo.html:
 *   small-tile.png (440x280) and marquee.png (1400x560).
 * The marquee shows sidebar-crop.png, the sidebar cut from screenshot 1
 * (capture-cws.mjs), so run that first and crop with:
 *   python3 -c "from PIL import Image; Image.open('1-summarize-2x.png').crop((1620,0,2560,1600)).save('sidebar-crop.png')"
 *
 * Usage (needs `playwright` resolvable): CHROME=/path/to/chrome node marketing/cws/render-promo.mjs
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
for (const [size, w, h, file] of [['small', 440, 280, 'small-tile.png'], ['marquee', 1400, 560, 'marquee.png']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${pathToFileURL(join(HERE, 'promo.html'))}?size=${size}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(HERE, file) });
  console.log('saved', file);
}
await browser.close();
