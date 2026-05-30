class GrokProvider extends OpenAICompatProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'grok-3-mini');
    this.url = 'https://api.x.ai/v1/chat/completions';
  }
}
self.GrokProvider = GrokProvider;
