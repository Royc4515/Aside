/**
 * Aside landing site - "the race": the same question asked the usual way
 * (copy, switch tab, paste, switch back) and with Aside, step by step.
 * It shows steps, not timings: the page claims nothing it has not measured.
 */
(function () {
  const sec = document.querySelector(".race");
  if (!sec) return;
  const $ = (s) => sec.querySelector(s);
  const lane = (cls) => ({ root: $(cls), steps: [...sec.querySelectorAll(`${cls} .race-steps li`)], count: $(`${cls} .race-count b`) });
  const old = lane(".race-old"), neu = lane(".race-new");
  const tabs = [...old.root.querySelectorAll(".rb-tab")], views = [...old.root.querySelectorAll(".rb-view")];
  const tab = (i) => { tabs.forEach((t, k) => t.classList.toggle("on", k === i)); views.forEach((v, k) => v.classList.toggle("on", k === i)); };
  const typed = $(".rb-typed"), side = $(".rb-side"), keys = $(".rb-keys");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEP_MS = 950;

  // One action per listed step, in order.
  const OLD = [
    () => views[0].classList.add("rb-sel"),
    () => $(".rb-clip").classList.add("on"),
    () => tab(1),
    () => views[1].classList.add("rb-pasted"),
    () => typed.classList.add("on"),
    () => views[1].classList.add("rb-answered"),
    () => tab(0),
    () => { views[0].classList.remove("rb-sel"); $(".rb-lost").classList.add("on"); },
  ];
  const NEW = [
    () => { keys.classList.add("on"); side.classList.add("on"); },
    () => { keys.classList.remove("on"); side.classList.add("ans"); },
  ];

  let timers = [];
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    [...old.steps, ...neu.steps].forEach((li) => li.classList.remove("on"));
    old.count.textContent = neu.count.textContent = "0";
    tab(0);
    views.forEach((v) => v.classList.remove("rb-sel", "rb-pasted", "rb-answered"));
    [typed, keys, side, ...sec.querySelectorAll(".rb-clip, .rb-lost, .race-done")].forEach((n) => n.classList.remove("on", "ans"));
  }
  function play(l, acts) {
    acts.forEach((act, i) => {
      const step = () => {
        l.steps[i].classList.add("on");
        l.count.textContent = String(i + 1);
        act();
        if (i === acts.length - 1) l.root.querySelector(".race-done").classList.add("on");
      };
      if (reduceMotion) step(); else timers.push(setTimeout(step, 500 + i * STEP_MS));
    });
  }
  function run() { reset(); play(old, OLD); play(neu, NEW); }

  $(".race-replay").addEventListener("click", run);
  if (reduceMotion || !("IntersectionObserver" in window)) { run(); return; }
  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) { io.disconnect(); run(); }
  }, { threshold: 0.4 }).observe(sec);
})();
