/**
 * Aside landing site - demo video player.
 *
 * - Starts from the top each time the video scrolls into view, pauses when it
 *   leaves, so visitors always see the whole 30-second story.
 * - Sound is on by default. Browsers only allow audible autoplay after the
 *   visitor has interacted with the page (a click, tap or key press; scrolling
 *   does not count), so when play() with sound is refused we start muted and
 *   unmute on the first interaction anywhere. Muting by hand is respected.
 * - prefers-reduced-motion: no autoplay; the poster and play button remain.
 */
(function () {
  const video = document.querySelector(".demo-video");
  const toggle = document.querySelector(".demo-toggle");
  const sound = document.querySelector(".demo-sound");
  if (!video || !toggle) return;

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
    const p = video.play();
    if (!p || !p.catch) return;
    p.catch(() => {
      if (video.muted) { syncButtons(); return; }   // blocked even muted: buttons still work
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
  document.querySelectorAll(".lang-toggle").forEach((b) => b.addEventListener("click", () => setTimeout(syncButtons, 0)));

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !onScreen && !userPaused) {
        video.currentTime = 0;   // every arrival shows the story from the beginning
        start();
      } else if (!visible && onScreen && !video.paused) {
        video.pause();
      }
      onScreen = visible;
    }, { threshold: 0.5 }).observe(video);
  } else if (!userPaused) {
    start();
  }

  syncButtons();
})();
