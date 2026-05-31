# Aside — Design Improvement Plan

Phased plan to polish & extend the redesign. Each batch is a self-contained
session — we land it, ship it, then move on. Context stays clean.

Status legend: ☐ pending · ◐ in progress · ☑ shipped

---

## 🎯 Batch 1 — Visual polish quick wins ☑
**Effort:** ~1 hr · **Scope:** CSS-only, no new behavior
**Goal:** Tighten what's already there before adding more.

| # | Item | Files |
|---|---|---|
| 1 ☑ | Header decrowd — vertical divider between in-context (model/new-chat/theme/lang) and exit (settings/close) groups | `sidebar/sidebar.html` `sidebar/sidebar.css` |
| 11 ☑ | Settings "Save changes" — muted by default, accent fill when dirty, disabled when clean. Re-baselines on save. | `options/options.js` `options/options.css` |
| 12 ☑ | Tier badges — `FREE` bright green w/ border, `PAID` neutral w/ border, dark-mode-aware | `options/options.css` |
| 15 ☑ | `:focus-visible` rings — clay accent across settings + popup (sidebar already had them) | `options/options.css` `popup/popup.html` |
| 13 ☑ | Tools tab — dashed-border hint card replaces grid when no text selected; re-renders on selection change | `sidebar/sidebar.js` `sidebar/sidebar.css` `sidebar/translations.js` |

**Acceptance:** screenshots before/after for sidebar + settings + popup, light + dark.

---

## 🎯 Batch 2 — Hero & brand identity ☑
**Effort:** ~2 hrs · **Scope:** Visual identity push
**Goal:** First impression should *delight*. Provider cards should be scannable by logo.

| # | Item | Files |
|---|---|---|
| 2  ☑ | Hero mark — bigger (80×80) with radial glow + gentle float + sparkle pulse, respects `prefers-reduced-motion` | `sidebar/sidebar.html` `sidebar/sidebar.css` |
| 5  ☑ | Provider chips — geometric SVG marks (sparkle, knot, diamond, X, bolt, llama) replace plain letter monograms. Shared via `shared/provider-marks.js` | `shared/provider-marks.js` (new) · `sidebar/sidebar.js` `options/options.js` `popup/popup.js` |
| 14 ☑ | Popup ↔ Sidebar parity — popup gets the same animated brand mark + Source Serif title + chip-based status row | `popup/popup.html` `popup/popup.js` |

**Acceptance:** popup, sidebar empty state, settings provider grid all share visual language.

---

## 🎯 Batch 3 — Chat experience polish ☑
**Effort:** ~2 hrs · **Scope:** Markdown rendering + composer affordances
**Goal:** Make the chat thread feel like a premium product.

| # | Item | Files |
|---|---|---|
| 3 ☑ | Code blocks — language badge (lowercased) on left, copy button on right · click → ✓ Copied feedback · proper mono spacing | `sidebar/sidebar.js` (markdown renderer + copy binding) `sidebar/sidebar.css` |
| 8 ☑ | Streaming token meter — live `~127 tokens · 0.8s` next to cursor during streaming · persists in turn footer when done · respects accent color | `sidebar/sidebar.js` (runPrompt + turnHtml) `sidebar/sidebar.css` |
| 9 ☑ | Page context pill — clickable pill above composer showing `Including page context · ~2.4k tokens` · click toggles on/off · auto-hides when no page content · persists to `chrome.storage.local.pageContext` | `sidebar/sidebar.html` `sidebar/sidebar.js` (renderContextPill) `sidebar/sidebar.css` `sidebar/translations.js` |

**Bonus:** preview chrome-shim now mocks `completeStream` so the chat works in standalone preview too.

**Acceptance:** code block with copy works; streaming shows live token count; toggle hides/shows context line.

---

## 🎯 Batch 4 — Selection workflow ☑
**Effort:** ~2 hrs · **Scope:** Content script + animation
**Goal:** Highlighting text on a page should feel magical.

| # | Item | Files |
|---|---|---|
| 4 ☑ | Selection block slide-in — fade + translateY + scale + max-height transition (220ms), respects `prefers-reduced-motion` | `sidebar/sidebar.css` `sidebar/sidebar.js` |
| 7 ☑ | Floating Action Button — clay-accent pill with "Ask Aside" label, bounce-in animation, viewport-clamped positioning (flips left when overflowing right edge, places above when overflowing bottom), dismisses on scroll/Escape | `content/content.js` `content/content.css` |

