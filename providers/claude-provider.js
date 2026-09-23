const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_REFUSAL = 'Claude declined to answer this request. Try rephrasing it, or switch to another model.';

class ClaudeProvider extends BaseProvider {
  constructor(apiKey, model) { super(apiKey, model || 'claude-sonnet-5'); }

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
    const body = { model: this.model, max_tokens: 16000, system: systemPrompt, messages, ...extra };
    const opt = (typeof modelOption === 'function') ? modelOption('claude', this.model) : null;
    if (opt && opt.effort) body.output_config = { effort: opt.effort };
    return JSON.stringify(body);
  }

  async complete(messages, systemPrompt) {
    const data = await this._fetchJson(CLAUDE_URL, {
      method: 'POST', headers: this._headers(), body: this._body(messages, systemPrompt)
    });
    if (data.stop_reason === 'refusal') throw new Error(CLAUDE_REFUSAL);
    // Thinking models return a thinking block before the text — keep text only.
    return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
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
        if (ev.type === 'error') streamError = ev.error?.message || 'Claude stream error';
        return (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') ? ev.delta.text : '';
      }
    );
    if (streamError && !full) throw new Error(streamError);
    if (stopReason === 'refusal' && !full) throw new Error(CLAUDE_REFUSAL);
    return full;
  }
}
self.ClaudeProvider = ClaudeProvider;
