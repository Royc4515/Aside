class OllamaProvider extends BaseProvider {
  // `pinned` is true when the user picked this model themselves (Settings or
  // the sidebar picker), as opposed to running on the catalog default.
  constructor(model, { baseUrl = 'http://localhost:11434', pinned = false } = {}) {
    super('', model || 'qwen3.5');
    this.providerId = 'ollama';
    this.baseUrl = baseUrl;
    this.pinned = pinned;
  }

  _body(messages, systemPrompt, stream) {
    const body = { model: this.model, stream, messages: this._msgs(messages, systemPrompt) };
    // Thinking models (Qwen 3.5, Gemma 4, GPT-OSS) otherwise think silently
    // before answering. The catalog pins how much (see providers/models.js).
    const opt = this._modelOption();
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
    if (!res.ok) throw await this._errorFrom(res);
    return res;
  }

  // 404 = the model isn't downloaded. A model the user picked stays theirs:
  // say exactly how to get it. Only when they never picked one (so they're on
  // the built-in default, which moves as better local models ship) switch to
  // a model they already have.
  async _useInstalledModel() {
    const missing = this.model;
    const catalog = (typeof PROVIDER_MODELS !== 'undefined') ? PROVIDER_MODELS.ollama : null;
    if (this.pinned || !catalog || missing !== catalog.default) {
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
    this.pinned = true;
    await this._saveAsPick(pick);
    return true;
  }

  // Save the fallback as the user's Ollama pick, so every label (popup,
  // sidebar, Settings) names the model that actually answers, and later
  // sessions call it directly instead of retrying the missing default.
  async _saveAsPick(model) {
    try {
      if (typeof Store === 'undefined') return;
      const { selectedModels = {} } = await Store.get(['selectedModels']);
      if (selectedModels.ollama) return;   // the user picked one meanwhile; keep it
      await Store.set({ selectedModels: { ...selectedModels, ollama: model } });
    } catch {}
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
