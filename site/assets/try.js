/**
 * Aside landing site - "try it on this page".
 *
 * Alt+A (or the button) opens a preview of the Aside sidebar on the landing
 * page itself. The question buttons are scripted: every answer is an existing
 * string from the i18n dictionary (FAQ / About), shown with the place on the
 * page it came from. No model is called for them, and a canned answer names
 * no provider or model: it must not look like one a real model gave.
 *
 * Live answers (optional): when assets/demo-config.js names a demo server
 * (demo-api/ in the repo), a question the visitor TYPES is sent there and a
 * real model answers it. The visitor picks the model, or two to compare, from
 * assets/try-models.js (generated, the same list the server accepts), like the
 * model picker and compare bar in the extension's sidebar. Every live answer is
 * labelled with the model the server says answered, not the one picked, and
 * the scripted answers are labelled "Ready-made" so they never pass for a
 * model's. With no server configured, or when the server says no (caps,
 * outage), nothing changes from the scripted preview.
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

  // don't touch / https only (http for local testing): the question must not travel in the clear.
  const API = typeof window.ASIDE_DEMO_API === "string" ? window.ASIDE_DEMO_API.trim() : "";
  const LIVE = /^https:\/\/\S+$/.test(API) || /^http:\/\/localhost(:\d+)?\/\S*$/.test(API);
  const MAX_QUESTION = 300;      // the server's limit (demo-api/lib/core.js)
  const LIVE_TIMEOUT_MS = 35000;   // don't touch / above the server's 30s maxDuration: the calls are paid for even if the page gives up
  /** Copy that differs once live answers are on has a "<key>_live" twin in the dictionary. */
  const liveKey = (key) => (LIVE && dict.en[`${key}_live`] ? `${key}_live` : key);

  // ── Model picker and compare (live answers only) ──────────────────────────
  const PROVIDERS = {
    groq: { name: "Groq", hue: "var(--p-groq)" },
    gemini: { name: "Gemini", hue: "var(--p-gemini)" },
    claude: { name: "Claude", hue: "var(--p-claude)" },
  };
  const MODELS = LIVE && Array.isArray(window.ASIDE_TRY_MODELS) ? window.ASIDE_TRY_MODELS.filter((m) => PROVIDERS[m.provider]) : [];
  const byKey = new Map(MODELS.map((m) => [m.key, m]));
  /** "Groq · GPT-OSS 120B", "Claude · Haiku 5.5": the provider once, not twice. */
  const modelName = (provider, label) => `${(PROVIDERS[provider] || { name: provider }).name} · ${String(label).replace(/^(Claude|Gemini) /, "")}`;
  const PICK_STORE = "aside.site.tryModels";
  const pick = (() => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(PICK_STORE) || "{}") || {}; } catch (err) { saved = {}; }
    const a = byKey.has(saved.a) ? saved.a : MODELS[0] && MODELS[0].key;
    const b = byKey.has(saved.b) && saved.b !== a ? saved.b : partnerFor(a);
    return { a, b, compare: Boolean(saved.compare) && MODELS.length > 1 };
  })();
  /**
   * A default second model for comparing with `a`. Groq first: Gemini's free tier is blocked for
   * visitors from the EEA, the UK and Switzerland, so it would make a poor first comparison there.
   */
  function partnerFor(a) {
    return (MODELS.find((m) => m.key !== a && m.provider === "groq") || MODELS.find((m) => m.key !== a) || {}).key;
  }
  /** Comparing a model with itself is refused by the server, so B always moves off A. */
  function keepPairDistinct() { if (pick.b === pick.a || !byKey.has(pick.b)) pick.b = partnerFor(pick.a); }
  const savePick = () => { try { localStorage.setItem(PICK_STORE, JSON.stringify(pick)); } catch (err) { /* private mode: the pick lasts until reload */ } };

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
    <div class="try-body"><div class="try-empty"><h3 data-i18n="try.title"></h3><p data-i18n="${liveKey("try.sub")}"></p></div></div>
    <div class="try-foot"><form><input data-i18n-attr="placeholder:try.placeholder"><button data-i18n-attr="aria-label:try.send">${ICON.arrow}</button></form>
      <div class="try-note" data-i18n="${liveKey("try.note")}"></div></div>`;
  sb.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = tr(n.getAttribute("data-i18n")); });
  sb.querySelectorAll("[data-i18n-attr]").forEach((n) => {
    const [attr, key] = n.getAttribute("data-i18n-attr").split(":");
    n.setAttribute(attr, tr(key));
  });
  document.body.append(sb);
  const body = sb.querySelector(".try-body");
  const empty = sb.querySelector(".try-empty");
  if (LIVE) sb.querySelector("input").maxLength = MAX_QUESTION;
  const foot = sb.querySelector(".try-foot");
  let menu = null;
  if (MODELS.length) buildPicker();

  /** The model row above the input: slot A, and in compare mode "A ⇄ B", plus the compare toggle. */
  function buildPicker() {
    const row = el("div", "try-models");
    const slot = (name, key) => {
      const b = el("button", "try-model");
      b.type = "button";
      b.dataset.slot = name;
      b.setAttribute("aria-haspopup", "listbox");
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("data-i18n-attr", `aria-label:${key}`);
      b.setAttribute("aria-label", tr(key));
      b.innerHTML = '<span class="try-dot"></span><span class="try-model-name" dir="ltr"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      b.addEventListener("click", () => toggleMenu(name, b));
      return b;
    };
    const vs = el("span", "try-vs");
    vs.setAttribute("aria-hidden", "true");
    vs.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l-4 4 4 4M3 11h14"/><path d="M17 17l4-4-4-4M21 13H7"/></svg>';
    const cmp = el("button", "try-cmp");
    cmp.type = "button";
    // In compare mode the label is hidden to make room for two model names, so the name comes from here.
    cmp.setAttribute("data-i18n-attr", "aria-label:try.compare");
    cmp.setAttribute("aria-label", tr("try.compare"));
    cmp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8"/></svg>';
    cmp.append(el("span", "", "try.compare"));
    cmp.addEventListener("click", () => { pick.compare = !pick.compare; keepPairDistinct(); savePick(); closeMenu(); renderPicker(); });
    row.append(slot("a", "try.model"), vs, slot("b", "try.model_b"), cmp);
    menu = el("div", "try-menu");
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    foot.prepend(row);
    foot.append(menu);
    if (MODELS.length < 2) cmp.hidden = true;
    renderPicker();
  }

  function renderPicker() {
    const row = foot.querySelector(".try-models");
    row.classList.toggle("is-compare", pick.compare);
    row.querySelector(".try-cmp").setAttribute("aria-pressed", String(pick.compare));
    row.querySelector(".try-vs").hidden = !pick.compare;
    for (const b of row.querySelectorAll(".try-model")) {
      const m = byKey.get(pick[b.dataset.slot]);
      b.hidden = b.dataset.slot === "b" && !pick.compare;
      if (!m) continue;
      b.querySelector(".try-dot").style.background = PROVIDERS[m.provider].hue;
      // Two names side by side: the dot already says which provider, so only the model is spelled out.
      b.querySelector(".try-model-name").textContent = pick.compare ? String(m.label).replace(/^(Claude|Gemini) /, "") : modelName(m.provider, m.label);
      b.title = modelName(m.provider, m.label);
    }
  }

  let menuSlot = null;
  let menuOpener = null;
  function toggleMenu(slotName, opener) {
    if (!menu.hidden && menuSlot === slotName) { closeMenu(); return; }
    menuSlot = slotName;
    menuOpener = opener;
    menu.textContent = "";
    // The other slot's model is not offered: comparing a model with itself says nothing.
    const taken = pick.compare ? pick[slotName === "a" ? "b" : "a"] : null;
    for (const m of MODELS) {
      if (m.key === taken) continue;
      const o = el("button", "try-opt");
      o.type = "button";
      o.setAttribute("role", "option");
      o.setAttribute("aria-selected", String(m.key === pick[slotName]));
      const dot = el("span", "try-dot");
      dot.style.background = PROVIDERS[m.provider].hue;
      const name = el("span");
      name.dir = "ltr";
      name.textContent = modelName(m.provider, m.label);
      o.append(dot, name);
      o.addEventListener("click", () => { pick[slotName] = m.key; keepPairDistinct(); savePick(); closeMenu(true); renderPicker(); });
      menu.append(o);
    }
    menu.hidden = false;
    opener.setAttribute("aria-expanded", "true");
    (menu.querySelector('[aria-selected="true"]') || menu.firstElementChild).focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (!menu || menu.hidden) return false;
    menu.hidden = true;
    foot.querySelectorAll(".try-model").forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (refocus && menuOpener) menuOpener.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener("click", (e) => { if (menu && !menu.hidden && !e.target.closest(".try-menu, .try-model")) closeMenu(); });

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

  /**
   * Ask the demo server. Resolves to { answers } (one entry per picked model, each an answer or an
   * error), or { key } naming the dictionary line to show instead. Never rejects.
   */
  async function liveAnswer(question, models) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), LIVE_TIMEOUT_MS);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(models.length ? { question, lang: lang(), models } : { question, lang: lang() }),
        signal: abort.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      const data = await res.json();
      if (res.ok && data && Array.isArray(data.answers) && data.answers.some((a) => a && typeof a.answer === "string" && a.answer.trim())) {
        return { answers: data.answers };
      }
      // Nothing answered, but each pick says why (region, daily limit, unavailable): show that per model.
      if (data && Array.isArray(data.answers) && models.length && data.answers.length === models.length) {
        return { answers: data.answers };
      }
      // A server without the model picker answers in the old shape.
      if (res.ok && data && typeof data.answer === "string" && data.answer.trim()) {
        return { answers: [{ answer: data.answer, provider: data.provider, model: data.model }] };
      }
      return { key: /_cap$/.test(data && data.reason) ? "try.limit" : "try.unavailable" };
    } catch (err) {
      return { key: "try.unavailable" };
    } finally {
      clearTimeout(timer);
    }
  }

  /** One answer block: the Aside mark, then a label, then the text. */
  function answerBlock(badgeKey) {
    const ai = el("div", "try-ai");
    const head = el("div", "try-ai-h");
    head.innerHTML = `${ICON.mark}<b>Aside</b>`;
    head.append(el("span", "try-ai-badge", badgeKey));
    const text = el("p", "try-ai-t");
    ai.append(head, text);
    return { ai, head, text };
  }

  /**
   * Label a block with a model: while waiting, the one picked; once answered, "Live answer" and the
   * model the server reports, which may not be the one picked.
   */
  function markLive(block, provider, model, answered = true) {
    block.head.querySelectorAll(".try-ai-badge, .try-live, .try-model-chip").forEach((n) => n.remove());
    if (answered) block.head.append(el("span", "try-live", "try.live"));
    const chip = el("span", "try-model-chip");
    chip.dir = "ltr";
    const dot = el("span", "try-dot");
    dot.style.background = (PROVIDERS[provider] || {}).hue || "currentColor";
    const name = el("span");
    name.textContent = PROVIDERS[provider] ? modelName(provider, String(model || "").slice(0, 40)) : String(model || "").slice(0, 40);
    chip.append(dot, name);
    block.head.append(chip);
  }

  /** `aKey` null means free text: a live answer when the demo server is on, otherwise the preview says it cannot answer. */
  async function ask(qKey, aKey, freeText) {
    if (busy) return;
    busy = true;
    closeMenu();
    // The chip that was clicked is about to be hidden; keep focus inside the sidebar.
    if (empty.contains(document.activeElement)) sb.focus({ preventScroll: true });
    empty.hidden = true;
    const user = el("div", "try-user");
    user.append(freeText ? Object.assign(document.createElement("span"), { textContent: freeText, dir: "auto" }) : el("span", "", qKey));
    body.append(user);

    let last = null;
    if (freeText && LIVE) {
      const models = MODELS.length ? (pick.compare ? [pick.a, pick.b] : [pick.a]) : [];
      // One block per picked model, each saying which model it is waiting for.
      const blocks = (models.length ? models : [null]).map((key) => {
        const b = answerBlock("try.badge");
        const m = byKey.get(key);
        if (m) markLive(b, m.provider, m.label, false);
        b.ai.classList.add("is-thinking");
        b.text.textContent = tr("try.thinking");
        body.append(b.ai);
        return b;
      });
      body.scrollTop = body.scrollHeight;
      const result = await liveAnswer(freeText.slice(0, MAX_QUESTION), models);
      if (!result.answers) {
        blocks.slice(1).forEach((b) => b.ai.remove());
        const b = blocks[0];
        b.ai.classList.remove("is-thinking");
        b.head.querySelectorAll(".try-model-chip").forEach((n) => n.remove());
        b.head.append(el("span", "try-ai-badge", "try.badge"));
        await stream(b.text, tr(result.key));
        b.text.setAttribute("data-i18n", result.key);
        last = b;
      } else {
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          const a = result.answers[i] || { error: "unavailable" };
          b.ai.classList.remove("is-thinking");
          if (typeof a.answer === "string" && a.answer.trim()) {
            markLive(b, a.provider, a.model);
            const asked = byKey.get(a.requested);
            if (asked) {
              // The picked model could not answer and another free one did: say so, never pass it off.
              const note = el("div", "try-swap");
              note.textContent = tr("try.substituted").replace("{a}", modelName(asked.provider, asked.label));
              b.ai.insertBefore(note, b.text);
            }
            b.text.dir = "auto";   // the answer may be in a different language than the page
            await stream(b.text, a.answer.trim());
          } else {
            const key = { region: "try.err_region", cap: "try.err_cap" }[a.error] || "try.err_unavailable";
            b.text.classList.add("is-error");
            b.text.textContent = tr(key);
            b.text.setAttribute("data-i18n", key);
          }
        }
        last = blocks[blocks.length - 1];
      }
    } else {
      const b = answerBlock(LIVE ? "try.canned" : "try.badge");
      body.append(b.ai);
      body.scrollTop = body.scrollHeight;
      await sleep(reduceMotion ? 0 : 400);
      const shownKey = aKey || "try.fallback";
      await stream(b.text, tr(shownKey));
      b.text.setAttribute("data-i18n", shownKey);
      const src = aKey && document.querySelector(`main [data-i18n="${aKey}"]`);
      if (src) {
        const show = el("button", "try-src");
        show.type = "button";
        show.innerHTML = ICON.locate;
        show.append(el("span", "", "try.source"));
        show.addEventListener("click", () => showSource(src));
        b.ai.append(show);
        showSource(src);
      }
      last = b;
    }
    const more = el("div", "try-more");
    for (const [q, a] of QA) if (q !== qKey) more.append(chip("", q, a));
    last.ai.append(more);
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

  let opener = null;
  /** Only ever called from a visitor's own action (button, screenshot, pill, Alt+A): the page never opens it by itself. */
  function setOpen(open) {
    if (open === root.classList.contains("try-open")) return;
    root.classList.toggle("try-open", open);
    sb.inert = !open;
    if (open) {
      root.classList.add("try-used");   // the floating pill has done its job; the hero button and Alt+A remain
      opener = document.activeElement;
      (sb.querySelector(".try-chip:not([hidden])") || sb.querySelector(".try-x")).focus({ preventScroll: true });
    } else {
      document.querySelectorAll(".try-mark").forEach((n) => n.classList.remove("on"));
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
  }
  sb.querySelector(".try-x").addEventListener("click", () => setOpen(false));
  addEventListener("keydown", (e) => {
    // e.code, not e.key: with Alt held, macOS reports "å" for the A key.
    if (e.altKey && e.code === "KeyA") { e.preventDefault(); setOpen(!root.classList.contains("try-open")); }
    else if (e.key === "Escape") { if (!closeMenu(true)) setOpen(false); }
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
