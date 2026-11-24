# Changelog

Newest first. Each version's section here becomes its GitHub release notes,
so link with full URLs: relative links break on the release page.
Model refreshes follow [docs/MONTHLY_UPDATE.md](https://github.com/Royc4515/Aside/blob/main/docs/MONTHLY_UPDATE.md).

## Unreleased

### Added

- **Automatic update check.** Copies not from the Chrome Web Store now ask
  GitHub for the latest release on their own: at most once a week, and after
  an AI answer fails (at most once every 6 hours), since an old version can
  break when a provider retires a model. A newer version shows the sidebar's
  "new version available" line, and a failed answer's error card adds "Aside
  vX is available and may fix this". The popup button still checks at once.
  Each check is one request with no data; the privacy policy lists all three
  triggers.

## 1.1.6 - 2026-11-24 · Update notice, Hebrew prompt chips, live answers on the site

### Added

- **Updates in the toolbar popup.** After Chrome installs a new version, the
  icon shows a "NEW" badge and the popup says "Updated to vX - What's new",
  linking to that release's notes; dismissing it or opening the notes clears
  the badge. A "Check for updates" button asks the Chrome Web Store right
  away and, if a version is waiting, offers "Update to vX now", which reloads
  Aside onto it (open sidebars reopen with Alt+A). Unpacked copies say they
  cannot check. Reloading an unpacked build at the same version shows nothing.
- **Update check against GitHub for unpacked copies.** Aside is not on the
  Chrome Web Store yet, so Chrome cannot update it. For these copies "Check
  for updates" asks GitHub for the latest release and, if it is newer, offers
  "Download vX" with how to install it without losing keys or chats (unzip
  over the same folder, then Reload; never remove Aside first). The request
  goes to `api.github.com` only on that click, carries no data, and is in
  the privacy policy.
- **"New version available" in the sidebar.** When that check finds a newer
  release, the sidebar shows "Aside vX is available - Download" (Hebrew:
  "גרסה חדשה של Aside זמינה"), with how to install it in the tooltip. The
  sidebar never contacts GitHub itself; it shows the popup's last result and
  drops it once that version is installed.
- The same "Aside updated to vX - What's new" note appears at the top of the
  sidebar's chat, in English or Hebrew to match the UI language. Dismissing it
  in the popup or in any sidebar clears it everywhere, badge included.
- **Landing page: live answers in the "try it" preview (off until a demo
  server is configured).** A question a visitor types can now be answered by
  a real model instead of "this preview only knows the questions below". The
  answer is labelled "Live answer" with the model that gave it, and a note
  under the input says where the question goes. The ready-made questions are
  unchanged and still call no model.
  - `demo-api/` is a small Vercel function, the only server-side code in the
    repo. The extension never talks to it and it is not in the release ZIP.
  - Built so it cannot cost money: the server owns the prompt and the facts,
    questions are capped at 300 characters, and daily caps (5 per visitor, 300
    in total, 30 for the one paid provider) live in Redis. If it cannot count,
    it refuses. Free tiers go first (Groq, then Gemini), Claude last and only
    if its key is set. Gemini's free tier is skipped for the EEA, the UK and
    Switzerland, as Google's terms require.
  - Switched on: `site/assets/demo-config.js` points at
    https://aside-demo-api.vercel.app/api/ask. To switch live answers off,
    empty that string, or set `DEMO_ALL_VISITORS_PER_DAY=0` in Vercel for an
    immediate stop.
- The privacy policy has a section about the website's preview.
- **Demo server: the visitor's own model, and compare.** A request may name
  one model, or two to compare, from a fixed list of two per provider (Groq
  GPT-OSS 120B and 20B, Gemini 3.5 Flash-Lite and 3.8 Flash, Claude Haiku 5.5
  and Sonnet 5.5). Caps now count model calls, so a comparison counts twice,
  and every provider has its own daily cap. A paid model is called only when
  the visitor picked it. The automatic chain now starts with GPT-OSS 120B.
  Requests without a model behave as before.
- **Landing page: pick the model, or compare two.** The "try it" preview's
  composer now has a model picker and a compare toggle, like the extension's
  sidebar: Groq GPT-OSS 120B or 20B, Gemini 3.5 Flash-Lite, Claude Haiku 5.5
  or Sonnet 5.5. A compared question shows both answers, each labelled with
  its model; a model that cannot answer says why (unavailable, region, daily
  limit), and a substitute answer says so. Ready-made answers are labelled
  "Ready-made answer". Gemini 3.8 Flash was offered at first and dropped: on
  the free tier it timed out or returned 503 on most calls.
- Demo server: a failed pick reports a fixed reason code, and slow models get
  up to 20 seconds within a 26-second request budget.

### Changed

- FAQ wording: "there is no server we control" is now "the extension has no
  server at all", which stays true with the website's demo server.

### Fixed

- **Hebrew sidebar: the quick prompt chips were in English.** ELI5, Bullet
  points, Action items and the rest now show in Hebrew, and tapping one puts
  a Hebrew prompt in the composer. Other UI languages still use English.
- The page-context pill's "~N tokens" was English in every language; Hebrew
  now reads "כ־N טוקנים".
- On pages with no readable text, the page-context pill showed an untranslated
  "Page context" placeholder instead of hiding.
- The "updated" note now also appears when new files are picked up by a
  browser restart rather than the Reload button. Chrome sends no install
  event in that case, so Aside compares against the last version it ran.

## 1.1.5 - 2026-11-16 · New models, a live demo and "try it" on the site

### Changed

- **Claude:** `claude-fable-5-1` in the picker is now `claude-fable-5-2`
  (Claude Fable 5.2, released 2026-11-09). Fable 5.1 is still Active, so it is
  not mapped as retired and keeps working as a custom id. Sources:
  https://platform.claude.com/docs/en/about-claude/models/overview and
  https://platform.claude.com/docs/en/about-claude/model-deprecations
- **OpenAI:** added `gpt-6.1-terra` (GPT-6.1 Terra), a fast, cheaper middle
  pick between GPT-6 Luna and GPT-6.1 Sol, with reasoning effort `none` so it
  answers quickly. Source:
  https://developers.openai.com/api/docs/models/gpt-6.1-terra
- **Gemini:** the preview Pro pick (`gemini-3.1-pro-preview`) is replaced by the
  stable `gemini-4-argon` (Gemini 4 Argon, thinking level `low`). The old id is
  not retired, so anyone who chose it keeps it as a custom model. Source:
  https://ai.google.dev/gemini-api/docs/models
- xAI, Groq and Ollama re-checked against their docs: unchanged.
- **Landing page:** the "Latest models" section (English and Hebrew) lists the
  new models and reads "Updated November 2026".
- **Landing page demo is live, not a video.** The page now plays the demo
  animation itself (`site/demo/demo.html`) instead of a recording of it:
  - Model names come from `providers/models.js`, so the monthly model
    refresh no longer means re-rendering a video. `scripts/build-site.mjs`
    now also generates the "Latest models" chips and the demo's
    `catalog.js`, and CI fails if they drift.
  - The Hebrew page gets a fully Hebrew, right-to-left demo (article, chat,
    answers), using the extension's own Hebrew UI strings.
  - It plays from the start when scrolled into view, pauses when it
    leaves, and respects reduced motion.
  - ~50 KB of HTML instead of 8.6 MB of video, and sharp at any size. Blur
    filters and film grain are swapped for look-alike gradients in the
    live version: they cost 4x the frame time without a GPU. Measured
    57-59 fps on desktop and on a phone with a 4x-throttled CPU.
  - The poster image shows until the demo loads, and is what visitors
    without JavaScript see.
- **Landing page: try it on the page itself.** Alt+A (or the "Try it on this
  page" button) opens a preview of the sidebar on the landing page. It
  answers four common questions with the site's own FAQ text and marks where
  on the page each answer comes from. The answers are ready-made and labelled
  as a preview; no AI model is called. On phones it is a bottom sheet.
  The hero's main button is the try button (large, with the shortcut on
  it), and the hero screenshot carries a "Click to try it live" label.
- **Landing page in Hebrew:** the hero and gallery screenshots are Hebrew on
  the Hebrew page (and after switching language), taken from the demo's
  Hebrew mode.
- **Landing page: "Stop shuffling tabs".** A new section plays the usual
  copy, switch tab, paste, switch back routine next to the Aside way, step
  by step.
- **Landing page: no more sound.** The demo is silent, and the sound button
  is gone. The "Works with" strip is removed too: the provider list is
  already in the table and the model cards.
- **README video:** re-rendered from the same file with a model wall that
  names no models, so it stays accurate between UI changes. Re-rendering
  (`marketing/demo/render.mjs`) now reuses the finished music bed
  (`marketing/demo/music.m4a`); the Pixabay source track is only needed for a new
  music cut.

### Fixed

- **Text:** the sidebar welcome line in English and Hebrew still had an em
  dash, written as a `\u2014` escape that the 1.1.4 cleanup missed. It is a
  plain hyphen now.

## 1.1.4 - 2026-10-10 · Sidebar header fits every width, no em dashes

### Fixed

- **Sidebar header:** at the default 420px width the provider pill covered
  the "Aside" name, and at the 320px minimum the header overflowed and pushed
  the close button off-screen. The header now gives way in steps instead:
  tighter spacing up to 440px, the logo mark without the name up to 412px,
  then slimmer icon buttons. Every provider fits at every width from 320 to
  720px, in English and Hebrew (RTL). Wider sidebars look the same as before.
- **Text:** em dashes in the extension name, settings page, prompt templates
  and all eight sidebar languages are now plain hyphens, matching the
  project's style rule.

## 1.1.3 - 2026-10-08 · Claude Haiku 5.5, landing-page demo video

### Changed

- **Claude:** `claude-haiku-4-5` in the picker is now `claude-haiku-5-5`
  (Claude Haiku 5.5, released after the 1.1.2 refresh, low effort for speed).
  Haiku 4.5 is still Active, so it is not mapped as retired and keeps working
  as a custom id. Its tentative retirement is "not sooner than 2026-10-15".
  Sources: https://platform.claude.com/docs/en/about-claude/models/overview and
  https://platform.claude.com/docs/en/about-claude/model-deprecations
- OpenAI, Gemini, xAI, Groq and Ollama re-checked against their docs: unchanged.

### Added

- **Landing page:** a 30-second product demo video with music (it plays from
  the start when scrolled into view, sound on where the browser allows) and a
  "Latest models" section that lists each provider's current lineup.
- **Landing page sizing:** the hero and gallery now show crisp 2x product shots
  of the sidebar (rendered from the demo, current models) instead of full
  marketing banners that shrank to unreadable text on phones; the gallery is a
  swipeable strip on mobile. CSS/JS URLs are versioned (`?v=1.1.3`) so returning
  visitors never mix a cached old stylesheet with new markup.
- **README:** demo video near the top.
- `marketing/demo/`: the demo's source (`demo.html`, a deterministic HTML
  animation), `music_edit.py` (cuts the music to the animation on the track's
  bar grid) and `render.mjs`, which renders everything to MP4/WebM with
  puppeteer and ffmpeg, so the video can be re-cut whenever the catalog changes.
