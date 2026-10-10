# Changelog

Newest first. Each version's section here becomes its GitHub release notes,
so link with full URLs: relative links break on the release page.
Model refreshes follow [docs/MONTHLY_UPDATE.md](https://github.com/Royc4515/Aside/blob/main/docs/MONTHLY_UPDATE.md).

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

## 1.1.0 — 2026-09-27 · Monthly tech update (September 2026)

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

## 1.0.1 — 2026-09-24 · Groq hotfix

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
