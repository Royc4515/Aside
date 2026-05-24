// Pure action configuration — no DOM or Chrome API dependencies.
// Loaded by sidebar.html and imported by test.html for unit testing.

const PAGE_ACTIONS = {
  summarize: {
    content: 'Summarize this page in concise bullet points.',
    display: 'Summarize this page',
    label:   'summarize',
  },
  extract: {
    content: 'Extract all structured data from this page as a markdown table with clear headers.',
    display: 'Extract key data',
    label:   'extract',
  },
  'translate-page': {
    content: 'Translate the content of this page to English. Preserve structure.',
    display: 'Translate this page',
    label:   'translate',
  },
  'rewrite-page': {
    content: 'Rewrite the page content to be clearer and more concise.',
    display: 'Rewrite this page',
    label:   'rewrite',
  },
};

// Both 'find' (from TOOL_DEFS card) and 'find-prompt' (from CMD_BAR chip)
// route to the same behaviour: focus the input with a prompt placeholder.
const FIND_ACTIONS = ['find', 'find-prompt'];

// ── Language support ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'auto', label: 'Auto' },
  { code: 'en',   label: 'English' },
  { code: 'he',   label: 'עברית' },
  { code: 'es',   label: 'Español' },
  { code: 'fr',   label: 'Français' },
  { code: 'de',   label: 'Deutsch' },
  { code: 'zh',   label: '中文' },
  { code: 'ar',   label: 'العربية' },
  { code: 'ja',   label: '日本語' },
];

const LANG_NAMES = {
  en: 'English', he: 'Hebrew', es: 'Spanish', fr: 'French',
  de: 'German',  zh: 'Chinese', ar: 'Arabic', ja: 'Japanese',
};

const SUPPORTED_LANGS = Object.keys(LANG_NAMES);

// Normalise an HTML lang attribute value (e.g. "he-IL", "en-US", "ZH")
// to a supported two-letter code, or '' if not supported.
function normalizePageLang(htmlLang) {
  if (!htmlLang || typeof htmlLang !== 'string') return '';
  const code = htmlLang.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGS.includes(code) ? code : '';
}

// Return the code that should actually be used, given the stored preference
// and the auto-detected page language.
function getEffectiveLang(storedLang, detectedLang) {
  return (!storedLang || storedLang === 'auto') ? (detectedLang || '') : storedLang;
}

// Human-readable name for the effective language (empty string = no constraint).
function getEffectiveLangName(storedLang, detectedLang) {
  return LANG_NAMES[getEffectiveLang(storedLang, detectedLang)] || '';
}

