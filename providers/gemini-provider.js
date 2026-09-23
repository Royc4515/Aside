class GeminiProvider extends BaseProvider {
  constructor(apiKey, model) { super(apiKey, model || 'gemini-3.5-flash-lite'); }

  // Gemini's API uses role:"model" for assistant turns and contents[].parts[].
  async complete(messages, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    // Thinking tokens count against maxOutputTokens, so leave headroom.
    // Gemini 3 models take a thinkingLevel but older ones reject it, so only
    // send one when the catalog pins it (see providers/models.js).
    const generationConfig = { maxOutputTokens: 16000 };
    const opt = (typeof modelOption === 'function') ? modelOption('gemini', this.model) : null;
    if (opt && opt.effort) generationConfig.thinkingConfig = { thinkingLevel: opt.effort.toUpperCase() };
    const data = await this._fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig
      })
    });
    const cand = data.candidates?.[0];
    const text = (cand?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
    // An empty answer is never silent: say why (safety block, out of tokens…).
    const reason = data.promptFeedback?.blockReason || cand?.finishReason;
    if (!text && reason && reason !== 'STOP') throw new Error(`Gemini returned no answer (${reason}).`);
    return text;
  }
}
self.GeminiProvider = GeminiProvider;
