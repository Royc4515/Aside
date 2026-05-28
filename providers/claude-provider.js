class ClaudeProvider extends BaseProvider {
  async validateKey() {
    if (!this.apiKey) return { ok: false, error: 'Missing API key' };
    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      });
      if (res.ok) return { ok: true };
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = j.error?.message || j.message || msg; } catch {}
      return { ok: false, error: msg };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  async complete(messages, systemPrompt) {
    const data = await this._fetchJson('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        system: systemPrompt,
        messages
      })
    });
    return data.content?.[0]?.text || '';
  }

  async completeStream(messages, systemPrompt, onChunk) {
    return this._streamSSE(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
          stream: true
        })
      },
      onChunk,
      ev => (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta')
        ? ev.delta.text
        : ''
    );
  }
}
self.ClaudeProvider = ClaudeProvider;
