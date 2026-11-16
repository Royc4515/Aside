/**
 * Aside landing site - "try it on this page".
 *
 * Alt+A (or the button) opens a preview of the Aside sidebar on the landing
 * page itself. It is scripted: every answer is an existing string from the
 * i18n dictionary (FAQ / About), shown with the place on the page it came
 * from. No model is called and nothing is sent anywhere, and the UI says so.
 * It deliberately names no provider or model: a canned answer must not look
 * like one a real model gave.
 */
(function () {
  const dict = window.ASIDE_SITE_DICT;
  if (!dict) return;
  const root = document.documentElement;
  const lang = () => (root.lang === "he" ? "he" : "en");
  const tr = (key) => (dict[lang()] || dict.en)[key] || dict.en[key] || "";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Matches the bottom-sheet breakpoint in styles.css.
  const narrow = () => window.matchMedia("(max-width: 1099px)").matches;

  // question key -> the dictionary key that answers it (also the element on the page it is quoted from)
  const QA = [["try.q1", "about.body"], ["try.q2", "faq.a2"], ["try.q3", "faq.a1"], ["try.q4", "faq.a7"]];

  // Line icons, in the sidebar's own style (they inherit the text colour).
  const svg = (cls, d) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    arrow: svg("try-ico try-ico-dir", '<path d="M5 12h14M13 6l6 6-6 6"/>'),   // try-ico-dir: mirrored on right-to-left pages
    close: svg("", '<path d="M6 6l12 12M18 6 6 18"/>'),
    locate: svg("try-ico", '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
    mark: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c2 5 5.5 8.5 10.5 10.5C21.5 15.5 18 19 16 24 14 19 10.5 15.5 5.5 13.5 10.5 11.5 14 8 16 3z" fill="#e08866"/><circle cx="16" cy="27.6" r="1.9" fill="#e08866"/></svg>',
  };

  /** An element whose text follows the page language (i18n.js re-applies [data-i18n] on a language switch). */
  function el(tag, cls, key) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (key) { node.setAttribute("data-i18n", key); node.textContent = tr(key); }
    return node;
  }

  const sb = el("aside", "try-sb");
  sb.setAttribute("data-i18n-attr", "aria-label:try.label");
  sb.setAttribute("aria-label", tr("try.label"));
  sb.inert = true;
  sb.tabIndex = -1;   // a focus target for when the focused chip goes away
  sb.innerHTML = `
    <div class="try-head">
      <div class="try-brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c2 5 5.5 8.5 10.5 10.5C21.5 15.5 18 19 16 24 14 19 10.5 15.5 5.5 13.5 10.5 11.5 14 8 16 3z" fill="#e08866"/><circle cx="16" cy="27.6" r="1.9" fill="#e08866"/></svg>Aside</div>
      <span class="try-badge" data-i18n="try.badge"></span>
      <button class="try-x" type="button" data-i18n-attr="aria-label:try.close">${ICON.close}</button>
    </div>
    <div class="try-body"><div class="try-empty"><h3 data-i18n="try.title"></h3><p data-i18n="try.sub"></p></div></div>
    <div class="try-foot"><form><input data-i18n-attr="placeholder:try.placeholder"><button data-i18n-attr="aria-label:try.send">${ICON.arrow}</button></form>
      <div class="try-note" data-i18n="try.note"></div></div>`;
  sb.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = tr(n.getAttribute("data-i18n")); });
  sb.querySelectorAll("[data-i18n-attr]").forEach((n) => {
    const [attr, key] = n.getAttribute("data-i18n-attr").split(":");
    n.setAttribute(attr, tr(key));
  });
  document.body.append(sb);
  const body = sb.querySelector(".try-body");
  const empty = sb.querySelector(".try-empty");
  let busy = false;

  /** A question button. The label sits in its own span: i18n.js rewrites a [data-i18n] element's whole text. */
  function chip(cls, qKey, aKey) {
    const b = el("button", cls);
    b.type = "button";
    b.append(el("span", "", qKey));
    if (cls) b.insertAdjacentHTML("beforeend", ICON.arrow);
    b.addEventListener("click", () => ask(qKey, aKey));
    return b;
  }
  for (const [q, a] of QA) empty.append(chip("try-chip", q, a));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function stream(node, text) {
    if (!reduceMotion) {
      for (let i = 3; i < text.length; i += 3) {
        node.textContent = text.slice(0, i);
        body.scrollTop = body.scrollHeight;
        await sleep(10);
      }
    }
    node.textContent = text;
    body.scrollTop = body.scrollHeight;
  }

  function showSource(src) {
    const details = src.closest("details");
    if (details) details.open = true;
    document.querySelectorAll(".try-mark").forEach((n) => n.classList.remove("try-mark", "on"));
    src.classList.add("try-mark");
    requestAnimationFrame(() => src.classList.add("on"));
    // In bottom-sheet mode the sheet covers the lower part of the screen, so the source goes to the top.
    src.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: narrow() ? "start" : "center" });
  }

  /** `aKey` null means free text: the preview cannot answer it and says so. */
  async function ask(qKey, aKey, freeText) {
    if (busy) return;
    busy = true;
    root.classList.remove("try-auto");   // the visitor is using it now: let the page move aside so the source shows
    // The chip that was clicked is about to be hidden; keep focus inside the sidebar.
    if (empty.contains(document.activeElement)) sb.focus({ preventScroll: true });
    empty.hidden = true;
    const user = el("div", "try-user");
    user.append(freeText ? Object.assign(document.createElement("span"), { textContent: freeText }) : el("span", "", qKey));
    const ai = el("div", "try-ai");
    const head = el("div", "try-ai-h");
    head.innerHTML = `${ICON.mark}<b>Aside</b>`;
    head.append(el("span", "", "try.badge"));
    const text = el("p", "try-ai-t");
    ai.append(head, text);
    body.append(user, ai);
    body.scrollTop = body.scrollHeight;
    await sleep(reduceMotion ? 0 : 400);
    await stream(text, tr(aKey || "try.fallback"));
    text.setAttribute("data-i18n", aKey || "try.fallback");

    const src = aKey && document.querySelector(`main [data-i18n="${aKey}"]`);
    if (src) {
      const show = el("button", "try-src");
      show.type = "button";
      show.innerHTML = ICON.locate;
      show.append(el("span", "", "try.source"));
      show.addEventListener("click", () => showSource(src));
      ai.append(show);
      showSource(src);
    }
    const more = el("div", "try-more");
    for (const [q, a] of QA) if (q !== qKey) more.append(chip("", q, a));
    ai.append(more);
    body.scrollTop = body.scrollHeight;
    busy = false;
  }

  sb.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    ask(null, null, value);
  });

  const SEEN_KEY = "aside.site.tried";
  const seen = () => { try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return true; } };   // no storage: never auto-open
  const markSeen = () => { try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) { /* private mode */ } };

  let opener = null;
  /** `auto`: opened by the page, not the visitor. It must not take focus, and it overlays the page instead of pushing it. */
  function setOpen(open, auto = false) {
    if (open === root.classList.contains("try-open")) return;
    root.classList.toggle("try-open", open);
    root.classList.toggle("try-auto", open && auto);
    sb.inert = !open;
    if (open) {
      root.classList.add("try-used");   // the floating pill has done its job; the hero button and Alt+A remain
      markSeen();
      opener = auto ? null : document.activeElement;
      if (!auto) (sb.querySelector(".try-chip:not([hidden])") || sb.querySelector(".try-x")).focus({ preventScroll: true });
    } else {
      document.querySelectorAll(".try-mark").forEach((n) => n.classList.remove("on"));
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
  }
  sb.querySelector(".try-x").addEventListener("click", () => setOpen(false));
  addEventListener("keydown", (e) => {
    // e.code, not e.key: with Alt held, macOS reports "å" for the A key.
    if (e.altKey && e.code === "KeyA") { e.preventDefault(); setOpen(!root.classList.contains("try-open")); }
    else if (e.key === "Escape") setOpen(false);
  });

  const pill = el("button", "try-pill");
  pill.type = "button";
  /** The shortcut as keycaps. On a Mac the Alt key is labelled Option. */
  function keycaps() {
    const keys = el("span", "try-keys");
    keys.dir = "ltr";   // "Alt A" keeps its order on the Hebrew page
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || "");
    keys.innerHTML = `<kbd>${mac ? "\u2325 Option" : "Alt"}</kbd><kbd>A</kbd>`;
    return keys;
  }
  pill.append(el("span", "", "try.pill"), keycaps());
  pill.addEventListener("click", () => setOpen(true));
  document.body.append(pill);
  document.querySelectorAll(".js-try").forEach((b) => {
    b.hidden = false;
    if (b.classList.contains("btn-try")) b.append(keycaps());
    b.addEventListener("click", () => setOpen(true));
  });
  // First visit on a wide screen: show it instead of describing it. The shortcut is "pressed" on the hero
  // button and the preview opens by itself, once per browser. Not when the visitor came for something else
  // (a #hash link, already scrolled, already clicking or typing), never with reduced motion, and never on
  // narrow screens, where a sheet would cover the hero.
  const AUTO_OPEN_MS = 1400;
  if (!reduceMotion && !seen() && !location.hash && window.matchMedia("(min-width: 1100px)").matches) {
    const CANCEL = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    let timer = 0;
    const cancel = () => { clearTimeout(timer); CANCEL.forEach((t) => removeEventListener(t, cancel, true)); };
    CANCEL.forEach((t) => addEventListener(t, cancel, { capture: true, passive: true }));
    timer = setTimeout(() => {
      cancel();
      if (scrollY > 40 || root.classList.contains("try-open")) return;
      const btn = document.querySelector(".btn-try");
      if (btn) btn.classList.add("is-pressing");
      setTimeout(() => { if (btn) btn.classList.remove("is-pressing"); setOpen(true, true); }, 380);
    }, AUTO_OPEN_MS);
  }

  // In the hero the "Try it" button and the screenshot already offer this, and the pill would cover them.
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    root.classList.add("try-hero");
    new IntersectionObserver((entries) => root.classList.toggle("try-hero", entries[0].isIntersecting), { threshold: 0.35 }).observe(hero);
  }
  // The hero screenshot opens the preview too (see .hero-art.is-try in styles.css).
  const art = document.querySelector(".hero-art");
  if (art) {
    art.classList.add("is-try");
    art.tabIndex = 0;
    art.setAttribute("role", "button");
    art.setAttribute("data-i18n-attr", "aria-label:try.cta");
    art.setAttribute("aria-label", tr("try.cta"));
    const cue = el("span", "hero-art-cue");
    cue.setAttribute("aria-hidden", "true");   // the screenshot itself carries the button label
    cue.append(el("span", "cue-mouse", "try.cue"), el("span", "cue-touch", "try.cue_touch"), keycaps());
    art.append(cue);
    art.addEventListener("click", () => setOpen(true));
    art.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } });
  }
})();
