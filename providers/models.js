/**
 * Single source of truth for which model each provider calls.
 *
 * - `default` is used when the user hasn't picked a model.
 * - `options` populate the model picker in Settings and the sidebar.
 * - Users can also type a *custom* model id, so they're never locked to this
 *   list — provider APIs ship new model ids constantly, and the custom field
 *   is the escape hatch. `resolveModel` trusts whatever id is stored.
 *
 * - An option may carry request hints; today only `effort` (how hard a
 *   reasoning model thinks). Each provider maps it to its own wire field:
 *   Claude output_config.effort, OpenAI/xAI/Groq reasoning_effort, Gemini
 *   thinkingLevel, Ollama think. Custom ids get no hints (provider defaults).
 *
 * Model ids verified against each provider's official docs (September 2026):
 *   Anthropic  platform.claude.com/docs/en/about-claude/models/overview
 *   OpenAI     developers.openai.com/api/docs/models (+ /deprecations)
 *   Gemini     ai.google.dev/gemini-api/docs/models (+ /deprecations)
 *   xAI        docs.x.ai/developers/models (+ /migration/may-15-retirement)
 *   Groq       console.groq.com/docs/models (+ /deprecations)
 *   Ollama     ollama.com/library
 * If a provider renames or retires a model, update the default/options here
 * (one place) — every provider, the factory, and both UIs read this catalog.
 * Refreshed monthly: see docs/MONTHLY_UPDATE.md.
 */
