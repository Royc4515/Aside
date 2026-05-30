class GeminiProvider extends BaseProvider {
  constructor(apiKey, model) { super(apiKey, model || 'gemini-2.5-flash'); }

  // Gemini's API uses role:"model" for assistant turns and contents[].parts[].
  async complete(messages, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const data = await this._fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2048 }
      })
    });
    return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  }
}
self.GeminiProvider = GeminiProvider;
