class OllamaProvider extends BaseProvider {
  constructor(model, baseUrl = 'http://localhost:11434') {
    super('', model || 'qwen3.5');
    this.baseUrl = baseUrl;
  }

  _body(messages, systemPrompt, stream) {
    const body = { model: this.model, stream, messages: this._msgs(messages, systemPrompt) };
    // Thinking models (Qwen 3.5, Gemma 4, GPT-OSS) otherwise think silently
    // before answering. The catalog pins how much (see providers/models.js).
    const opt = (typeof modelOption === 'function') ? modelOption('ollama', this.model) : null;
    if (opt && opt.effort) body.think = opt.effort === 'none' ? false : opt.effort;
    return JSON.stringify(body);
  }

  async _chat(messages, systemPrompt, stream) {
    const send = () => fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: this._body(messages, systemPrompt, stream)
    });
    let res = await send();
    if (res.status === 404 && await this._useInstalledModel()) res = await send();
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); msg = (typeof j.error === 'string' ? j.error : j.error?.message) || msg; } catch {}
      throw new Error(msg);
    }
    return res;
  }

  // 404 = the model isn't downloaded. The built-in default moves as better
  // local models ship, so for the default fall back to a model the user has
  // already pulled; for an explicit pick, say exactly how to fix it.
  async _useInstalledModel() {
    const missing = this.model;
    const catalog = (typeof PROVIDER_MODELS !== 'undefined') ? PROVIDER_MODELS.ollama : null;
    if (!catalog || missing !== catalog.default) {
      throw new Error(`Ollama model "${missing}" isn't downloaded. Run "ollama pull ${missing}", or pick an installed model in Settings.`);
    }
    let installed = [];
    try {
      const tags = await (await fetch(`${this.baseUrl}/api/tags`)).json();
      installed = (tags.models || []).map(m => m.name).filter(n => !/embed/i.test(n));
    } catch {}
    const has = id => installed.includes(id) || installed.includes(`${id}:latest`);
    const pick = catalog.options.map(o => o.id).find(has) || installed[0];
    if (!pick) throw new Error(`No Ollama models are downloaded yet. Run "ollama pull ${missing}" in a terminal, then try again.`);
    this.model = pick;
    return true;
  }

  async complete(messages, systemPrompt) {
    const res = await this._chat(messages, systemPrompt, false);
    const data = await res.json();
    return data.message?.content || '';
  }

  // Ollama streams NDJSON (one JSON object per line), not SSE.
  async completeStream(messages, systemPrompt, onChunk) {
    const res = await this._chat(messages, systemPrompt, true);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line).message?.content || '';
            if (chunk) { full += chunk; onChunk(chunk); }
          } catch {}
        }
      }
    } finally {
      try { reader.cancel(); } catch {}
    }
    return full;
  }
}
self.OllamaProvider = OllamaProvider;
