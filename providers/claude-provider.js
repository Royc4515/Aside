const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_REFUSAL = 'Claude declined to answer this request. Try rephrasing it, or switch to another model.';
const CLAUDE_OUT_OF_TOKENS = 'Claude used its whole output budget thinking before it answered. Try again, or pick a faster model.';

class ClaudeProvider extends BaseProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'claude-sonnet-5');
    this.providerId = 'claude';
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  }

  // Current Claude models think adaptively and thinking counts against
  // max_tokens, so leave headroom or the visible answer gets cut short.
  // A catalog entry may pin a lighter `effort` (see providers/models.js).
  _body(messages, systemPrompt, extra) {
    const body = { model: this.model, max_tokens: this._outputCap(16000), system: systemPrompt, messages, ...extra };
    const opt = this._modelOption();
    if (opt && opt.effort) body.output_config = { effort: opt.effort };
    return JSON.stringify(body);
  }

  // A refusal is never shown as an answer, even if some text came first, and
  // an empty answer is never silent.
  _answer(text, stopReason) {
    if (stopReason === 'refusal') throw new Error(CLAUDE_REFUSAL);
    if (!text && stopReason === 'max_tokens') throw new Error(CLAUDE_OUT_OF_TOKENS);
    return text;
  }

  async complete(messages, systemPrompt) {
    const data = await this._fetchJson(CLAUDE_URL, {
      method: 'POST', headers: this._headers(), body: this._body(messages, systemPrompt)
    });
    // Thinking models return a thinking block before the text — keep text only.
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return this._answer(text, data.stop_reason);
  }

  async completeStream(messages, systemPrompt, onChunk) {
    let stopReason = '';
    let streamError = '';
    const full = await this._streamSSE(
      CLAUDE_URL,
      { method: 'POST', headers: this._headers(), body: this._body(messages, systemPrompt, { stream: true }) },
      onChunk,
      ev => {
        if (ev.type === 'message_delta' && ev.delta?.stop_reason) stopReason = ev.delta.stop_reason;
        if (ev.type === 'error') streamError = ev.error?.message || 'stream error';
        return (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') ? ev.delta.text : '';
      }
    );
    // A stream that errors after some text is cut off, not finished.
    if (streamError) throw new Error(`Claude stopped mid-answer (${streamError}). Try again.`);
    return this._answer(full, stopReason);
  }
}
self.ClaudeProvider = ClaudeProvider;
