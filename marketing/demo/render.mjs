#!/usr/bin/env node
/**
 * Render marketing/demo/demo.html to an MP4 master, then web-sized MP4/WebM
 * encodes and a poster (out/web/), which ship in site/assets/video/.
 *
 * Frames are captured at SUBFRAMES × 60 fps and blended down to 60 fps,
 * which gives a natural 180°-shutter motion blur. Every frame is a pure
 * function of time (window.renderAt), so output is deterministic.
 *
 * Usage:
 *   CHROME=/path/to/chrome FFMPEG=/path/to/ffmpeg node render.mjs [outDir]
 *   node render.mjs --stills 2,7,12        # QA: PNG stills at given seconds
 *
 * Music: run music_edit.py first. It cuts "Minimal Technology" by BerryDeep
 * (Pixabay Content License) to the animation and writes out/music.wav, which
 * is mixed in here (override the path with MUSIC). The track is never
 * committed: the license forbids redistributing it on its own.
 *
 * Needs `puppeteer-core` resolvable (set NODE_PATH or install it locally) and
 * an ffmpeg build with libx264 + libvpx-vp9 (e.g. the `ffmpeg-static` package).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const HERE = dirname(fileURLToPath(import.meta.url));
const FPS = 60;
const SUBFRAMES = 2;
const WIDTH = 1920;
const HEIGHT = 1080;

const CHROME = process.env.CHROME;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const MUSIC = process.env.MUSIC || join(HERE, 'out', 'music.wav');
if (!CHROME) {
  console.error('Set CHROME to a Chrome/Chromium executable.');
  process.exit(1);
}

const args = process.argv.slice(2);
const stillsIdx = args.indexOf('--stills');
const stills = stillsIdx >= 0 ? args[stillsIdx + 1].split(',').map(Number) : null;
const positional = args.filter((a, i) => !a.startsWith('--') && !(stillsIdx >= 0 && i === stillsIdx + 1));
const outDir = resolve(positional[0] || join(HERE, 'out'));
mkdirSync(outDir, { recursive: true });

function run(cmd, argv, { input } = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, argv, { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('error', fail);
    p.on('exit', code => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
    if (input) input(p.stdin);
  });
}

/**
 * Two-pass loudnorm filter for `wav`: measure first, then normalize linearly.
 * One pass undershoots or overshoots by a dB or two depending on the edit.
 */
