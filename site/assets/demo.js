/**
 * Aside landing site - the live demo.
 *
 * The demo is site/demo/demo.html: a deterministic HTML animation where every
 * frame is window.renderAt(t). It runs in an iframe; this script owns its
 * clock. The README video is rendered from the same file
 * (marketing/demo/render.mjs), so the two never disagree.
 *
 * - Silent. (The README video has music; a page that starts playing sound on
 *   a visitor is not worth it.)
 * - Starts from the top each time it scrolls into view, pauses when it
 *   leaves, so visitors always see the whole 30-second story.
 * - prefers-reduced-motion: no autoplay; a still frame and the play button.
 * - The poster image stays up until the demo has loaded. It is all a visitor
 *   without JavaScript (or with a blocked iframe) sees.
 * - The demo follows the page language; switching it reloads the demo.
 */
(function () {
  const screen = document.querySelector(".demo-screen");
  const toggle = document.querySelector(".demo-toggle");
  if (!screen || !toggle) return;

  // Relative to this script, so the Hebrew page (/he/) finds the same files.
  const here = document.currentScript && document.currentScript.src;
  const DEMO_URL = new URL("../demo/demo.html", here || location.href).href;
  const STILL_AT = 12.6;   // the summary moment, same frame as the poster

  const pageLang = () => (document.documentElement.lang === "he" ? "he" : "en");

  /** The demo iframe plus a clock: play(), pause(), paused, currentTime. */
  class LiveDemo {
    constructor(host, onChange) {
      this.host = host;
      this.onChange = onChange;
      this.frame = null;
      this.win = null;
      this.lang = null;
      this.ready = null;
      this.loadToken = 0;
      this.playToken = 0;
      this.duration = 31;
      this.paused = true;
      this.t = STILL_AT;
      this.lastNow = 0;
      this.raf = 0;
    }

    /** Load (or reload, after a language switch) the demo in `lang`. */
    load(lang) {
      if (this.ready && lang === this.lang) return this.ready;
      this.lang = lang;
      const token = ++this.loadToken;
      const old = this.frame;
      const frame = (this.frame = document.createElement("iframe"));
      frame.className = "demo-live";
      frame.src = `${DEMO_URL}?embed=1${lang === "he" ? "&lang=he" : ""}`;
      frame.title = "";
      frame.tabIndex = -1;
      frame.setAttribute("aria-hidden", "true");   // the wrapper carries the description
      this.host.append(frame);

      this.ready = new Promise((resolve, reject) => {
        frame.addEventListener("load", () => {
          let win;
          try {
            win = frame.contentWindow;
            if (!win.__ready) throw new Error("demo did not start");
          } catch (err) {
            reject(err);   // e.g. opened from file://, where the iframe is cross-origin
            return;
          }
          win.__ready.then(() => {
            if (token !== this.loadToken) return;
            this.win = win;
            this.duration = win.DURATION || this.duration;
            this.draw();
            frame.classList.add("is-ready");
            if (old) old.remove();
            resolve();
          }, reject);
        }, { once: true });
      });
      this.ready.catch(() => {});   // the poster stays up; play() reports the failure
      return this.ready;
    }

    draw() {
      if (this.win) this.win.renderAt(this.t);
    }

    get currentTime() { return this.t; }
    set currentTime(t) {
      this.t = t;
      this.lastNow = performance.now();
      this.draw();
    }

    /** Rejects (and stays paused) if the demo cannot load. */
    play() {
      if (!this.paused) return Promise.resolve();
      this.paused = false;
      this.onChange();
      const token = ++this.playToken;
      return this.load(this.lang || pageLang()).then(() => {
        if (token !== this.playToken) return;
        this.lastNow = performance.now();
        this.loop();
      }, (err) => {
        if (token === this.playToken) this.stop();
        throw err;
      });
    }

    pause() {
      this.playToken++;
      if (!this.paused) this.stop();
    }

    stop() {
      this.paused = true;
      cancelAnimationFrame(this.raf);
      this.onChange();
    }

    loop() {
      cancelAnimationFrame(this.raf);
      const tick = (now) => {
        if (this.paused) return;
        this.t = (this.t + (now - this.lastNow) / 1000) % this.duration;
        this.lastNow = now;
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  // Mirrors demo.* keys in i18n.js, which only swaps text, not live aria state.
  const LABELS = {
    en: { play: "Play demo", pause: "Pause demo" },
    he: { play: "הפעלת הדמו", pause: "השהיית הדמו" },
  };

  function syncButton() {
    const playing = !demo.paused;
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-label", (LABELS[pageLang()] || LABELS.en)[playing ? "pause" : "play"]);
  }

  const demo = new LiveDemo(screen, syncButton);
  const start = () => demo.play().catch(() => {});   // failed to load: the poster stays, the button still works

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let userPaused = reduceMotion;
  let onScreen = false;

  toggle.addEventListener("click", () => {
    if (demo.paused) { userPaused = false; start(); }
    else { userPaused = true; demo.pause(); }
  });

  // The site swaps language in place; the demo is rebuilt in the new one.
  document.querySelectorAll(".lang-toggle").forEach((b) => b.addEventListener("click", () => setTimeout(() => {
    syncButton();
    if (!demo.ready || demo.lang === pageLang()) return;
    demo.pause();
    demo.load(pageLang()).then(() => {
      // The new text reflows the page; only resume if the demo is still in view.
      const resume = onScreen && !userPaused;
      demo.currentTime = resume ? 0 : STILL_AT;
      if (resume) start();
    }, () => {});
  }, 0)));

  if ("IntersectionObserver" in window) {
    // Load a screen ahead, so the demo is ready by the time it is in view.
    const preload = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      preload.disconnect();
      demo.load(pageLang());
    }, { rootMargin: "100% 0px" });
    preload.observe(screen);

    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !onScreen && !userPaused) {
        demo.currentTime = 0;   // every arrival shows the story from the beginning
        start();
      } else if (!visible && onScreen && !demo.paused) {
        demo.pause();
      }
      onScreen = visible;
    }, { threshold: 0.5 }).observe(screen);
  } else {
    demo.load(pageLang());
    if (!userPaused) start();
  }

  syncButton();
})();
