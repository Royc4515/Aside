/**
 * Single source of truth for which model each provider calls.
 *
 * - `default` is used when the user hasn't picked a model.
 * - `options` populate the model picker in Settings.
 * - Users can also type a *custom* model id, so they're never locked to this
 *   list — provider APIs ship new model ids constantly, and the custom field
 *   is the escape hatch. `resolveModel` trusts whatever id is stored.
 *
 * Model ids must match each provider's API exactly. If a provider renames or
 * retires a model, update the default/options here (one place) — every
 * provider, the factory, and both UIs read from this catalog.
 */
const PROVIDER_MODELS = {
  claude: {
    default: 'claude-sonnet-4-5',
    options: [
      { id: 'claude-sonnet-4-5',        label: 'Claude Sonnet 4.5' },
      { id: 'claude-opus-4-1',          label: 'Claude Opus 4.1' },
      { id: 'claude-3-5-haiku-latest',  label: 'Claude Haiku 3.5' },
    ],
  },
  openai: {
    default: 'gpt-4o-mini',
    options: [
      { id: 'gpt-4o-mini',  label: 'GPT-4o mini' },
      { id: 'gpt-4o',       label: 'GPT-4o' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'gpt-4.1',      label: 'GPT-4.1' },
    ],
  },
  gemini: {
    default: 'gemini-2.0-flash',
    options: [
      { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
      { id: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro' },
    ],
  },
  grok: {
    default: 'grok-3-mini',
    options: [
      { id: 'grok-3-mini', label: 'Grok 3 mini' },
      { id: 'grok-3',      label: 'Grok 3' },
      { id: 'grok-2-1212', label: 'Grok 2' },
    ],
  },
  groq: {
    default: 'llama-3.3-70b-versatile',
    options: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (fastest)' },
      { id: 'openai/gpt-oss-120b',     label: 'GPT-OSS 120B' },
    ],
  },
  ollama: {
    default: 'llama3.1',
    options: [
      { id: 'llama3.1', label: 'Llama 3.1' },
      { id: 'llama3.2', label: 'Llama 3.2' },
      { id: 'mistral',  label: 'Mistral' },
      { id: 'qwen2.5',  label: 'Qwen 2.5' },
    ],
  },
};

/** Resolve the model id to call for a provider, honoring a stored choice. */
function resolveModel(providerId, selectedModels = {}) {
  const entry = PROVIDER_MODELS[providerId];
  const fallback = entry ? entry.default : undefined;
  const chosen = selectedModels && selectedModels[providerId];
  return (chosen && String(chosen).trim()) || fallback;
}

/** Short, human label for a model id (falls back to the raw id). */
function modelLabel(providerId, modelId) {
  const entry = PROVIDER_MODELS[providerId];
  if (!entry) return modelId || '';
  const found = entry.options.find(o => o.id === modelId);
  return found ? found.label : (modelId || entry.default);
}

self.PROVIDER_MODELS = PROVIDER_MODELS;
self.resolveModel = resolveModel;
self.modelLabel = modelLabel;