function loudnormFilter(wav, target = -18) {
  const spec = `loudnorm=I=${target}:TP=-1.5:LRA=11`;
  const p = spawnSync(FFMPEG, ['-hide_banner', '-i', wav, '-af', `${spec}:print_format=json`, '-f', 'null', '-'],
    { encoding: 'utf8' });
  const json = p.stderr && p.stderr.slice(p.stderr.lastIndexOf('{'));
  let m;
  try { m = JSON.parse(json); } catch { throw new Error('loudnorm measurement failed: ' + (p.stderr || '').slice(-300)); }
  return `${spec}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}`
    + `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
  defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  const url = pathToFileURL(join(HERE, 'demo.html')).href + '?render=1';
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.__ready);
  const duration = await page.evaluate(() => window.DURATION);
  const cdp = await page.createCDPSession();

  const grab = async (t, format = 'jpeg') => {
    await page.evaluate(tt => window.renderAt(tt), t);
    const { data } = await cdp.send('Page.captureScreenshot', {
      format, quality: format === 'jpeg' ? 96 : undefined, optimizeForSpeed: true,
    });
    return Buffer.from(data, 'base64');
  };

  if (args.includes('--shots')) {
    // Site product shots: the sidebar alone, on transparency, at 2x, taken from
    // the same timeline as the video so the images always match it.
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
    await page.evaluate(() => window.__ready);
    const SHOTS = { ask: 7.9, answer: 15.0, switch: 16.2, followup: 23.15 };
    const isolate = `
      html, body, #stage, #page, #browser { background: transparent !important; }
      #browser { box-shadow: none !important; transform: none !important; }
      #camera { transform: none !important; filter: none !important; opacity: 1 !important; }
      .glow, #vignette, #grain, #fade, #intro, #wall, #outro, #keysWrap, #cursor, #ripple,
      #chrome, #article, #pageDim, #sweep { display: none !important; }`;
    for (const [name, t] of Object.entries(SHOTS)) {
      await page.evaluate(tt => window.renderAt(tt), t);
      const style = await page.addStyleTag({ content: isolate });
      const box = await page.$eval('#sidebar', el => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      // Tight crop: the site adds the rounded corners and shadow in CSS, which
      // stays crisp at every size (a baked-in shadow picked up the page color).
      const file = join(outDir, `shot-${name}.png`);
      await page.screenshot({ path: file, omitBackground: true, clip: box });
      await style.evaluate(el => el.remove());
      console.log('wrote', file);
    }
  } else if (stills) {
    for (const t of stills) {
      const file = join(outDir, `still-${String(t).replace('.', '_')}.png`);
      writeFileSync(file, await grab(t, 'png'));
      console.log('wrote', file);
    }
  } else {
    const rate = FPS * SUBFRAMES;
    const total = Math.round(duration * rate);
    const mp4 = join(outDir, 'aside-demo.mp4');
    const blend = `tmix=frames=${SUBFRAMES}:weights='${Array(SUBFRAMES).fill(1).join(' ')}',fps=${FPS}`;

    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(rate), '-c:v', 'mjpeg', '-i', '-',
      '-vf', `${blend},format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
      '-movflags', '+faststart', '-an', mp4,
    ], {
      input: async stdin => {
        const t0 = Date.now();
        for (let i = 0; i < total; i++) {
          const buf = await grab(i / rate);
          if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
          if (i % rate === 0) {
            const secs = ((Date.now() - t0) / 1000).toFixed(0);
            console.log(`frame ${i}/${total}  (${secs}s elapsed)`);
          }
        }
        stdin.end();
      },
    });
    console.log('wrote', mp4);

    // The master above is ~24 MB (film grain is expensive). Ship capped-bitrate
    // web encodes instead, ~4 MB each, plus a poster from the summary moment.
    const web = join(outDir, 'web');
    mkdirSync(web, { recursive: true });
    const q = ['-y', '-hide_banner', '-loglevel', 'error'];
    // Music bed: the already-cut edit from music_edit.py (see the header).
    // Without it the encodes are silent. No -shortest: with VP9 stream timing
    // it truncated the WebM; -t pins the length instead.
    const hasMusic = existsSync(MUSIC);
    if (!hasMusic) console.warn(`No music at ${MUSIC} - rendering silent (run music_edit.py first)`);
    const audioIn = hasMusic ? ['-i', MUSIC] : [];
    // -18 LUFS: a background level, not a track.
    const audioFilter = hasMusic ? loudnormFilter(MUSIC) : '';
    const audio = codec => (hasMusic
      ? ['-map', '0:v', '-map', '1:a', '-af', audioFilter, '-t', String(duration), ...codec]
      : ['-an']);
    await run(FFMPEG, [...q, '-i', mp4, ...audioIn, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '23',
      '-maxrate', '3500k', '-bufsize', '7000k', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      ...audio(['-c:a', 'aac', '-b:a', '160k']), '-movflags', '+faststart', join(web, 'aside-demo.mp4')]);
    await run(FFMPEG, [...q, '-i', mp4, ...audioIn, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1',
      '-deadline', 'good', '-cpu-used', '2', ...audio(['-c:a', 'libopus', '-b:a', '128k']), join(web, 'aside-demo.webm')]);
    await run(FFMPEG, [...q, '-ss', '12.6', '-i', mp4, '-frames:v', '1', '-vf', 'scale=1600:-1', '-q:v', '3',
      join(web, 'aside-demo-poster.jpg')]);
    console.log('wrote', web, '- copy its files to site/assets/video/ (poster also to marketing/demo-poster.jpg)');
  }
} finally {
  await browser.close();
}
