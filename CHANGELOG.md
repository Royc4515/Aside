# Changelog

Newest first. Each version's section here becomes its GitHub release notes.

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
