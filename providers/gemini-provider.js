class GeminiProvider extends BaseProvider {
  async validateKey() {
    if (!this.apiKey) return { ok: false, error: 'Missing API key' };
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(this.apiKey)}`;
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return { ok: true };
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.error?.message || j.message || msg; } catch {}
      return { ok: false, error: msg };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  // Gemini's API uses role:"model" for assistant turns and contents[].parts[].
  async complete(messages, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
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