const PROVIDER_MODELS = {
  claude: {
    default: 'claude-sonnet-5',
    options: [
      // Sonnet 5 thinks adaptively by default; `low` effort keeps sidebar
      // answers fast and cheap.
      { id: 'claude-sonnet-5',  label: 'Claude Sonnet 5', effort: 'low' },
      { id: 'claude-opus-5-5',  label: 'Claude Opus 5.5' },
      { id: 'claude-fable-5-1', label: 'Claude Fable 5.1' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
  openai: {
    default: 'gpt-6-luna',
    // GPT-6 models reason by default (`medium`); pin lighter effort for a
    // snappy sidebar. Astra's minimum is `low`.
    options: [
      { id: 'gpt-6-luna',  label: 'GPT-6 Luna',  effort: 'none' },
      { id: 'gpt-6-sol',   label: 'GPT-6 Sol',   effort: 'low' },
      { id: 'gpt-6-astra', label: 'GPT-6 Astra', effort: 'low' },
    ],
  },
  gemini: {
    // Since 2026-09-18 the 2.5 models only serve accounts that already used
    // them; Google points new projects at 3.5 Flash-Lite / 3.8 Flash.
    default: 'gemini-3.5-flash-lite',
    options: [
      { id: 'gemini-3.5-flash-lite',  label: 'Gemini 3.5 Flash-Lite' },
      { id: 'gemini-3.8-flash',       label: 'Gemini 3.8 Flash', effort: 'low' },
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (preview, paid key)' },
    ],
  },
  grok: {
    default: 'grok-4.3',
    options: [
      { id: 'grok-4.3',                     label: 'Grok 4.3' },
      { id: 'grok-4.20-0309-non-reasoning', label: 'Grok 4.20 (no reasoning, fastest)' },
      // Grok 4.7 always reasons and defaults to `high` — too slow for a sidebar.
      { id: 'grok-4.7',                     label: 'Grok 4.7', effort: 'low' },
    ],
  },
  groq: {
    // Groq shut down its Llama / Qwen 3 / Compound models on the free and
    // developer tiers (Jul–Sep 2026); GPT-OSS is what remains in production.
    default: 'openai/gpt-oss-120b',
    options: [
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', effort: 'low' },
      { id: 'openai/gpt-oss-20b',  label: 'GPT-OSS 20B (fastest)', effort: 'low' },
    ],
  },
  ollama: {
    // Local models must be pulled first (`ollama pull <id>`). If the default
    // isn't installed, OllamaProvider falls back to one that is.
    default: 'qwen3.5',
    options: [
      { id: 'qwen3.5',     label: 'Qwen 3.5 9B',           effort: 'none' },
      { id: 'qwen3.5:4b',  label: 'Qwen 3.5 4B (laptops)', effort: 'none' },
      { id: 'gemma4',      label: 'Gemma 4',               effort: 'none' },
      { id: 'gpt-oss:20b', label: 'GPT-OSS 20B (16 GB+ RAM)', effort: 'low' },
      { id: 'llama3.2',    label: 'Llama 3.2 3B (smallest)' },
      { id: 'llama3.1',    label: 'Llama 3.1 8B' },
    ],
  },
};

/**
 * Model ids a provider has shut down (or is about to), mapped to the catalog
 * model that replaces them. A user whose stored pick is listed here is moved
 * to the successor instead of hitting a "model not found" error. Only add ids
 * that are actually retired; a model that merely left the curated list keeps
 * working as a custom id.
 */
const RETIRED_MODELS = {
  // Google shut these down on 2026-06-01.
  gemini: {
    'gemini-2.0-flash':      'gemini-3.5-flash-lite',
    'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite',
  },
  // xAI retired these on 2026-05-15 and now serves them with Grok 4.3.
  grok: {
    'grok-3-mini': 'grok-4.3',
    'grok-3':      'grok-4.3',
    'grok-4':      'grok-4.3',
  },
  // Shut down for Groq's free and developer tiers; mapped to Groq's own
  // recommended replacements.
  groq: {
    'llama-3.3-70b-versatile':                   'openai/gpt-oss-120b', // 2026-08-16
    'llama-3.1-8b-instant':                      'openai/gpt-oss-20b',  // 2026-08-16
    'meta-llama/llama-4-scout-17b-16e-instruct': 'openai/gpt-oss-120b', // 2026-07-17
    'qwen/qwen3-32b':                            'openai/gpt-oss-120b', // 2026-07-17
    'groq/compound':                             'openai/gpt-oss-120b', // 2026-09-21
    'groq/compound-mini':                        'openai/gpt-oss-20b',  // 2026-09-21
  },
};

/** Resolve the model id to call for a provider, honoring a stored choice. */
function resolveModel(providerId, selectedModels = {}) {
  const entry = PROVIDER_MODELS[providerId];
  const fallback = entry ? entry.default : undefined;
  const chosen = selectedModels && selectedModels[providerId];
  const id = (chosen && String(chosen).trim()) || fallback;
  const retired = RETIRED_MODELS[providerId];
  return (retired && retired[id]) || id;
}

/** The catalog entry for a model id (with any per-model request hints), or null. */
function modelOption(providerId, modelId) {
  const entry = PROVIDER_MODELS[providerId];
  return (entry && entry.options.find(o => o.id === modelId)) || null;
}

/** Short, human label for a model id (falls back to the raw id). */
function modelLabel(providerId, modelId) {
  const entry = PROVIDER_MODELS[providerId];
  if (!entry) return modelId || '';
  const found = entry.options.find(o => o.id === modelId);
  return found ? found.label : (modelId || entry.default);
}

/** True when `modelId` is part of a provider's built-in catalog. */
function isCatalogModel(providerId, modelId) {
  const entry = PROVIDER_MODELS[providerId];
  if (!entry || !modelId) return false;
  return entry.options.some(o => o.id === modelId);
}

/**
 * Custom (user-typed) model ids saved for a provider, in stored order, with
 * blanks and any id that's since become part of the catalog filtered out.
 * `customModels` is the persisted `{ providerId: string[] }` map.
 */
function customModelIds(providerId, customModels = {}) {
  const list = (customModels && customModels[providerId]) || [];
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .map(id => String(id || '').trim())
    .filter(id => id && !isCatalogModel(providerId, id) && !seen.has(id) && seen.add(id));
}

/**
 * Remember a custom model id for a provider. Returns a NEW `customModels` map
 * (never mutates) with the id appended unless it's blank, already in the
 * catalog, or already remembered. Most-recently-used stays last.
 */
function rememberCustomModel(providerId, modelId, customModels = {}) {
  const id = String(modelId || '').trim();
  const base = { ...(customModels || {}) };
  if (!id || isCatalogModel(providerId, id)) return base;
  const existing = customModelIds(providerId, customModels);
  if (existing.includes(id)) return base;
  return { ...base, [providerId]: [...existing, id] };
}

/** Drop a remembered custom model id. Returns a NEW `customModels` map. */
function forgetCustomModel(providerId, modelId, customModels = {}) {
  const id = String(modelId || '').trim();
  const base = { ...(customModels || {}) };
  const next = customModelIds(providerId, customModels).filter(x => x !== id);
  if (next.length) base[providerId] = next;
  else delete base[providerId];
  return base;
}

self.PROVIDER_MODELS = PROVIDER_MODELS;
self.RETIRED_MODELS = RETIRED_MODELS;
self.resolveModel = resolveModel;
self.modelLabel = modelLabel;
self.modelOption = modelOption;
self.isCatalogModel = isCatalogModel;
self.customModelIds = customModelIds;
self.rememberCustomModel = rememberCustomModel;
self.forgetCustomModel = forgetCustomModel;
