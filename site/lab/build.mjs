#!/usr/bin/env node
/**
 * Builds the three UX-lab prototype pages from site/index.html, so each concept
 * is seen inside the real landing page. Prototypes only: not linked, not shipped.
 *   node site/lab/build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LAB = dirname(fileURLToPath(import.meta.url));
const SITE = join(LAB, '..');
const src = readFileSync(join(SITE, 'index.html'), 'utf8');
const sub = (html, re, to) => { if (!re.test(html)) throw new Error(`lab build: no match for ${re}`); return html.replace(re, to); };

// The prototypes have no sound: the demo player is patched to start muted and its sound button is removed.
writeFileSync(join(LAB, 'demo-nosound.js'),
  sub(readFileSync(join(SITE, 'assets', 'demo.js'), 'utf8'), /let userMuted = false;/, 'let userMuted = true;'));

function base(html, n, title, extra) {
  html = sub(html, /<head>/, '<head>\n  <base href="../">\n  <meta name="robots" content="noindex">');
  html = sub(html, /<script src="assets\/demo\.js[^"]*" defer><\/script>/, '<script src="lab/demo-nosound.js" defer></script>');
  html = html.replace(/\s*<button class="demo-sound"[\s\S]*?<\/button>/, '');
  html = sub(html, /<\/head>/, '  <link rel="stylesheet" href="lab/lab.css">\n</head>');
  const tag = `<div class="lab-tag">Lab ${n}/3 - ${title}<a href="lab/">all</a></div>`;
  return sub(html, /<\/body>/, `${tag}\n${extra}\n</body>`);
}

const CHAPTERS = [
  ['Another AI sidebar? Why would I need one?', 'Easier to show you.', 'Press Alt + A on any page. Aside opens next to what you are reading.'],
  ["Fine. What's this article about?", 'It already read the page.', 'One click, and a summary streams in. No copy, no paste.'],
  ["I don't trust just one model.", 'Then ask another one.', 'Switch between six providers from the same sidebar, on the same page.'],
  ['Do I have to start over?', 'No. The chat carries on.', 'Follow up with a different model without leaving the tab.'],
  ['And which models do I get?', 'The current ones, from every provider.', 'Or any model id you type in.'],
];
const film = `
    <!-- Lab 1: scroll film -->
    <section id="demo" class="film" aria-label="Aside demo, step by step">
      <div class="film-track">
        <div class="film-sticky">
          <div class="film-copy">
${CHAPTERS.map(([q, h, a], i) => `            <div class="film-chap" data-i="${i}"><p class="film-q">${q}</p><h2>${h}</h2><p class="film-a">${a}</p></div>`).join('\n')}
            <div class="film-nav"><span class="film-dots">${CHAPTERS.map(() => '<i></i>').join('')}</span><button class="film-skip" type="button">Skip ahead</button></div>
          </div>
          <div class="film-stage"><div class="demo-frame"><div class="demo-screen" role="img" aria-label="Aside demo">
            <img class="demo-poster" src="assets/video/aside-demo-poster.jpg" alt="" width="1920" height="1080">
          </div></div></div>
          <div class="film-hint">Scroll to play</div>
        </div>
      </div>
    </section>
`;
const article = '<div class="rb-line h"></div><div class="rb-line s"></div><div class="rb-line s" style="width:92%"></div><div class="rb-line s" style="width:78%"></div><div class="rb-line" style="width:88%"></div><div class="rb-line" style="width:60%"></div>';
const race = `
    <!-- Lab 3: the race -->
    <section class="race">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Same question, two ways</span>
          <h2>Stop shuffling tabs.</h2>
          <p>Asking an AI about the page you are reading usually takes eight steps and two tab switches. With Aside it takes two.</p>
        </div>
        <div class="race-grid">
          <div class="race-lane race-old">
            <div class="race-top"><h3>The usual way</h3><span class="race-count"><b>0</b>steps</span></div>
            <div class="rb">
              <div class="rb-tabs"><span class="rb-tab on">Article</span><span class="rb-tab">AI chat</span></div>
              <div class="rb-view on">${article}<span class="rb-clip">Copied</span><span class="rb-lost">Where was I?</span></div>
              <div class="rb-view"><span class="rb-spin"></span><div class="rb-ans" style="padding-top:2px"><div class="rb-line" style="width:70%"></div><div class="rb-line" style="width:84%"></div><div class="rb-line" style="width:52%"></div></div>
                <div class="rb-chatbox"><div class="rb-blob"></div><span class="rb-typed"></span></div></div>
            </div>
            <ol class="race-steps"><li>Select the text</li><li>Copy it</li><li>Switch to the AI tab</li><li>Paste it in</li><li>Type your question</li><li>Wait for the answer</li><li>Switch back</li><li>Find your place again</li></ol>
            <span class="race-done">Done. 8 steps, 2 tab switches.</span>
          </div>
          <div class="race-lane race-new win">
            <div class="race-top"><h3>With Aside</h3><span class="race-count"><b>0</b>steps</span></div>
            <div class="rb">
              <div class="rb-tabs"><span class="rb-tab on">Article</span></div>
              <div class="rb-view on">${article}</div>
              <div class="rb-side"><div class="rb-line a"></div><div class="rb-line"></div><div class="rb-line" style="width:86%"></div><div class="rb-line" style="width:70%"></div><div class="rb-line" style="width:78%"></div></div>
              <div class="rb-keys"><kbd>Alt</kbd><kbd>A</kbd></div>
            </div>
            <ol class="race-steps"><li>Press Alt + A</li><li>Click Summarize</li></ol>
            <span class="race-done">Done. 2 steps, same tab.</span>
          </div>
        </div>
        <div class="race-foot"><button type="button">Replay</button></div>
      </div>
    </section>
`;

const pages = {
  '1-scroll-film.html': sub(base(src, 1, 'Scroll film', '<script src="lab/film.js"></script>'),
    /\s*<!-- Demo[^>]*-->\s*<section id="demo" class="demo">[\s\S]*?<\/section>\n/, `\n${film}`),
  '2-try-it-here.html': base(src, 2, 'Try it on this page', '<script src="demo/catalog.js"></script>\n<script src="lab/try.js"></script>'),
  '3-the-race.html': sub(base(src, 3, 'The race', '<script src="lab/race.js"></script>'),
    /(\n\s*<!-- Demo[^>]*-->\s*<section id="demo")/, `\n${race}$1`),
};
for (const [name, html] of Object.entries(pages)) writeFileSync(join(LAB, name), html);
writeFileSync(join(LAB, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Aside UX lab</title>
<body style="font:18px/1.6 system-ui;max-width:560px;margin:80px auto;padding:0 20px">
<h1>Aside UX lab</h1><p>Three prototypes of the landing page. Not shipped.</p>
<ol><li><a href="1-scroll-film.html">Scroll film</a></li><li><a href="2-try-it-here.html">Try it on this page</a></li><li><a href="3-the-race.html">The race</a></li></ol>`);
console.log('wrote', Object.keys(pages).join(', '), '+ index.html');