- Demo music: "Minimal Technology" by BerryDeep, edited to the demo, used under
  the Pixabay Content License: https://pixabay.com/music/ambient-minimal-technology-612982/

## 1.1.2 - 2026-10-06 · Monthly tech update (October 2026)

Small refresh. Nothing was broken; two catalog entries moved to newer models.

### Changed

- **Claude:** default is now `claude-sonnet-5-5` (Claude Sonnet 5.5, the current
  Sonnet). Sonnet 5 still works and stays usable as a custom id.
  Source: https://platform.claude.com/docs/en/about-claude/models/overview
- **OpenAI:** `gpt-6-sol` in the picker is now `gpt-6.1-sol` (GPT-6.1 Sol, low
  reasoning effort). `gpt-6-sol` is still served and remains usable as a custom
  id. Source: https://developers.openai.com/api/docs/models
- Gemini, xAI, Groq and Ollama checked and unchanged.

### Heads up

- `claude-haiku-4-5` has a tentative retirement of "not sooner than 2026-10-15"
  and no deprecation notice yet. Check next month.
  Source: https://platform.claude.com/docs/en/about-claude/model-deprecations
- `claude-sonnet-4-5` is deprecated (retires 2026-11-30); it is not in the
  catalog, so only custom-id users are affected.

## 1.1.1 - 2026-09-30 · Sidebar on http:// sites

