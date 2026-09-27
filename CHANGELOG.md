# Changelog

Newest first. Each version's section here becomes its GitHub release notes.
Model refreshes follow [docs/MONTHLY_UPDATE.md](docs/MONTHLY_UPDATE.md).

## 1.1.0 — unreleased · Monthly tech update (September 2026)

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
- [docs/MONTHLY_UPDATE.md](docs/MONTHLY_UPDATE.md) is the runbook for the
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
