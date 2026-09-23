# Changelog

Newest first. Model refreshes follow [docs/MONTHLY_UPDATE.md](docs/MONTHLY_UPDATE.md).

## 1.1.0 — 2026-09-23 · Monthly tech update (September 2026)

The first refresh since June. Two providers' defaults had already stopped
working.

### Fixed (these were broken)

- **Groq:** the default `llama-3.3-70b-versatile` and the built-in fallback
  `llama-3.1-8b-instant` were shut down on the free and developer tiers on
  2026-08-16. `meta-llama/llama-4-scout-17b-16e-instruct` and `qwen/qwen3-32b`
  went on 2026-07-17, and `groq/compound` / `groq/compound-mini` on 2026-09-21.
  Groq now defaults to `openai/gpt-oss-120b`, and saved picks of retired
  models move to Groq's recommended replacement.
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
| Groq | `llama-3.3-70b-versatile` → `openai/gpt-oss-120b` | GPT-OSS 120B, GPT-OSS 20B |
| Ollama | `llama3.1` → `qwen3.5` | Qwen 3.5 9B / 4B, Gemma 4, GPT-OSS 20B, Llama 3.2, Llama 3.1 |

If you picked a model that has left the list but still works (for example
Claude Opus 4.8 or GPT-4o mini), you keep it. It appears as a custom model.

### Request handling

- **Output budget for reasoning models.** Most current models reason before
  answering, and that reasoning counts against the output cap. The cap is now
  16k tokens for Claude, OpenAI, xAI and Gemini. Groq's cap is 4k, because its
  free plan counts the cap toward its 8K tokens-per-minute limit.
- **Reasoning effort per model.** A catalog entry can set `effort`, which
  keeps the sidebar fast. Each provider sends it in its own field:
  - Claude: `output_config.effort`
  - OpenAI, xAI and Groq: `reasoning_effort`
  - Gemini: `thinkingLevel`
  - Ollama: `think`
- **No more blank answers.** Claude refusals, Claude stream errors and empty
  Gemini replies now show an error that explains why. Claude and Gemini
  responses that include thinking return only the answer text.
- **Groq fallback while streaming.** If a model has been retired, the request
  is retried once on `openai/gpt-oss-20b`. Before, this only happened for
  non-streaming requests, which the sidebar never makes.
- **Ollama.** If the default model isn't downloaded, Aside uses one you
  already have. If a model you picked isn't downloaded, the error tells you
  the exact `ollama pull` command. The README now explains
  `OLLAMA_ORIGINS=chrome-extension://*`.
- **UI.** The provider is now called "OpenAI" instead of "GPT-4o". The popup
  shows the real current model; it used to show a hardcoded, outdated label.

### Keeping it current

- `scripts/check-models.mjs` checks, without network access, that the catalog,
  the provider code and the docs agree. It also flags old model ids or names
  in any user-facing file.
- `scripts/check-models-live.mjs` asks each provider whether every catalog
  model is still served. It only reads model metadata, so it costs nothing,
  and it skips any provider without an API key.
- The `Model catalog` workflow runs the static check on every change and the
  live check on the 1st of each month.
- [docs/MONTHLY_UPDATE.md](docs/MONTHLY_UPDATE.md) is the runbook for the
  monthly refresh.

Sources: the official models and deprecations pages listed in the header of
`providers/models.js`, checked 2026-09-23.
