/**
 * ProviderFactory.get(id, apiKeys, selectedModels) → provider instance.
 * `selectedModels` is an optional { providerId: modelId } map; when absent or
 * empty for a provider, the provider's catalog default is used.
 */
class ProviderFactory {
  static get(id, apiKeys = {}, selectedModels = {}) {
    const key = apiKeys[id] || '';
    const model = (typeof resolveModel === 'function')
      ? resolveModel(id, selectedModels)
      : (selectedModels && selectedModels[id]) || undefined;
    switch (id) {
      case 'claude': return new ClaudeProvider(key, model);
      case 'gemini': return new GeminiProvider(key, model);
      case 'openai': return new OpenAIProvider(key, model);
      case 'grok':   return new GrokProvider(key, model);
      case 'groq':   return new GroqProvider(key, model);
      case 'ollama': return new OllamaProvider(model);
      default: throw new Error(`Unknown provider: ${id}`);
    }
  }
}
self.ProviderFactory = ProviderFactory;
