/**
 * Shared provider visual identity.
 * Each mark is a 16×16 SVG snippet drawn on white at the provider's brand hue.
 * Original geometric monograms — distinctive but not copies of official logos.
 *
 * Exposed as window.PROVIDER_MARKS so it's available to sidebar, options, popup.
 */
(function () {
  const STROKE = 'stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const FILL   = 'fill="white"';

  const MARKS = {
    // Claude — 4-point starburst (sparkle)
    claude: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE}>
        <path d="M8 1.5C8.6 4 9.8 5.6 12.5 6.3 9.8 7 8.6 8.6 8 11.1 7.4 8.6 6.2 7 3.5 6.3 6.2 5.6 7.4 4 8 1.5z"/>
        <path d="M12.2 11.6c.2.6.6 1 1.3 1.2-.7.2-1.1.6-1.3 1.3-.2-.7-.6-1.1-1.3-1.3.7-.2 1.1-.6 1.3-1.2z" ${FILL} stroke="none"/>
      </svg>`,

    // OpenAI/GPT — 6-petal knot (rotational symmetry)
    openai: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE}>
        <path d="M8 2.5 11.5 4.5 11.5 8.5 8 10.5 4.5 8.5 4.5 4.5 8 2.5z"/>
        <path d="M8 5.5 9.7 6.5 9.7 8.5 8 9.5 6.3 8.5 6.3 6.5 8 5.5z" ${FILL} stroke="none"/>
        <path d="M4.5 8.5 4.5 12.5 8 14.5 11.5 12.5 11.5 8.5"/>
      </svg>`,

    // Gemini — 4-point diamond star
    gemini: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE}>
        <path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5z" ${FILL} stroke="none"/>
      </svg>`,

    // Grok — angular slash X
    grok: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE} stroke-width="2.2">
        <path d="M3 3 13 13M13 3 3 13"/>
      </svg>`,

    // Groq — lightning bolt
    groq: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE}>
        <path d="M9 1.5 3.5 9 7.5 9 6 14.5 12.5 7 8.5 7z" ${FILL} stroke-linejoin="round"/>
      </svg>`,

    // Ollama — rounded llama silhouette (head + ears)
    ollama: `
      <svg viewBox="0 0 16 16" fill="none" ${STROKE}>
        <path d="M4 7c0-2.2 1.8-4 4-4s4 1.8 4 4v3.5c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7z" ${FILL} stroke-linejoin="round"/>
        <path d="M5 2.5 6 5.5M11 2.5 10 5.5" stroke-width="1.5"/>
        <circle cx="6.5" cy="8" r="0.7" fill="white" stroke="none"/>
        <circle cx="9.5" cy="8" r="0.7" fill="white" stroke="none"/>
      </svg>`,
  };

  /** Render the colored chip + mark for a provider id. Returns HTML string. */
  function providerChip(providerId, size = 32, hue) {
    const mark = MARKS[providerId] || `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="white"/></svg>`;
    return `
      <span class="provider-chip" style="
        width: ${size}px; height: ${size}px;
        border-radius: ${Math.round(size * 0.28)}px;
        background: ${hue || 'var(--ink-3)'};
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      ">
        <span style="width: ${Math.round(size * 0.62)}px; height: ${Math.round(size * 0.62)}px; display: inline-flex;">${mark}</span>
      </span>`;
  }

  window.PROVIDER_MARKS = MARKS;
  window.providerChip   = providerChip;
})();
