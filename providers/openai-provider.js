class OpenAIProvider extends OpenAICompatProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'gpt-4o-mini');
    this.url = 'https://api.openai.com/v1/chat/completions';
  }
}
self.OpenAIProvider = OpenAIProvider;
