class BaseProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model;
    this.providerId = '';   // catalog key in providers/models.js; set by subclasses
  }

  buildSystemPrompt(pageContext, language) {
    let sys = 'You are a helpful AI assistant embedded in a browser sidebar.';
    if (pageContext) {
      sys += ` The user is viewing a webpage. Use the following page content as context when relevant:\n\n${pageContext}`;
    }
    if (language) sys += `\n\nAlways respond in ${language}.`;
    return sys;
  }

  // Prepends the system prompt to user/assistant turns for OpenAI-style APIs.
  _msgs(messages, systemPrompt) {
    return [{ role: 'system', content: systemPrompt }, ...messages];
  }

  // The catalog entry for the current model (with its request hints, e.g.
  // `effort`), or null for a custom id. See providers/models.js.
  _modelOption() {
    return (typeof modelOption === 'function') ? modelOption(this.providerId, this.model) : null;
  }

  // Output-token cap to request. Catalog models get the provider's roomy cap
  // (reasoning counts against it) or their own `maxOutput`. Custom ids may be
  // older models with small output limits, which reject a larger cap outright,
  // so they get a cap every still-served model accepts.
  _outputCap(catalogCap) {
    const opt = this._modelOption();
    if (!opt) return BaseProvider.CUSTOM_OUTPUT_CAP;
    return opt.maxOutput || catalogCap;
  }

  // Error for a non-OK response, using the provider's own message if it sent
  // one ({error:{message}}, {error:"…"} or {message}).
  async _errorFrom(res) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = (typeof j.error === 'string' ? j.error : j.error?.message) || j.message || msg;
    } catch {}
    return new Error(msg);
  }

  async complete(messages, systemPrompt) {
    throw new Error('not implemented');
  }

  // Default fallback: single-chunk emit from complete().
  async completeStream(messages, systemPrompt, onChunk) {
    const text = await this.complete(messages, systemPrompt);
    onChunk(text);
    return text;
  }

  // Generic SSE parser. extractChunk(parsedEvent) returns delta string or ''.
  async _streamSSE(url, opts, onChunk, extractChunk) {
    const res = await fetch(url, opts);
    if (!res.ok) throw await this._errorFrom(res);
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
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const chunk = extractChunk(JSON.parse(data));
            if (chunk) { full += chunk; onChunk(chunk); }
          } catch {}
        }
      }
    } finally {
      try { reader.cancel(); } catch {}
    }
    return full;
  }

  async _fetchJson(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw await this._errorFrom(res);
    return res.json();
  }
}
BaseProvider.CUSTOM_OUTPUT_CAP = 4096;
self.BaseProvider = BaseProvider;

// Shared implementation for OpenAI / Grok / Groq. Subclasses set this.url,
// this.providerId (catalog key) and this.name, and may change the output-cap
// field and size.
class OpenAICompatProvider extends BaseProvider {
  constructor(apiKey, model) {
    super(apiKey, model);
    this.name = 'The model';
    this.tokenField = 'max_tokens';
    this.maxOutputTokens = 2048;
  }
  _headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` };
  }
  _body(messages, systemPrompt, extra) {
    const body = {
      model: this.model,
      [this.tokenField]: this._outputCap(this.maxOutputTokens),
      messages: this._msgs(messages, systemPrompt),
      ...extra
    };
    // Reasoning models: a catalog entry may pin `effort` (see providers/models.js).
    const opt = this._modelOption();
    if (opt && opt.effort) body.reasoning_effort = opt.effort;
    return JSON.stringify(body);
  }
  // An empty answer is never silent: say why (refused, or out of tokens).
  _answer(text, finishReason, refusal) {
    if (!text && refusal) throw new Error(`${this.name} declined to answer: ${refusal}`);
    if (!text && finishReason === 'length') {
      throw new Error(`${this.name} used its whole output budget before answering. Try again, or pick a faster model.`);
    }
    return text;
  }
  async complete(messages, systemPrompt) {
    const data = await this._fetchJson(this.url, {
      method: 'POST', headers: this._headers(), body: this._body(messages, systemPrompt)
    });
    const choice = data.choices?.[0];
    return this._answer(choice?.message?.content || '', choice?.finish_reason, choice?.message?.refusal);
  }
  async completeStream(messages, systemPrompt, onChunk) {
    let finishReason = '';
    let refusal = '';
    let streamError = '';
    const full = await this._streamSSE(
      this.url,
      { method: 'POST', headers: this._headers(), body: this._body(messages, systemPrompt, { stream: true }) },
      onChunk,
      ev => {
        if (ev.error) streamError = ev.error.message || String(ev.error);
        const choice = ev.choices?.[0];
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        if (choice?.delta?.refusal) refusal += choice.delta.refusal;
        return choice?.delta?.content || '';
      }
    );
    // A stream that errors after some text is cut off, not finished.
    if (streamError) throw new Error(`${this.name} stopped mid-answer (${streamError}). Try again.`);
    return this._answer(full, finishReason, refusal);
  }
}
self.OpenAICompatProvider = OpenAICompatProvider;
