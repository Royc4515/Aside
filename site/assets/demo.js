/**
 * Aside landing site - the live demo.
 *
 * The demo is site/demo/demo.html: a deterministic HTML animation where every
 * frame is window.renderAt(t). It runs in an iframe; this script owns its
 * clock and its music. The README video is rendered from the same file
 * (marketing/demo/render.mjs), so the two never disagree.
 *
 * - Starts from the top each time it scrolls into view, pauses when it
 *   leaves, so visitors always see the whole 30-second story.
 * - Sound is on by default. Browsers only allow audible autoplay after the
 *   visitor has interacted with the page (a click, tap or key press; scrolling
 *   does not count), so when play() with sound is refused we start muted and
 *   unmute on the first interaction anywhere. Muting by hand is respected.
 * - prefers-reduced-motion: no autoplay; a still frame and the play button.
 * - The poster image stays up until the demo has loaded. It is all a visitor
 *   without JavaScript (or with a blocked iframe) sees.
 * - The demo follows the page language; switching it reloads the demo.
 */
(function () {
  const screen = document.querySelector(".demo-screen");
  const toggle = document.querySelector(".demo-toggle");
  const sound = document.querySelector(".demo-sound");
  if (!screen || !toggle) return;

  // Relative to this script, so the Hebrew page (/he/) finds the same files.
  const here = document.currentScript && document.currentScript.src;
  const DEMO_URL = new URL("../demo/demo.html", here || location.href).href;
  const MUSIC_URL = new URL("../demo/music.m4a", here || location.href).href;
  const STILL_AT = 12.6;          // the summary moment, same frame as the poster
  const MUSIC_GRACE_MS = 1500;    // how long the picture waits for the music to start

  /**
   * The slice of HTMLMediaElement the player logic below uses (play, pause,
   * paused, muted, currentTime, play/pause/volumechange events), backed by
   * the demo iframe and an <audio> element.
   *
   * Clock: while the music plays, the picture follows the music, the way a
   * video's frames follow its audio. Muted, it follows performance.now().
   */
  class LiveDemo extends EventTarget {
    constructor(host) {
      super();
      this.host = host;
      this.frame = null;
      this.win = null;
      this.lang = null;
      this.ready = null;
      this.loadToken = 0;
      this.playToken = 0;
      this.duration = 31;
      this.paused = true;
      this._muted = false;
      this.t = STILL_AT;
      this.lastNow = 0;
      this.waitSince = 0;
      this.raf = 0;

      const audio = (this.audio = new Audio());
      audio.src = MUSIC_URL;
      audio.loop = true;
      audio.preload = "none";   // ~650 KB; fetched on the first play with sound
      this.audioLive = false;
      audio.addEventListener("playing", () => {
        this.audioLive = true;
        // Fell back to the free-running clock while the music loaded: catch it up.
        if (Math.abs(audio.currentTime - this.t) > 0.15) audio.currentTime = this.t;
      });
      for (const type of ["waiting", "pause", "ended", "error"]) {
        audio.addEventListener(type, () => { this.audioLive = false; });
      }
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
      this.lastNow = this.waitSince = performance.now();
      if (!this.paused && !this._muted) this.audio.currentTime = t;
      this.draw();
    }

    get muted() { return this._muted; }
    set muted(m) {
      m = Boolean(m);
      if (m === this._muted) return;
      this._muted = m;
      if (m) this.audio.pause();
      else if (!this.paused) {
        this.startMusic().catch(() => {
          this._muted = true;
          this.dispatchEvent(new Event("volumechange"));
        });
      }
      this.dispatchEvent(new Event("volumechange"));
    }

    startMusic() {
      this.audio.preload = "auto";
      this.audio.currentTime = this.t;
      this.waitSince = performance.now();
      return this.audio.play();
    }

    /** Like HTMLMediaElement.play(): rejects (and stays paused) if sound is not allowed. */
    play() {
      if (!this.paused) return Promise.resolve();
      this.paused = false;
      this.dispatchEvent(new Event("play"));
      const token = ++this.playToken;
      return this.load(this.lang || pageLang())
        .then(() => {
          if (token !== this.playToken) return;
          this.lastNow = this.waitSince = performance.now();
          this.loop();
          if (!this._muted) return this.startMusic();
        })
        .catch((err) => {
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
      this.audio.pause();
      cancelAnimationFrame(this.raf);
      this.dispatchEvent(new Event("pause"));
    }

    loop() {
      cancelAnimationFrame(this.raf);
      const tick = (now) => {
        if (this.paused) return;
        if (!this._muted && this.audioLive) {
          this.t = this.audio.currentTime % this.duration;
        } else if (!this._muted && now - this.waitSince < MUSIC_GRACE_MS) {
          // Hold the picture for the music (it is still loading), so the
          // beat lands on the Alt+A press instead of trailing it.
        } else {
          this.t = (this.t + (now - this.lastNow) / 1000) % this.duration;
        }
        this.lastNow = now;
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  const pageLang = () => (document.documentElement.lang === "he" ? "he" : "en");
  const video = new LiveDemo(screen);

  // Mirrors demo.* keys in i18n.js, which only swaps text, not live aria state.
  const LABELS = {
    en: { play: "Play demo", pause: "Pause demo", soundOn: "Turn sound on", soundOff: "Mute" },
    he: { play: "הפעלת הדמו", pause: "השהיית הדמו", soundOn: "הפעלת סאונד", soundOff: "השתקה" },
  };
  const label = (key) => (LABELS[document.documentElement.lang] || LABELS.en)[key];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let userPaused = reduceMotion;
  let userMuted = false;     // only an explicit click on the sound button sets this
  let mutedByBrowser = false;
  let onScreen = false;

  function syncButtons() {
    const playing = !video.paused;
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-label", label(playing ? "pause" : "play"));
    if (sound) {
      const audible = !video.muted;
      sound.setAttribute("aria-pressed", String(audible));
      sound.classList.toggle("is-on", audible);
      sound.setAttribute("aria-label", label(audible ? "soundOff" : "soundOn"));
    }
  }

  /** Play with sound when allowed; otherwise muted, and wait for a gesture. */
  function start() {
    video.muted = userMuted;
    video.play().catch(() => {
      if (video.muted) { syncButtons(); return; }   // failed even muted: the poster stays, buttons still work
      video.muted = true;
      mutedByBrowser = true;
      armUnmuteOnGesture();
      video.play().catch(() => syncButtons());
    });
  }

  function armUnmuteOnGesture() {
    const events = ["pointerdown", "keydown", "touchend"];
    const unmute = (e) => {
      // The player's own buttons handle their clicks themselves.
      if (e.target && e.target.closest && e.target.closest(".demo-sound, .demo-toggle")) return;
      events.forEach((t) => document.removeEventListener(t, unmute, true));
      if (!mutedByBrowser || userMuted) return;
      mutedByBrowser = false;
      video.muted = false;
      syncButtons();
    };
    events.forEach((t) => document.addEventListener(t, unmute, true));
  }

  toggle.addEventListener("click", () => {
    if (video.paused) { userPaused = false; start(); }
    else { userPaused = true; video.pause(); }
  });

  if (sound) {
    sound.addEventListener("click", () => {
      const wasBlocked = mutedByBrowser;
      mutedByBrowser = false;
      userMuted = !video.muted;
      video.muted = userMuted;
      // Someone who never heard it (autoplay was muted) gets it from the top.
      if (!userMuted && (wasBlocked || video.paused)) {
        userPaused = false;
        video.currentTime = 0;
        start();
      }
      syncButtons();
    });
  }

  video.addEventListener("play", syncButtons);
  video.addEventListener("pause", syncButtons);
  video.addEventListener("volumechange", syncButtons);

  // The site swaps language in place; the demo is rebuilt in the new one.
  document.querySelectorAll(".lang-toggle").forEach((b) => b.addEventListener("click", () => setTimeout(() => {
    syncButtons();
    if (!video.ready || video.lang === pageLang()) return;
    video.pause();
    video.load(pageLang()).then(() => {
      // The new text reflows the page; only resume if the demo is still in view.
      const resume = onScreen && !userPaused;
      video.currentTime = resume ? 0 : STILL_AT;
      if (resume) start();
    }, () => {});
  }, 0)));

  if ("IntersectionObserver" in window) {
    // Load a screen ahead, so the demo is ready by the time it is in view.
    const preload = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      preload.disconnect();
      video.load(pageLang());
    }, { rootMargin: "100% 0px" });
    preload.observe(screen);

    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !onScreen && !userPaused) {
        video.currentTime = 0;   // every arrival shows the story from the beginning
        start();
      } else if (!visible && onScreen && !video.paused) {
        video.pause();
      }
      onScreen = visible;
    }, { threshold: 0.5 }).observe(screen);
  } else {
    video.load(pageLang());
    if (!userPaused) start();
  }

  syncButtons();
})();
