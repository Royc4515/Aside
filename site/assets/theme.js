/**
 * Aside landing site — light/dark toggle.
 * Default (no stored value) = follow system. After first click, the
 * user is in manual mode and the button toggles between light and dark.
 * Stored in localStorage under "aside.site.theme" as "light" | "dark".
 *
 * The button icon always shows the OPPOSITE of the current effective
 * theme — i.e., what clicking would switch TO.
 */
(function () {
  const STORE_KEY = "aside.site.theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    const v = localStorage.getItem(STORE_KEY);
    return v === "light" || v === "dark" ? v : null;
  }

  function effective() {
    return stored() || (media.matches ? "dark" : "light");
  }

  function apply(theme) {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    refreshButtons();
  }

  function refreshButtons() {
    const eff = effective();
    const next = eff === "dark" ? "light" : "dark";
    const lang = document.documentElement.lang === "he" ? "he" : "en";
    const labels = {
      en: { light: "Light", dark: "Dark" },
      he: { light: "בהיר",  dark: "כהה"  },
    };
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("data-theme-state", eff);
      btn.setAttribute(
        "aria-label",
        lang === "he"
          ? `החלף למצב ${labels.he[next]}`
          : `Switch to ${labels.en[next]} mode`
      );
      const lbl = btn.querySelector(".theme-toggle-label");
      if (lbl) lbl.textContent = labels[lang][eff];
    });
  }

  function init() {
    // Re-apply stored value (head-script already did it for paint).
    apply(stored());

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = effective() === "dark" ? "light" : "dark";
        localStorage.setItem(STORE_KEY, next);
        apply(next);
      });
    });

    // Refresh icon when the system theme changes (only matters in auto mode).
    media.addEventListener("change", () => {
      if (!stored()) refreshButtons();
    });

    // Refresh labels when language switches.
    new MutationObserver(refreshButtons).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
