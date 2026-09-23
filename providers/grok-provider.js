class GrokProvider extends OpenAICompatProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'grok-4.3');
    this.url = 'https://api.x.ai/v1/chat/completions';
    this.providerId = 'grok';
    // xAI deprecated `max_tokens`; Grok 4.5+ always reason, so leave headroom.
    this.tokenField = 'max_completion_tokens';
    this.maxOutputTokens = 16000;
  }
}
self.GrokProvider = GrokProvider;
