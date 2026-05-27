// One-off image optimization for landing/assets/.
//
// Generates WebP + PNG fallbacks at 1920w (2x retina) and 960w (1x).
// Also composes a 1200x630 og-card.png from the light hero.
//
// Run from repo root:
//   npm install --no-save sharp
//   node scripts/optimize-landing-images.mjs
//
// node_modules is NOT committed; sharp lives only for the duration of the
// script. The generated images ARE committed.

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ASSETS = 'landing/assets';
const SOURCES = [
  'hero-light.png',
  'hero-dark.png',
  'features-light.png',
  'features-dark.png',
  'providers-light.png',
  'providers-dark.png',
  'dark-light.png',
];
const WIDTHS = [1920, 960];

async function optimize() {
  for (const name of SOURCES) {
    const src = path.join(ASSETS, name);
    const stem = name.replace(/\.png$/, '');
    for (const w of WIDTHS) {
      const webp = path.join(ASSETS, `${stem}-${w}.webp`);
      const png = path.join(ASSETS, `${stem}-${w}.png`);
      await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(webp);
      await sharp(src).resize({ width: w, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toFile(png);
      console.log(`  -> ${webp}`);
      console.log(`  -> ${png}`);
    }
  }
}

async function ogCard() {
  // Composite: brand-tinted background + cropped hero screenshot on the right.
  // Text fills the left ~640px; hero is constrained to the right ~480px so they
  // never overlap.
  const W = 1200, H = 630;
  const HERO_MAX_W = 480;
  const HERO_MAX_H = 420;
  const PAD = 56;

  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 253, g: 252, b: 250, alpha: 1 } },
  }).png().toBuffer();

  const heroBuf = await sharp(path.join(ASSETS, 'hero-light.png'))
    .resize({ width: HERO_MAX_W, height: HERO_MAX_H, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const heroMeta = await sharp(heroBuf).metadata();
  const heroLeft = W - heroMeta.width - PAD;
  const heroTop = Math.round((H - heroMeta.height) / 2);

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fdfcfa"/>
          <stop offset="100%" stop-color="#f6f3ee"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <circle cx="${PAD + 14}" cy="${PAD + 30}" r="14" fill="#d97757"/>
      <text x="${PAD + 40}" y="${PAD + 40}" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="700" fill="#1a1a1f">Aside</text>
      <text x="${PAD}" y="260" font-family="Inter, system-ui, sans-serif" font-size="54" font-weight="800" fill="#1a1a1f">AI in your</text>
      <text x="${PAD}" y="320" font-family="Inter, system-ui, sans-serif" font-size="54" font-weight="800" fill="#1a1a1f">sidebar.</text>
      <text x="${PAD}" y="390" font-family="Inter, system-ui, sans-serif" font-size="54" font-weight="800" fill="#d97757">On any webpage.</text>
      <text x="${PAD}" y="450" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500" fill="#5b5b66">Six AI providers. One keystroke.</text>
      <text x="${PAD}" y="482" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500" fill="#5b5b66">Zero context switching.</text>
      <text x="${PAD}" y="${H - PAD}" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" fill="#7a7a84">Chrome extension &#xb7; MV3 &#xb7; MIT licensed &#xb7; Open source</text>
    </svg>
  `;

  const out = path.join(ASSETS, 'og-card.png');
  await sharp(bg)
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: heroBuf, top: heroTop, left: heroLeft },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`  -> ${out}  (${W}x${H})`);
}

console.log('Optimizing landing images...');
await optimize();
console.log('Generating OG card...');
await ogCard();
console.log('Done.');