**Acceptance:** select text on any page → see FAB → click → sidebar opens with selection in composer.

---

## 🎯 Batch 5 — Chat history (the big one) ☑
**Effort:** ~3 hrs · **Scope:** Storage schema + UI for threads list + restore
**Goal:** Conversations persist. Users can revisit, search, delete.

| # | Item | Files |
|---|---|---|
| 6 ☑ | Chat threads — `chrome.storage.local`, full-panel overlay from header, search · auto-filter to current page · per-thread delete · "Clear all" · auto-save on every assistant turn · restores full conversation with markdown re-rendered · 100-thread cap with FIFO cull | `sidebar/history.js` (new) · `sidebar/sidebar.html` · `sidebar/sidebar.css` · `sidebar/sidebar.js` · `content/content.js` (PAGE_META message) · `sidebar/translations.js` |

**Verified:** create 2 threads → overlay shows both with title + time-ago + msg count → click → conversation restored with all turns + markdown.

---

## 🎯 Batch 6 — Onboarding ☑
**Effort:** ~1.5 hrs · **Scope:** First-run experience
**Goal:** Set up provider in 30s without reading docs.

| # | Item | Files |
|---|---|---|
| 10 ☑ | 3-step onboarding — (1) Choose provider with chip + description + tier badge, (2) Paste API key with placeholder + help link + Ollama localhost autofill, (3) Try sample prompts that pre-fill the composer · progress dots · "Advanced setup" escape hatch to Settings · keyboard Enter to advance | `sidebar/sidebar.html` `sidebar/sidebar.css` `sidebar/sidebar.js` `sidebar/translations.js` |

---

## 🎯 Batch 7 — Power features ☐
**Effort:** ~3–4 hrs each, **pick one or all**
**Goal:** Differentiation. Things competitors don't have.

### 7a — Quick-prompt templates ☑
- Curated 8-template library: ELI5, Bullet points, Action items, Find quotes, Ask me, Counter-arguments, Translate to Hebrew, No jargon
- Surfaces as horizontal-scroll chip strip above the composer when input is empty + not streaming
- Click → fills composer, auto-resizes, focuses input, hides strip
- Implementation: `sidebar/prompt-templates.js` (new), `sidebar/sidebar.html` (strip), `sidebar/sidebar.css` (chip styling), `sidebar/sidebar.js` (`renderTemplates()`)

### 7b — Compare mode ☑
- Toggle button in header (split-columns icon) flips compare on/off · toast confirms
- Auto-picks a second provider (next one in PROVIDERS list) on first activation
- Sending a prompt fires TWO `completeStream` calls in parallel — one to active, one to comparison
- Two stacked assistant turns, each tagged with its provider name in the action label and its hue/name in the foot
- Errors on either side render gracefully without dropping the other turn
- Files: `sidebar/sidebar.html` (compare-btn), `sidebar/sidebar.js` (`runComparePrompt`, toast), `sidebar/sidebar.css` (toast + active-pressed style), `sidebar/translations.js`

### 7c — Per-page memory ☑
- Banner appears at top of chat tab when sidebar opens on a URL that has prior threads
- Shows count: "3 previous chats on this page →"
- Click → opens history overlay with page filter pre-applied
- Hidden when no current thread on page, or when current thread is the only one
- Files: `sidebar/sidebar.html` (banner), `sidebar/sidebar.js` (`renderPageMemory()`), `sidebar/sidebar.css`, `sidebar/translations.js`

---

## Cross-cutting principles

- **No new dependencies.** Vanilla JS + CSS only.
- **Direction-safe.** Every change must work in RTL (Hebrew).
- **Theme-safe.** Every change must work in light + dark + auto.
- **Storage.** Everything (keys, settings, chat history) lives in `chrome.storage.local` (5MB) — never `chrome.storage.sync`, so nothing leaves the device.
- **Existing behavior preserved.** No regressions to provider routing, settings, popup toggle, etc.

---

## Working agreement

1. Pick a batch
2. I implement everything in that batch in one session
3. Verify with preview (`Extension Preview.html`)
4. Update this file: mark items ☑, note any deferred work
5. Commit & push to `redesign-feature` branch
6. Next session: next batch

**Next up:** Batch 7 (Power features — templates · compare · per-page memory).