### Fixed

- **The sidebar never opened on plain `http://` sites.** `Alt+A`, the
  popup's "Open sidebar" button, the right-click menu and the selection
  button all did nothing, with no error. The content script created its
  channel id with `crypto.randomUUID()`, which browsers only provide on
  secure (`https://`) pages. It now uses `crypto.getRandomValues()`, which
  works everywhere and is just as strong. Every release since 1.0.0 had
  this bug. `https://` sites were never affected.

## 1.1.0 - 2026-09-27 · Monthly tech update (September 2026)

The first refresh since June. Two providers' defaults had already stopped
working.

### Fixed (these were broken)

- **Groq:** already fixed in 1.0.1 (default `openai/gpt-oss-120b`, retired
  picks move to Groq's replacements). This release keeps that fix.
- **Gemini:** since 2026-09-18, the 2.5 models only serve accounts that
  already used them, so new installs couldn't use the `gemini-2.5-flash`
  default. Gemini now defaults to `gemini-3.5-flash-lite`, one of the two
  models Google recommends for new projects.
- **OpenAI:** `gpt-5.4-mini` and `gpt-5.5` reject `max_tokens`, so picking
  them failed. OpenAI requests now send `max_completion_tokens`.
- **xAI:** `grok-3`, `grok-4` and `grok-3-mini` were retired on 2026-05-15.
  Grok now defaults to `grok-4.3`, and saved picks of the retired models move
  there.

### Model catalog (`providers/models.js`)

| Provider | Default before → after | Picker now |
|---|---|---|
| Claude | `claude-sonnet-4-6` → `claude-sonnet-5` | Sonnet 5, Opus 5.5, Fable 5.1, Haiku 4.5 |
| OpenAI | `gpt-4o-mini` → `gpt-6-luna` | GPT-6 Luna, Sol, Astra |
| Gemini | `gemini-2.5-flash` → `gemini-3.5-flash-lite` | 3.5 Flash-Lite, 3.8 Flash, 3.1 Pro (preview) |
| Grok | `grok-3-mini` → `grok-4.3` | Grok 4.3, Grok 4.20 non-reasoning, Grok 4.7 |
| Groq | `openai/gpt-oss-120b` (unchanged since 1.0.1) | GPT-OSS 120B, GPT-OSS 20B |
| Ollama | `llama3.1` → `qwen3.5` | Qwen 3.5 9B / 4B, Gemma 4, GPT-OSS 20B, Llama 3.2, Llama 3.1 |

If you picked a model that has left the list but still works (for example
Claude Opus 4.8 or GPT-4o mini), you keep it. It appears as a custom model.

### Request handling

- **Output budget for reasoning models.** Most current models reason before
  answering, and that reasoning counts against the output cap. The cap is now
  16k tokens for Claude, OpenAI, xAI and Gemini. Groq stays at 4k (since
  1.0.1), because its free plan counts the cap toward its 8K tokens-per-minute
  limit. Custom model ids get a 4k cap, which every still-served model accepts,
  so older models you typed in yourself keep working.
- **Reasoning effort per model.** A catalog entry can set `effort`, which
  keeps the sidebar fast. Each provider sends it in its own field:
  - Claude: `output_config.effort`
  - OpenAI, xAI and Groq: `reasoning_effort`
  - Gemini: `thinkingLevel`
  - Ollama: `think`
- **No more blank or cut-off answers.** If a model refuses, runs out of
  output budget before answering, or its stream fails partway, you get an
  error that says so. Before, you got a blank answer, or a cut-off one saved
  as if it were complete. Claude and Gemini responses that include thinking
  return only the answer text.
- **Ollama.** If you never picked a model and the default isn't downloaded,
  Aside switches to one you already have and saves it as your pick, so the
  popup, sidebar and Settings show the model that's answering. If a model you
  picked isn't downloaded, the error tells you the exact `ollama pull`
  command. The README now explains `OLLAMA_ORIGINS=chrome-extension://*`.
- **UI.** The provider is now called "OpenAI" instead of "GPT-4o". The popup
  shows the real current model; it used to show a hardcoded, outdated label.

### Keeping it current

- `scripts/check-models.mjs` checks, without network access, that the catalog,
  the provider code and the docs agree. It also flags old model ids or names
  in any user-facing file, for all six providers.
- `scripts/check-models-live.mjs` asks each provider whether every catalog
  model is still served. It only reads model metadata, so it costs nothing.
  It skips any provider without an API key, and fails if a key is rejected.
- The `Model catalog` workflow runs the static check on every change and the
  live check on the 1st of each month.
- [docs/MONTHLY_UPDATE.md](https://github.com/Royc4515/Aside/blob/main/docs/MONTHLY_UPDATE.md) is the runbook for the
  monthly refresh.

Sources: the official models and deprecations pages listed in the header of
`providers/models.js`, checked 2026-09-23.

### Updating

Unzip `aside.zip` **over your existing Aside folder**, in the same location.
Then click **Reload** on Aside's card at `chrome://extensions`. Your keys and
history stay. If you load it from a new folder, Chrome installs it as a
separate extension without your settings.

## 1.0.1 - 2026-09-24 · Groq hotfix

Groq has been unusable on the free and developer tiers since 2026-08-16: Groq
shut down both Aside's default (`llama-3.3-70b-versatile`) and its built-in
fallback (`llama-3.1-8b-instant`).

- **New default: GPT-OSS 120B** (`openai/gpt-oss-120b`). It's Groq's own
  recommended replacement, it's on the free tier, and it's fast. GPT-OSS 20B
  is the faster option in the model picker.
- **Saved picks move automatically.** If you had picked a Groq model that has
  been shut down (Llama 3.3 70B, Llama 3.1 8B, Llama 4 Scout, Qwen 3 32B,
  Compound or Compound Mini), Aside now uses Groq's recommended replacement
  instead of failing.
- **Fallback while streaming.** If a Groq model has been retired, the request
  is retried once on GPT-OSS 20B. Before, this only happened for
  non-streaming requests, which the sidebar never makes.
- **Answers aren't cut off by reasoning.** GPT-OSS reasons before it answers,
  so requests now use `max_completion_tokens` (4096) with
  `reasoning_effort: "low"`.

No other providers changed in this release.

### Updating

Unzip `aside.zip` **over your existing Aside folder**, in the same location.
Then click **Reload** on Aside's card at `chrome://extensions`. Your keys and
history stay. If you load it from a new folder, Chrome installs it as a
separate extension without your settings.
