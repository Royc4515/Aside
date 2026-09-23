# Monthly tech update

AI providers ship and retire models every few weeks. Aside hardcodes a short,
curated model list per provider, so it drifts out of date unless someone
refreshes it. This runbook is that refresh. It runs on the **1st of every
month**: a scheduled Claude Code routine follows it and opens a draft PR, and
the `Model catalog` GitHub workflow runs a live check the same morning.

The goal is **not** to list every model a provider has. For each provider, keep
a small list that stays useful: one good default, then a cheap/fast option,
a balanced option, and the flagship. Anything else can go in the **Custom…**
field.

---

## 0 · Baseline

```bash
node scripts/check-models.mjs            # static: catalog ↔ code ↔ docs agree
node scripts/check-models-live.mjs       # live: every catalog id still served
```

The live check reads whichever of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`GEMINI_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY` are set and skips the rest.
Ollama is checked against the public registry and needs no key. It only calls
model-metadata endpoints, so it costs nothing. Anything it lists under
`+ served but not in catalog` is a candidate to add.

## 1 · Research (official sources only)

| Provider | Models | Deprecations / retirements |
|---|---|---|
| Anthropic | platform.claude.com/docs/en/about-claude/models/overview | platform.claude.com/docs/en/about-claude/model-deprecations |
| OpenAI | developers.openai.com/api/docs/models | platform.openai.com/docs/deprecations |
| Gemini | ai.google.dev/gemini-api/docs/models | ai.google.dev/gemini-api/docs/changelog |
| xAI | docs.x.ai/docs/models | docs.x.ai release notes |
| Groq | console.groq.com/docs/models | console.groq.com/docs/deprecations |
| Ollama | ollama.com/library (sort by popular / newest) | — |

**Never guess a model id.** Only add an id you saw on the provider's own docs
or in its live `/models` response. If a source can't be reached, leave that
provider's entry alone and say so in the PR.

## 2 · Decide, per provider

- **Default:** fast, cheap, good quality, available to every account tier,
  and on the free tier where the provider has one (Gemini, Groq). A retired
  default breaks every new install, so check its shutdown date first.
- **Options:** 3–5 in total, covering cheap/fast → balanced → flagship. Add a
  reasoning model if the provider has a distinct one.
- **Retiring soon:** if a model shuts down within about 60 days, remove it now
  and map it in `RETIRED_MODELS`.

## 3 · Edit

1. **`providers/models.js`** (the single source of truth). Update
   `default`/`options`, and bump the "verified" month and sources in the
   header comment.
   - Add every removed id that is retired or retiring to `RETIRED_MODELS`
     (`{ provider: { oldId: successorId } }`). Users who picked it get moved
     to the successor instead of an error. A removed id that still works
     does **not** go there. Users keep it as a custom model.
   - Per-model request hints live on the option. Today there's one: `effort`
     for Claude.
2. **Request shape** (`providers/*.js`). Check what the new models expect on
   the wire, for example `max_tokens` vs `max_completion_tokens`, thinking
   tokens eating the output budget, or new stop reasons. Fix the provider
   class, not the call sites.
3. **Fallbacks.** Update `model || '…'` in each `providers/*-provider.js` (it
   must equal the catalog default) and `fallbackModel` in
   `groq-provider.js`.
4. **Words.** Update the README Providers table and bullets, the
   `docs/ARCHITECTURE.md` provider matrix, and the site FAQ (`site/index.html`
   and **both** languages in `site/assets/i18n.js`). Then update the
   onboarding blurbs (`ONB_PROVIDERS` in `sidebar/sidebar.js`) and the static
   fallback labels (`PROVIDERS` in `sidebar/sidebar.js` and
   `options/options.js`).
5. Re-run `node scripts/check-models.mjs` until it's green. It flags any
   model id or model name in user-facing files that the catalog no longer
   offers.

## 4 · The rest of the stack (quick scan)

- **Chrome:** MV3 deprecations and changes that affect `minimum_chrome_version`
  or the APIs in `manifest.json` (see developer.chrome.com/docs/extensions/whats-new).
- **Provider endpoints:** if a provider changed its API host, update
  `connect-src` in the CSP in `manifest.json`.
- **GitHub Actions:** major-version bumps of `actions/*` used in
  `.github/workflows/`.

Only change what's actually outdated. "No changes needed" is a valid result
for this section.

## 5 · Ship

1. Add a dated entry at the top of `CHANGELOG.md` (what changed, why, sources).
2. Bump `version` in `manifest.json`: patch for a catalog-only refresh, minor
   if request behavior changed.
3. Open a **draft PR** titled `chore: monthly tech update YYYY-MM` with a
   per-provider before → after table and the sources. Don't cut a release.
   The maintainer does that after review (`scripts/build-zip.sh`).

If nothing changed this month, don't open a PR. Report "catalog current as of
YYYY-MM-DD" instead.
