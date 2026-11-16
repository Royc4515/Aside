/* Lab concept 3 - the race: the same question asked the usual way (tab shuffle) and with Aside. */
(function () {
  const sec = document.querySelector('.race'); if (!sec) return;
  const $ = s => sec.querySelector(s);
  const old = { lane: $('.race-old'), rb: $('.race-old .rb'), steps: [...sec.querySelectorAll('.race-old .race-steps li')], n: $('.race-old .race-count b') };
  const neu = { lane: $('.race-new'), steps: [...sec.querySelectorAll('.race-new .race-steps li')], n: $('.race-new .race-count b') };
  const tabs = [...old.rb.querySelectorAll('.rb-tab')], views = [...old.rb.querySelectorAll('.rb-view')];
  const tab = i => { tabs.forEach((t, k) => t.classList.toggle('on', k === i)); views.forEach((v, k) => v.classList.toggle('on', k === i)); };
  const typed = $('.rb-typed'), side = $('.rb-side'), keys = $('.rb-keys');
  // One entry per step of the usual way; each runs when its step lights up.
  const OLD = [
    () => views[0].classList.add('rb-sel'),
    () => $('.rb-clip').classList.add('on'),
    () => tab(1),
    () => views[1].classList.add('rb-pasted'),
    () => { typed.textContent = 'summarize this'; },
    () => { views[1].classList.add('rb-waiting'); setTimeout(() => { views[1].classList.remove('rb-waiting'); views[1].classList.add('rb-answered'); }, 650); },
    () => tab(0),
    () => { views[0].classList.remove('rb-sel'); $('.rb-lost').classList.add('on'); },
  ];
  const NEW = [
    () => { keys.classList.add('on'); setTimeout(() => { side.classList.add('on'); keys.classList.remove('on'); }, 450); },
    () => side.classList.add('ans'),
  ];
  let timers = [];
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    [...old.steps, ...neu.steps].forEach(li => li.classList.remove('on'));
    old.n.textContent = neu.n.textContent = '0';
    tab(0); views.forEach(v => v.classList.remove('rb-sel', 'rb-pasted', 'rb-waiting', 'rb-answered'));
    typed.textContent = ''; side.classList.remove('on', 'ans'); keys.classList.remove('on');
    sec.querySelectorAll('.rb-clip, .rb-lost, .race-done').forEach(e => e.classList.remove('on'));
  }
  function run() {
    reset();
    const STEP = 950;
    const play = (lane, acts) => acts.forEach((act, i) => timers.push(setTimeout(() => {
      lane.steps[i].classList.add('on'); lane.n.textContent = String(i + 1); act();
      if (i === acts.length - 1) timers.push(setTimeout(() => lane.lane.querySelector('.race-done').classList.add('on'), 700));
    }, 500 + i * STEP)));
    play(old, OLD); play(neu, NEW);
  }
  $('.race-foot button').addEventListener('click', run);
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.45 }).observe(sec);
})();
