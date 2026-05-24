/**
 * Aside — Quick prompt templates.
 * Curated, one-tap prompts that fill the composer when input is empty.
 *
 * Each template has:
 *   id       — stable identifier
 *   label    — short chip text (verb-first)
 *   icon     — inline SVG <path d> string
 *   prompt   — what to insert into the composer
 *   needsSelection — if true, only show when text is selected
 *
 * Exposed as window.PROMPT_TEMPLATES.
 */
(function () {
  const TEMPLATES = [
    {
      id: 'eli5',
      label: 'ELI5',
      icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1.5 1.5 1.5 2.5h5c0-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z"/>',
      prompt: 'Explain this page like I\'m five — short, simple, fun.',
    },
    {
      id: 'bullets',
      label: 'Bullet points',
      icon: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
      prompt: 'Summarize this page as concise bullet points. One idea per bullet.',
    },
    {
      id: 'actions',
      label: 'Action items',
      icon: '<polyline points="20 6 9 17 4 12"/>',
      prompt: 'Extract action items from this page. List who, what, by when if available.',
    },
    {
      id: 'quotes',
      label: 'Find quotes',
      icon: '<path d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6"/>',
      prompt: 'Find the 3 most quotable sentences from this page and explain why each matters.',
    },
    {
      id: 'questions',
      label: 'Ask me',
      icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
      prompt: 'Ask me 5 thoughtful questions to help me reflect on this page.',
    },
    {
      id: 'counter',
      label: 'Counter-arguments',
      icon: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
      prompt: 'Give me three strong counter-arguments to the main points of this page.',
    },
    {
      id: 'translate-he',
      label: 'Translate to Hebrew',
      icon: '<path d="M4 5h7M7.5 4v2M5 9c.7 2.5 2 4.5 4 6M11 9c-1.5 4-4 6.5-7 8M14 21l4-9 4 9M15.5 18h5"/>',
      prompt: 'Translate this page to Hebrew. Preserve structure and tone.',
    },
    {
      id: 'jargon',
      label: 'No jargon',
      icon: '<path d="M14 4l6 6L9 21H3v-6z"/>',
      prompt: 'Rewrite this page in plain language — no jargon, no buzzwords.',
    },
  ];

  window.PROMPT_TEMPLATES = TEMPLATES;
})();
