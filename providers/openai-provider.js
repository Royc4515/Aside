class OpenAIProvider extends OpenAICompatProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'gpt-6-luna');
    this.url = 'https://api.openai.com/v1/chat/completions';
    this.providerId = 'openai';
    // GPT-5+ models reject `max_tokens`, and reasoning tokens count against
    // the cap, so use the newer field with room for thinking.
    this.tokenField = 'max_completion_tokens';
    this.maxOutputTokens = 16000;
  }
}
self.OpenAIProvider = OpenAIProvider;
