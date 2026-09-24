/**
 * Single source of truth for which model each provider calls.
 *
 * - `default` is used when the user hasn't picked a model.
 * - `options` populate the model picker in Settings and the sidebar.
 * - Users can also type a *custom* model id, so they're never locked to this
 *   list — provider APIs ship new model ids constantly, and the custom field
 *   is the escape hatch. `resolveModel` trusts whatever id is stored.
 *
 * Model ids verified against each provider's official docs (May 2026):
 *   Anthropic  platform.claude.com/docs/en/about-claude/models/overview
 *   OpenAI     developers.openai.com/api/docs/models
 *   Gemini     ai.google.dev/gemini-api/docs/models
 *   xAI        docs.x.ai/developers/models
 *   Groq       console.groq.com/docs/models
 * If a provider renames or retires a model, update the default/options here
 * (one place) — every provider, the factory, and both UIs read this catalog.
 */
const PROVIDER_MODELS = {
  claude: {
    default: 'claude-sonnet-4-6',
    options: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-8',   label: 'Claude Opus 4.8' },
      { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
    ],
  },
  openai: {
    default: 'gpt-4o-mini',
    options: [
      { id: 'gpt-4o-mini',  label: 'GPT-4o mini' },
      { id: 'gpt-4o',       label: 'GPT-4o' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
      { id: 'gpt-5.5',      label: 'GPT-5.5' },
    ],
  },
  gemini: {
    default: 'gemini-2.5-flash',
    options: [
      { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash' },
      { id: 'gemini-3.5-flash',      label: 'Gemini 3.5 Flash' },
      { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    ],
  },
  grok: {
    default: 'grok-3-mini',
    options: [
      { id: 'grok-3-mini', label: 'Grok 3 mini' },
      { id: 'grok-4.3',    label: 'Grok 4.3' },
      { id: 'grok-4',      label: 'Grok 4' },
      { id: 'grok-3',      label: 'Grok 3' },
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
    default: 'llama3.1',
    options: [
      { id: 'llama3.1',    label: 'Llama 3.1' },
      { id: 'llama3.2',    label: 'Llama 3.2' },
      { id: 'llama3.3',    label: 'Llama 3.3' },
      { id: 'gemma3',      label: 'Gemma 3' },
      { id: 'gemma3:4b',   label: 'Gemma 3 4B' },
      { id: 'qwen3',       label: 'Qwen 3' },
      { id: 'qwen3:4b',    label: 'Qwen 3 4B' },
      { id: 'qwen2.5',     label: 'Qwen 2.5' },
      { id: 'phi4',        label: 'Phi-4' },
      { id: 'deepseek-r1', label: 'DeepSeek R1' },
      { id: 'mistral',     label: 'Mistral' },
    ],
  },
};

/**
 * Model ids a provider has shut down, mapped to the catalog model that
 * replaces them. A user whose stored pick is listed here is moved to the
 * successor instead of hitting a "model not found" error.
 */
const RETIRED_MODELS = {
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
