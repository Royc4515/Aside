/* Lab concept 1 - scroll film: the page scroll drives the demo's clock (demo.html's renderAt). No sound. */
(function () {
  const track = document.querySelector('.film-track');
  const screen = document.querySelector('.film .demo-screen');
  if (!track || !screen) return;
  const chaps = [...document.querySelectorAll('.film-chap')];
  const dots = [...document.querySelectorAll('.film-dots i')];
  const hint = document.querySelector('.film-hint');
  // [start, end] of each chapter on the demo's 31 s timeline.
  const SPANS = [[3.4, 7.6], [7.6, 14.3], [14.3, 17.9], [17.9, 23.2], [23.6, 27.2]];
  const TYPE = 0.16, HOLD = 0.1;   // share of a chapter spent typing the question / holding the last frame
  const questions = chaps.map(c => { const q = c.querySelector('.film-q'); const full = q.textContent; q.textContent = ''; return { q, full }; });

  const frame = document.createElement('iframe');
  frame.className = 'demo-live';
  frame.src = new URL('demo/demo.html?embed=1', document.baseURI).href;
  frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
  screen.append(frame);
  let win = null, shown = SPANS[0][0], target = shown;
  frame.addEventListener('load', () => frame.contentWindow.__ready.then(() => { win = frame.contentWindow; frame.classList.add('is-ready'); win.renderAt(shown); }));

  function progress() {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
  }
  function update() {
    const p = progress() * SPANS.length;
    const i = Math.min(SPANS.length - 1, Math.floor(p)), f = Math.min(1, p - i);
    chaps.forEach((c, k) => c.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    const { q, full } = questions[i];
    const typed = Math.min(1, f / TYPE);
    q.textContent = full.slice(0, Math.round(full.length * typed));
    q.classList.toggle('done', typed >= 1);
    const g = Math.max(0, Math.min(1, (f - TYPE) / (1 - TYPE - HOLD)));
    target = SPANS[i][0] + (SPANS[i][1] - SPANS[i][0]) * g;
    if (hint) hint.classList.toggle('off', progress() > 0.02);
  }
  // Ease toward the scroll position so wheel steps read as motion, not jumps.
  (function tick() {
    shown += (target - shown) * 0.16;
    if (win && Math.abs(target - shown) > 0.002) win.renderAt(shown);
    requestAnimationFrame(tick);
  })();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  document.querySelector('.film-skip').addEventListener('click', () => {
    const r = track.getBoundingClientRect();
    scrollTo({ top: scrollY + r.bottom, behavior: 'smooth' });
  });
})();
