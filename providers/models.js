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
    default: 'llama-3.3-70b-versatile',
    options: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (fastest)' },
      { id: 'openai/gpt-oss-120b',     label: 'GPT-OSS 120B' },
      { id: 'openai/gpt-oss-20b',      label: 'GPT-OSS 20B' },
    ],
  },
  ollama: {
    default: 'llama3.1',
    options: [
      { id: 'llama3.1', label: 'Llama 3.1' },
      { id: 'llama3.2', label: 'Llama 3.2' },
      { id: 'llama3.3', label: 'Llama 3.3' },
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
