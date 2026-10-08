/**
 * Aside landing site - demo video player.
 * Plays muted only while the video is on screen (no wasted decode or data
 * off-screen) and never autoplays for people who asked for reduced motion;
 * they get the poster and the play button instead. Browsers only allow muted
 * autoplay, so the soundtrack is opt-in through the sound button.
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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reduceMotion.matches;

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

  function tryPlay() {
    // play() rejects when the browser blocks autoplay; the buttons still work.
    const p = video.play();
    if (p && p.catch) p.catch(() => syncButtons());
  }

  toggle.addEventListener("click", () => {
    if (video.paused) { userPaused = false; tryPlay(); }
    else { userPaused = true; video.pause(); }
  });

  if (sound) {
    sound.addEventListener("click", () => {
      video.muted = !video.muted;
      // Turning sound on is a clear "I want to watch" signal: start from the top.
      if (!video.muted) {
        userPaused = false;
        video.currentTime = 0;
        tryPlay();
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
      const onScreen = entries[0].isIntersecting;
      if (onScreen && !userPaused) tryPlay();
      else if (!onScreen && !video.paused) video.pause();
    }, { threshold: 0.35 }).observe(video);
  } else if (!userPaused) {
    tryPlay();
  }

  syncButtons();
})();
