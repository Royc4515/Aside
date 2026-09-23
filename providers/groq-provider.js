class GroqProvider extends OpenAICompatProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'openai/gpt-oss-120b');
    this.url = 'https://api.groq.com/openai/v1/chat/completions';
    this.providerId = 'groq';
    // `max_tokens` is deprecated. GPT-OSS reasons before answering, but the
    // free plan's 8K tokens-per-minute limit counts the cap, so keep it modest.
    this.tokenField = 'max_completion_tokens';
    this.maxOutputTokens = 4096;
    this.fallbackModel = 'openai/gpt-oss-20b';
  }

  // Groq retires models often. If the chosen one is gone, retry once on the
  // fallback. Safe for streaming too: a missing model fails before any chunk.
  async _withFallback(run) {
    if (!this.apiKey) throw new Error('Groq API key is missing. Please add it in settings.');
    try {
      return await run();
    } catch (err) {
      const gone = /model_not_found|not found|decommission|does not exist/i.test(err.message);
      if (!gone || this.model === this.fallbackModel) throw err;
      const orig = this.model;
      this.model = this.fallbackModel;
      try { return await run(); }
      finally { this.model = orig; }
    }
  }

  complete(messages, systemPrompt) {
    return this._withFallback(() => super.complete(messages, systemPrompt));
  }

  completeStream(messages, systemPrompt, onChunk) {
    return this._withFallback(() => super.completeStream(messages, systemPrompt, onChunk));
  }
}
self.GroqProvider = GroqProvider;
