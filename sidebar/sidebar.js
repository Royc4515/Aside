// ── State ──────────────────────────────────────────────────────────────────
let settings     = {};
let provider     = null;
let selectedText = '';
let pageContent  = '';
let pageUrl      = '';
let pageTitle    = '';
let currentThreadId = null;
let compareMode = false;
let compareProviderId = null;
let historyFilterByPage = false;
let historySearch = '';
let turns        = [];      // { role, content, display?, action?, model?, html?, loading?, streaming? }
let activeTab    = 'chat';
let pickerOpen   = false;
let langPickerOpen = false;
let detectedLang = '';
let busy         = false;
let _renderPending = false;

const PROVIDERS = [
  { id: 'claude', name: 'Claude', model: '3.5 Sonnet',   hue: 'var(--p-claude)' },
  { id: 'gemini', name: 'Gemini', model: '2.0 Flash',    hue: 'var(--p-gemini)' },
  { id: 'openai', name: 'GPT-4o', model: '4o mini',      hue: 'var(--p-gpt)'    },
  { id: 'grok',   name: 'Grok',   model: 'Grok-2',       hue: 'var(--p-grok)'   },
  { id: 'groq',   name: 'Groq',   model: 'Llama 3.3',    hue: 'var(--p-groq)'   },
  { id: 'ollama', name: 'Ollama', model: 'Local',         hue: 'var(--p-ollama)' },
];

const ACTION_LABEL_KEYS = {
  explain: 'action_explain', summarize: 'action_summarize', ask: 'action_ask',
  reply: 'action_reply', extract: 'action_extract',
  translate: 'action_translate', rewrite: 'action_rewrite', find: 'action_find',
};
function actionLabel(key) { return t(ACTION_LABEL_KEYS[key]) || key; }

const TOOL_DEFS = {
  page: [
    { id: 'summarize',      lk: 'tool_summarize',          sk: 'tool_summarize_sub',          iconPath: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
    { id: 'extract',        lk: 'tool_extract',            sk: 'tool_extract_sub',            iconPath: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>' },
    { id: 'find',           lk: 'tool_find',               sk: 'tool_find_sub',               iconPath: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>' },
    { id: 'translate-page', lk: 'tool_translate_page',     sk: 'tool_translate_page_sub',     iconPath: '<path d="M4 5h7M7.5 4v2M5 9c.7 2.5 2 4.5 4 6M11 9c-1.5 4-4 6.5-7 8M14 21l4-9 4 9M15.5 18h5"/>' },
  ],
  sel: [
    { id: 'explain',   lk: 'tool_explain',   sk: 'tool_explain_sub',   iconPath: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1.5 1.5 1.5 2.5h5c0-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z"/>' },
    { id: 'reply',     lk: 'tool_reply',     sk: 'tool_reply_sub',     iconPath: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h7a6 6 0 0 1 6 6v2"/>' },
    { id: 'translate', lk: 'tool_translate', sk: 'tool_translate_sub', iconPath: '<path d="M4 5h7M7.5 4v2M5 9c.7 2.5 2 4.5 4 6M11 9c-1.5 4-4 6.5-7 8M14 21l4-9 4 9M15.5 18h5"/>' },
    { id: 'rewrite',   lk: 'tool_rewrite',   sk: 'tool_rewrite_sub',   iconPath: '<path d="M14 4l6 6L9 21H3v-6z"/>' },
  ]
};

const CMD_BAR = [
  { id: 'summarize',      lk: 'cmd_summarize',      accent: true },
  { id: 'extract',        lk: 'cmd_extract' },
  { id: 'translate-page', lk: 'cmd_translate_page' },
  { id: 'rewrite-page',   lk: 'cmd_rewrite_page' },
  { id: 'find-prompt',    lk: 'cmd_find' },
];

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  await loadSettings();
  bindUI();
  renderHeader();
  renderLangBtn();
  applyUILanguage();
  requestPageContent();
  renderTemplates();
}

function applyUILanguage() {
  const lang = getEffectiveLang(settings.language, detectedLang) || 'en';
  setUILanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
  delete pickHeroTitle._pick;
  applyI18n();
  renderHero();
  renderTools();
  renderCmdbar();
}

async function loadSettings() {
  settings = await chrome.storage.sync.get(['activeProvider','apiKeys','language','theme','pageContext']);
  settings.apiKeys = settings.apiKeys || {};
  settings.theme = settings.theme || 'auto';
  applyTheme(settings.theme);
  renderContextPill();
  if (!settings.activeProvider || (!settings.apiKeys[settings.activeProvider] && settings.activeProvider !== 'ollama')) {
    showOnboarding(); return;
  }
  try {
    provider = ProviderFactory.get(settings.activeProvider, settings.apiKeys);
    hideOnboarding();
  } catch (e) { showOnboarding(); }
}

function bindUI() {
  document.getElementById('close-btn').onclick = () =>
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  document.getElementById('settings-btn').onclick = () => chrome.runtime.openOptionsPage();
  // The legacy single-screen "Open Settings" button no longer exists;
  // 3-step onboarding takes over. Bind its handlers instead.
  bindOnboarding();
  document.getElementById('new-chat-btn').onclick = newChat;
  document.getElementById('compare-btn').onclick = toggleCompareMode;
  document.getElementById('history-btn').onclick = openHistory;
  document.getElementById('history-back').onclick = closeHistory;
  document.getElementById('history-clear').onclick = clearAllHistory;
  document.getElementById('history-search').oninput = (e) => {
    historySearch = e.target.value;
    renderHistoryList();
  };
  document.getElementById('history-filter-clear').onclick = () => {
    historyFilterByPage = false;
    renderHistoryList();
  };
  document.getElementById('theme-btn').onclick = cycleTheme;
  document.getElementById('lang-btn').onclick = () => toggleLangPicker();
  document.getElementById('model-btn').onclick = () => togglePicker('a');
  document.getElementById('compare-slot-a').onclick = () => togglePicker('a');
  document.getElementById('compare-slot-b').onclick = () => togglePicker('b');
  document.getElementById('compare-bar-close').onclick = () => { if (compareMode) toggleCompareMode(); };

  document.getElementById('ask-btn').onclick = handleAsk;
  const input = document.getElementById('ask-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 180) + 'px';
    renderTemplates();
  });

  document.querySelectorAll('.sb-tab').forEach(t => {
    t.onclick = () => switchTab(t.dataset.tab);
  });

  document.getElementById('retry-btn').onclick = () => {
    document.getElementById('error-state').style.display = 'none';
    const last = turns[turns.length - 1];
    if (last?.role === 'user') runPrompt(last.label || 'ask');
  };

  document.getElementById('selection-wrap').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) handleAction(btn.dataset.action);
  });
}

function switchTab(name) {
  activeTab = name;
  document.querySelectorAll('.sb-tab').forEach(t =>
    t.classList.toggle('is-active', t.dataset.tab === name));
  document.getElementById('tab-chat').style.display  = name === 'chat'  ? '' : 'none';
  document.getElementById('tab-tools').style.display = name === 'tools' ? '' : 'none';
}

// ── Per-page memory banner ─────────────────────────────────────────────
async function renderPageMemory() {
  const banner = document.getElementById('page-memory');
  if (!banner || !window.History) return;
  if (!pageUrl) { banner.hidden = true; return; }
  try {
    const all = await window.History.listThreads();
    // Show count of OTHER threads on this URL (exclude current)
    const matches = all.filter(t => t.pageUrl === pageUrl && t.id !== currentThreadId);
    if (matches.length === 0) { banner.hidden = true; return; }
    banner.hidden = false;
    const text = document.getElementById('page-memory-text');
    const tpl = matches.length === 1
      ? (t('page_memory_one')   || '1 previous chat on this page')
      : (t('page_memory_many')  || `${matches.length} previous chats on this page`).replace('{n}', matches.length);
    text.textContent = tpl.replace('{n}', matches.length);
    banner.onclick = () => {
      historyFilterByPage = true;
      historySearch = '';
      openHistory();
    };
  } catch (e) {
    banner.hidden = true;
  }
}

// ── Quick prompt templates ─────────────────────────────────────────────
function renderTemplates() {
  const wrap = document.getElementById('templates');
  const scroll = document.getElementById('templates-scroll');
  if (!wrap || !scroll) return;
  const input = document.getElementById('ask-input');
  // Only show when input is empty AND we're not mid-stream
  const empty = !input || !input.value.trim();
  if (!empty || busy) { wrap.hidden = true; return; }
  if (!window.PROMPT_TEMPLATES) { wrap.hidden = true; return; }
  wrap.hidden = false;
  scroll.innerHTML = window.PROMPT_TEMPLATES.map(p => `
    <button class="sb-template" data-prompt="${p.id}" type="button" title="${escapeHtml(p.prompt)}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p.icon}</svg>
      <span>${escapeHtml(p.label)}</span>
    </button>`).join('');
  scroll.querySelectorAll('.sb-template').forEach(b => {
    b.onclick = () => {
      const tpl = window.PROMPT_TEMPLATES.find(x => x.id === b.dataset.prompt);
      if (!tpl) return;
      input.value = tpl.prompt;
      input.focus();
      // Resize textarea to content
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 180) + 'px';
      renderTemplates(); // will hide since input is now non-empty
    };
  });
}
let onbSelectedProvider = null;
let onbStep = 1;

const ONB_PROVIDERS = [
  { id: 'gemini', name: 'Gemini',  desc: 'Fast & free tier',         tier: 'free', placeholder: 'AIza…',
    keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq',   name: 'Groq',    desc: 'Llama 3.3 · free & fast',  tier: 'free', placeholder: 'gsk_…',
    keyUrl: 'https://console.groq.com/keys' },
  { id: 'claude', name: 'Claude',  desc: 'Thoughtful, top quality',  tier: 'paid', placeholder: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'GPT-4o',  desc: 'Versatile mini model',     tier: 'paid', placeholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'grok',   name: 'Grok',    desc: 'xAI · fast reasoning',     tier: 'paid', placeholder: 'xai-…',
    keyUrl: 'https://console.x.ai/' },
  { id: 'ollama', name: 'Ollama',  desc: 'Local · no key needed',    tier: 'free', placeholder: '',
    keyUrl: 'https://ollama.com/download' },
];

const ONB_TRY_PROMPTS = [
  { iconPath: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    label: 'Summarize this page' },
  { iconPath: '<path d="M4 5h7M7.5 4v2M5 9c.7 2.5 2 4.5 4 6M11 9c-1.5 4-4 6.5-7 8M14 21l4-9 4 9M15.5 18h5"/>',
    label: 'Translate to English' },
  { iconPath: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1.5 1.5 1.5 2.5h5c0-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z"/>',
    label: 'Explain what this page is about' },
];

function renderOnboardingProviders() {
  const root = document.getElementById('onb-providers');
  if (!root) return;
  root.innerHTML = ONB_PROVIDERS.map(p => {
    const hueVar = ({
      claude: 'var(--p-claude)', openai: 'var(--p-gpt)', gemini: 'var(--p-gemini)',
      grok: 'var(--p-grok)', groq: 'var(--p-groq)', ollama: 'var(--p-ollama)',
    })[p.id];
    const chip = window.providerChip ? window.providerChip(p.id, 28, hueVar)
               : `<span class="dot" style="background:${hueVar}"></span>`;
    return `
      <button class="sb-onb-provider${p.id === onbSelectedProvider ? ' is-selected' : ''}" data-id="${p.id}">
        ${chip}
        <span class="sb-onb-provider-body">
          <span class="sb-onb-provider-name">${p.name}</span>
          <span class="sb-onb-provider-desc">${p.desc}</span>
        </span>
        <span class="sb-onb-provider-tier sb-onb-provider-tier--${p.tier}">${p.tier === 'paid' ? 'Paid' : 'Free'}</span>
      </button>`;
  }).join('');
  root.querySelectorAll('.sb-onb-provider').forEach(b => {
    b.onclick = () => {
      onbSelectedProvider = b.dataset.id;
      renderOnboardingProviders();
      document.getElementById('onb-step1-next').disabled = false;
    };
  });
}

function setOnbStep(step) {
  onbStep = step;
  document.querySelectorAll('.sb-onb-pane').forEach(p => {
    p.hidden = +p.dataset.pane !== step;
  });
  document.querySelectorAll('.sb-onboarding-step').forEach(s => {
    const n = +s.dataset.step;
    s.classList.toggle('is-active', n === step);
    s.classList.toggle('is-done',   n < step);
  });
  if (step === 2) hydrateOnbStep2();
  if (step === 3) hydrateOnbStep3();
}

function hydrateOnbStep2() {
  const p = ONB_PROVIDERS.find(x => x.id === onbSelectedProvider);
  if (!p) return;
  // Mark
  const mark = document.getElementById('onb-step2-mark');
  const hueVar = ({
    claude: 'var(--p-claude)', openai: 'var(--p-gpt)', gemini: 'var(--p-gemini)',
    grok: 'var(--p-grok)', groq: 'var(--p-groq)', ollama: 'var(--p-ollama)',
  })[p.id];
  mark.style.background = 'transparent';
  mark.innerHTML = window.providerChip ? window.providerChip(p.id, 60, hueVar) : '';
  // Title + sub
  document.getElementById('onb-step2-title').textContent = `Connect ${p.name}`;
  // Help link
  const help = document.getElementById('onb-key-help');
  help.href = p.keyUrl;
  help.style.display = p.keyUrl ? '' : 'none';
  // Input
  const input = document.getElementById('onb-key-input');
  input.placeholder = p.placeholder || '';
  input.value = '';
  input.type = p.id === 'ollama' ? 'text' : 'password';
  if (p.id === 'ollama') input.placeholder = 'http://localhost:11434';
  const status = document.getElementById('onb-key-status');
  status.textContent = '';
  status.className = 'sb-onb-key-status';
  const next = document.getElementById('onb-step2-next');
  next.disabled = p.id !== 'ollama';
  next.textContent = p.id === 'ollama' ? 'Use local Ollama' : 'Connect';
  input.oninput = () => {
    const v = input.value.trim();
    next.disabled = !v && p.id !== 'ollama';
  };
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !next.disabled) { e.preventDefault(); next.click(); }
  };
  setTimeout(() => input.focus(), 60);
}

async function commitOnboardingStep2() {
  const p = ONB_PROVIDERS.find(x => x.id === onbSelectedProvider);
  if (!p) return;
  const status = document.getElementById('onb-key-status');
  const next   = document.getElementById('onb-step2-next');
  const key    = (document.getElementById('onb-key-input').value || '').trim();
  if (p.id !== 'ollama' && !key) {
    status.textContent = t('onb_key_required') || 'API key is required.';
    status.className = 'sb-onb-key-status is-error';
    return;
  }
  next.disabled = true;
  status.textContent = t('onb_saving') || 'Saving…';
  status.className = 'sb-onb-key-status';

  const newKeys = { ...(settings.apiKeys || {}) };
  if (key) newKeys[p.id] = key;
  settings = { ...settings, apiKeys: newKeys, activeProvider: p.id };
  try {
    await chrome.storage.sync.set({ apiKeys: newKeys, activeProvider: p.id });
    provider = ProviderFactory.get(p.id, newKeys);
    status.textContent = '';
    setOnbStep(3);
  } catch (e) {
    status.textContent = (e?.message) || (t('onb_save_failed') || 'Could not save.');
    status.className = 'sb-onb-key-status is-error';
    next.disabled = false;
  }
}

function hydrateOnbStep3() {
  const root = document.getElementById('onb-tries');
  if (!root) return;
  root.innerHTML = ONB_TRY_PROMPTS.map((p, i) => `
    <button class="sb-onb-try" data-try="${i}">
      <svg class="sb-onb-try-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p.iconPath}</svg>
      <span>${p.label}</span>
    </button>`).join('');
  root.querySelectorAll('.sb-onb-try').forEach(b => {
    b.onclick = () => {
      const sample = ONB_TRY_PROMPTS[+b.dataset.try].label;
      hideOnboarding();
      const input = document.getElementById('ask-input');
      input.value = sample;
      input.focus();
      // Don't auto-send — let user review and hit Enter
    };
  });
}

function startOnboarding() {
  // Pre-select user's existing provider if any
  onbSelectedProvider = settings?.activeProvider || null;
  onbStep = onbSelectedProvider ? 2 : 1;
  document.getElementById('onb-step1-next').disabled = !onbSelectedProvider;
  renderOnboardingProviders();
  setOnbStep(onbStep);
}

function bindOnboarding() {
  const back = (n) => () => setOnbStep(n);
  document.getElementById('onb-step1-next').onclick = () => {
    if (!onbSelectedProvider) return;
    setOnbStep(2);
  };
  document.getElementById('onb-step2-back').onclick = back(1);
  document.getElementById('onb-step2-next').onclick = commitOnboardingStep2;
  document.getElementById('onb-step3-done').onclick = () => hideOnboarding();
  document.getElementById('onb-advanced').onclick = () => chrome.runtime.openOptionsPage();
}
function showOnboarding() {
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('tabs').style.display = 'none';
  startOnboarding();
}
function hideOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('tabs').style.display = 'flex';
}

// ── Theme ──────────────────────────────────────────────────────────────
const THEME_ICONS = {
  auto:  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7"/>',
  dark:  '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
};
const THEME_TITLES = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    html.setAttribute('data-theme', theme);
  } else {
    html.removeAttribute('data-theme');
  }
  // Update icon
  const btn = document.getElementById('theme-btn');
  if (btn) {
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('data-icon', theme);
      svg.innerHTML = THEME_ICONS[theme] || THEME_ICONS.auto;
    }
    btn.title = THEME_TITLES[theme] || THEME_TITLES.auto;
    btn.setAttribute('aria-label', btn.title);
  }
}

async function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const cur = settings.theme || 'auto';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  settings.theme = next;
  applyTheme(next);
  await chrome.storage.sync.set({ theme: next });
}

// ── Compare mode ───────────────────────────────────────────────────────
function hasProviderKey(id) {
  if (id === 'ollama') return true;
  return Boolean(settings.apiKeys && settings.apiKeys[id]);
}

function toggleCompareMode() {
  const next = !compareMode;
  if (next) {
    if (!hasProviderKey(settings.activeProvider)) {
      showToast(t('compare_no_key') || 'No API key configured.');
      return;
    }
    const others = PROVIDERS.filter(p => p.id !== settings.activeProvider && hasProviderKey(p.id));
    if (!compareProviderId || !hasProviderKey(compareProviderId)) {
      compareProviderId = others[0]?.id || settings.activeProvider;
    }
  }
  compareMode = next;
  const btn = document.getElementById('compare-btn');
  btn.setAttribute('aria-pressed', String(compareMode));
  btn.classList.toggle('is-active', compareMode);
  if (compareMode) {
    showToast(`${t('compare_on') || 'Compare mode on'} · ${activeProviderInfo().name} ↔ ${providerInfoById(compareProviderId).name}`);
  } else {
    showToast(t('compare_off') || 'Compare mode off');
  }
  renderHeader();
}

function providerInfoById(id) {
  return PROVIDERS.find(p => p.id === id) || PROVIDERS[0];
}

async function useThisAnswer(turnIdx) {
  const chosen = turns[turnIdx];
  if (!chosen || !chosen.compareSide) return;
  const otherSide = chosen.compareSide === 'A' ? 'B' : 'A';
  // Find the paired turn (closest sibling with the other compareSide, same neighbourhood).
  let pairedIdx = -1;
  for (let d = 1; d <= 2; d++) {
    if (turns[turnIdx - d]?.compareSide === otherSide) { pairedIdx = turnIdx - d; break; }
    if (turns[turnIdx + d]?.compareSide === otherSide) { pairedIdx = turnIdx + d; break; }
  }
  // Promote the chosen model to active.
  const chosenId = chosen.model?.id;
  if (chosenId && chosenId !== settings.activeProvider) {
    settings.activeProvider = chosenId;
    try { provider = ProviderFactory.get(chosenId, settings.apiKeys); } catch (e) {}
    await chrome.storage.sync.set({ activeProvider: chosenId });
  }
  // Strip compare metadata from the kept turn so it renders as a normal answer.
  delete chosen.compareSide;
  chosen.action = chosen.action ? chosen.action.split(' · ')[0] : chosen.action;
  // Remove the other side.
  if (pairedIdx !== -1) turns.splice(pairedIdx, 1);
  // Exit compare mode.
  compareMode = false;
  const btn = document.getElementById('compare-btn');
  btn.setAttribute('aria-pressed', 'false');
  btn.classList.remove('is-active');
  renderHeader();
  renderTurns();
  persistCurrentThread();
  showToast(`${t('compare_kept') || 'Continuing with'} ${(chosen.model || activeProviderInfo()).name}`);
}

let _toastTimer;
function showToast(text) {
  let el = document.getElementById('sb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sb-toast';
    el.className = 'sb-toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('is-visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
}

// ── New Chat ───────────────────────────────────────────────────────────
function newChat() {
  if (busy) return;
  turns = [];
  selectedText = '';
  currentThreadId = null;
  updateSelectionUI();
  document.getElementById('hero').style.display = '';
  document.getElementById('turns').innerHTML = '';
  document.getElementById('error-state').style.display = 'none';
  const input = document.getElementById('ask-input');
  input.value = '';
  input.style.height = 'auto';
  delete pickHeroTitle._pick;
  renderHero();
}

// ── Chat history ───────────────────────────────────────────────────────
async function persistCurrentThread() {
  if (!window.History) return;
  if (!turns.some(t => t.role === 'assistant' && !t.loading && t.content)) return;
  try {
    currentThreadId = await window.History.saveThread({
      id: currentThreadId,
      turns,
      pageUrl,
      pageTitle,
      providerId: settings.activeProvider,
    });
  } catch (e) { console.error('Failed to persist thread:', e); }
}

async function openHistory() {
  const overlay = document.getElementById('history-overlay');
  overlay.hidden = false;
  // Default to filtering by current page if we have a URL
  historyFilterByPage = !!pageUrl;
  historySearch = '';
  document.getElementById('history-search').value = '';
  await renderHistoryList();
}
function closeHistory() {
  document.getElementById('history-overlay').hidden = true;
}

async function clearAllHistory() {
  if (!confirm(t('history_clear_confirm') || 'Delete all chat history? This cannot be undone.')) return;
  await window.History.deleteAll();
  await renderHistoryList();
}

async function renderHistoryList() {
  if (!window.History) return;
  const list = document.getElementById('history-list');
  const filterPill = document.getElementById('history-filter');
  const filterText = document.getElementById('history-filter-text');
  const all = await window.History.listThreads();
  const filtered = window.History.filterIndex(
    all, historySearch, historyFilterByPage ? pageUrl : ''
  );

  // Filter pill
  if (historyFilterByPage && pageUrl) {
    filterPill.hidden = false;
    const domain = window.History.deriveDomain(pageUrl) || pageUrl;
    filterText.textContent = (t('history_filter_on') || 'On this page') + ' · ' + domain;
  } else {
    filterPill.hidden = true;
  }

  // New chat CTA + items
  const newCta = `
    <button class="sb-history-new" id="history-new-cta">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      <span>${t('history_new_chat') || 'Start new chat'}</span>
    </button>`;

  if (filtered.length === 0) {
    list.innerHTML = newCta + `
      <div class="sb-history-empty">
        <svg class="sb-history-empty-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <div>${historySearch
            ? (t('history_no_results') || 'No matching threads')
            : (t('history_empty') || 'No saved chats yet — start one below.')}
        </div>
      </div>`;
  } else {
    list.innerHTML = newCta + filtered.map(meta => {
      const domain = window.History.deriveDomain(meta.pageUrl);
      const ago = window.History.relativeTime(meta.updatedAt);
      const isActive = meta.id === currentThreadId;
      return `
        <button class="sb-history-item${isActive ? ' is-active' : ''}" data-id="${meta.id}">
          <span class="sb-history-item-title">${escapeHtml(meta.title || 'New chat')}</span>
          <span class="sb-history-item-time">${ago}</span>
          <button class="sb-history-item-delete" data-del="${meta.id}" title="Delete" aria-label="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <span class="sb-history-item-meta">
            ${domain ? `<span class="sb-history-item-domain">${escapeHtml(domain)}</span>` : ''}
            ${domain ? '<span>·</span>' : ''}
            <span class="sb-history-item-count">${meta.turnCount || 0} ${t('history_turns') || 'msgs'}</span>
          </span>
        </button>`;
    }).join('');
  }

  // Bind handlers
  const newBtn = document.getElementById('history-new-cta');
  if (newBtn) newBtn.onclick = () => { closeHistory(); newChat(); };
  list.querySelectorAll('.sb-history-item').forEach(b => {
    b.onclick = (e) => {
      if (e.target.closest('[data-del]')) return;
      restoreThread(b.dataset.id);
    };
  });
  list.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async (e) => {
      e.stopPropagation();
      await window.History.deleteThread(b.dataset.del);
      // If we deleted the currently-loaded thread, clear it
      if (b.dataset.del === currentThreadId) {
        currentThreadId = null;
        turns = [];
        document.getElementById('turns').innerHTML = '';
        document.getElementById('hero').style.display = '';
      }
      renderHistoryList();
    };
  });
}

async function restoreThread(id) {
  if (busy) return;
  const thread = await window.History.loadThread(id);
  if (!thread) return;
  // Replay: rehydrate turns with HTML
  turns = (thread.turns || []).map(t => {
    if (t.role === 'assistant' && t.content) {
      return { ...t, html: renderMarkdown(t.content), loading: false, streaming: false };
    }
    return { ...t };
  });
  currentThreadId = thread.id;
  document.getElementById('hero').style.display = 'none';
  renderTurns();
  closeHistory();
}

// ── Header / Picker ────────────────────────────────────────────────────
function activeProviderInfo() {
  return PROVIDERS.find(p => p.id === settings.activeProvider) || PROVIDERS[0];
}

function renderHeader() {
  const p = activeProviderInfo();
  document.getElementById('model-name').textContent = p.name;
  document.getElementById('model-dot').style.background = p.hue;
  document.getElementById('composer-model-name').textContent = p.name;
  document.getElementById('composer-dot').style.background = p.hue;
  renderCompareBar();
}

function renderCompareBar() {
  const bar = document.getElementById('compare-bar');
  if (!bar) return;
  if (!compareMode || !compareProviderId) { bar.hidden = true; return; }
  const a = activeProviderInfo();
  const b = providerInfoById(compareProviderId);
  const sameProv = a.id === b.id;
  document.getElementById('compare-name-a').textContent = sameProv ? `${a.name} (A)` : a.name;
  document.getElementById('compare-dot-a').style.background = a.hue;
  document.getElementById('compare-name-b').textContent = sameProv ? `${b.name} (B)` : b.name;
  document.getElementById('compare-dot-b').style.background = b.hue;
  bar.hidden = false;
}

let pickerSlot = 'a'; // 'a' = activeProvider, 'b' = compareProviderId

function togglePicker(slot = 'a') {
  const triggers = {
    a: [document.getElementById('model-btn'), document.getElementById('compare-slot-a')],
    b: [document.getElementById('compare-slot-b')],
  };
  const setAria = (open, activeSlot) => {
    for (const s of ['a', 'b']) {
      for (const el of triggers[s]) {
        if (el) el.setAttribute('aria-expanded', String(open && activeSlot === s));
      }
    }
  };

  // Reopen with a different slot if already open
  if (pickerOpen && slot !== pickerSlot) {
    pickerSlot = slot;
    renderPicker();
    setAria(true, slot);
    return;
  }
  pickerOpen = !pickerOpen;
  pickerSlot = slot;
  setAria(pickerOpen, slot);
  const host = document.getElementById('picker-host');
  if (!pickerOpen) { host.innerHTML = ''; return; }
  renderPicker();
}

function renderPicker() {
  const host = document.getElementById('picker-host');
  const isB = pickerSlot === 'b';
  const currentId = isB ? compareProviderId : settings.activeProvider;
  const label = isB
    ? (t('picker_compare_against') || 'Compare against')
    : t('picker_switch_model');

  // For slot B, show only providers with a key; allow same as A (self-compare)
  const list = isB
    ? PROVIDERS.filter(p => hasProviderKey(p.id))
    : PROVIDERS;

  host.innerHTML = `
    <div class="sb-picker-veil" id="picker-veil"></div>
    <div class="sb-picker${isB ? ' sb-picker--b' : ''}" role="listbox">
      <div class="sb-picker-label">${label}</div>
      ${list.map(p => {
        const isActive = p.id === currentId;
        const isSelf   = isB && p.id === settings.activeProvider;
        return `
        <button class="sb-picker-row${isActive?' is-active':''}" data-id="${p.id}">
          ${window.providerChip ? window.providerChip(p.id, 22, p.hue) : `<span class="dot" style="background:${p.hue}"></span>`}
          <span class="sb-picker-name">${p.name}${isSelf ? ' <span class="sb-picker-model">(self)</span>' : ''}</span>
          <span class="sb-picker-model">${p.model}</span>
          ${isActive?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>':''}
        </button>
      `;}).join('')}
    </div>
  `;
  document.getElementById('picker-veil').onclick = () => togglePicker(pickerSlot);
  host.querySelectorAll('.sb-picker-row').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.id;
      if (isB) {
        compareProviderId = id;
        renderHeader();
        togglePicker('b');
        return;
      }
      if (id === settings.activeProvider) { togglePicker('a'); return; }
      if (!settings.apiKeys[id] && id !== 'ollama') {
        togglePicker('a'); chrome.runtime.openOptionsPage(); return;
      }
      settings.activeProvider = id;
      await chrome.storage.sync.set({ activeProvider: id });
      try { provider = ProviderFactory.get(id, settings.apiKeys); } catch(e){}
      if (compareMode && !hasProviderKey(compareProviderId)) {
        const eligible = PROVIDERS.filter(p => p.id !== id && hasProviderKey(p.id));
        compareProviderId = eligible[0]?.id || id;
      }
      renderHeader();
      togglePicker('a');
    };
  });
}

// ── Language picker ────────────────────────────────────────────────────
function renderLangBtn() {
  const btn  = document.getElementById('lang-btn');
  if (!btn) return;
  const code = getEffectiveLang(settings.language, detectedLang);
  const stored = settings.language || 'auto';
  // Show 2-letter code when a language is active, globe otherwise
  if (code) {
    btn.textContent = '';
    btn.setAttribute('data-lang', code);
    // show flag-like 2-letter code
    const span = document.createElement('span');
    span.className = 'sb-lang-code';
    span.textContent = code.toUpperCase();
    btn.appendChild(span);
  } else {
    btn.textContent = '';
    btn.setAttribute('data-lang', '');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  }
  const isAuto = stored === 'auto';
  btn.title = isAuto
    ? (code ? `Language: Auto (${LANG_NAMES[code] || code})` : 'Language: Auto')
    : `Language: ${LANG_NAMES[stored] || stored}`;
}

function toggleLangPicker() {
  langPickerOpen = !langPickerOpen;
  const host = document.getElementById('lang-picker-host');
  document.getElementById('lang-btn').setAttribute('aria-expanded', String(langPickerOpen));
  if (!langPickerOpen) { host.innerHTML = ''; return; }

  const stored   = settings.language || 'auto';
  const autoHint = detectedLang ? ` (${LANG_NAMES[detectedLang] || detectedLang})` : '';

  host.innerHTML = `
    <div class="sb-picker-veil" id="lang-picker-veil"></div>
    <div class="sb-picker" role="listbox">
      <div class="sb-picker-label">${t('picker_response_lang')}</div>
      ${LANGUAGES.map(l => {
        const isActive  = l.code === stored;
        const sublabel  = l.code === 'auto' ? `<span class="sb-picker-model">${autoHint || t('picker_lang_auto')}</span>` : '';
        const check     = isActive ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>` : '';
        return `<button class="sb-picker-row${isActive ? ' is-active' : ''}" data-lang="${l.code}">
          <span class="sb-picker-name">${l.label}</span>
          ${sublabel}${check}
        </button>`;
      }).join('')}
    </div>`;

  document.getElementById('lang-picker-veil').onclick = () => toggleLangPicker();
  host.querySelectorAll('.sb-picker-row').forEach(b => {
    b.onclick = async () => {
      const code = b.dataset.lang;
      settings.language = code;
      await chrome.storage.sync.set({ language: code });
      renderLangBtn();
      applyUILanguage();
      toggleLangPicker();
    };
  });
}

// ── Hero suggestions ───────────────────────────────────────────────────
function pickHeroTitle() {
  const pool = ['hero_title', 'hero_title_2', 'hero_title_3', 'hero_title_4']
    .map(k => t(k)).filter(Boolean);
  if (!pool.length) return '';
  // Persist current pick for a session-ish window so the title doesn't flicker
  // on every re-render (renderHero is called by language switch + newChat).
  if (!pickHeroTitle._pick || pickHeroTitle._lang !== document.documentElement.lang) {
    pickHeroTitle._pick = pool[Math.floor(Math.random() * pool.length)];
    pickHeroTitle._lang = document.documentElement.lang;
  }
  return pickHeroTitle._pick;
}

function renderHero() {
  const titleEl = document.querySelector('.sb-hero-title');
  if (titleEl) {
    const next = pickHeroTitle();
    if (next && titleEl.textContent !== next) {
      titleEl.style.opacity = '0';
      setTimeout(() => { titleEl.textContent = next; titleEl.style.opacity = ''; }, 120);
    }
  }
  const wrap = document.getElementById('hero-suggest');
  const items = [
    { id: 'summarize',      tk: 'hero_summarize', icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
    { id: 'extract',        tk: 'hero_extract',   icon: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>' },
    { id: 'translate-page', tk: 'hero_translate', icon: '<path d="M4 5h7M7.5 4v2M5 9c.7 2.5 2 4.5 4 6M11 9c-1.5 4-4 6.5-7 8M14 21l4-9 4 9M15.5 18h5"/>' },
  ];
  wrap.innerHTML = items.map(i => `
    <button class="sb-suggest-btn" data-action="${i.id}">
      <span style="display:inline-flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${i.icon}</svg>
        <span>${t(i.tk)}</span>
      </span>
      <svg class="sb-suggest-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
    </button>
  `).join('');
  wrap.querySelectorAll('button').forEach(b => {
    b.onclick = () => handleAction(b.dataset.action);
  });
}

// ── Tools tab ──────────────────────────────────────────────────────────
function renderTools() {
  const cardHtml = (a) => `
    <button class="sb-action-card" data-action="${a.id}">
      <span class="sb-action-card-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${a.iconPath}</svg>
      </span>
      <span class="sb-action-card-body">
        <span class="sb-action-card-title">${t(a.lk)}</span>
        <span class="sb-action-card-sub">${t(a.sk)}</span>
      </span>
    </button>`;
  document.getElementById('page-actions').innerHTML = TOOL_DEFS.page.map(cardHtml).join('');

  const selRoot = document.getElementById('selection-actions');
  if (selectedText && selectedText.trim()) {
    selRoot.innerHTML = TOOL_DEFS.sel.map(cardHtml).join('');
    selRoot.classList.remove('sb-empty-hint-grid');
  } else {
    selRoot.innerHTML = `
      <div class="sb-empty-hint">
        <svg class="sb-empty-hint-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <path d="M8 12h8M12 8v8" opacity="0.5"/>
        </svg>
        <div class="sb-empty-hint-text">${t('tools_no_selection') || 'Highlight text on a page to use these actions.'}</div>
      </div>`;
    selRoot.classList.add('sb-empty-hint-grid');
  }
  document.querySelectorAll('.sb-action-card').forEach(c => {
    c.onclick = () => { switchTab('chat'); handleAction(c.dataset.action); };
  });
}

// ── Command bar ────────────────────────────────────────────────────────
function renderCmdbar() {
  const bar = document.getElementById('cmdbar');
  if (!bar) return; // command bar removed from layout — Tools tab is the single source
  bar.innerHTML = CMD_BAR.map(c => `
    <button class="sb-chip${c.accent?' sb-chip--accent':''}" data-action="${c.id}">${t(c.lk)}</button>
  `).join('');
  bar.querySelectorAll('.sb-chip').forEach(b =>
    b.onclick = () => handleAction(b.dataset.action));
}

// ── Page / selection messaging ─────────────────────────────────────────
function requestPageContent() {
  window.parent.postMessage({ type: 'REQUEST_PAGE_CONTENT' }, '*');
}

window.addEventListener('message', (e) => {
  const msg = e.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'PAGE_CONTENT')  { pageContent = msg.content || ''; renderContextPill(); }
  if (msg.type === 'PAGE_META')     {
    pageUrl   = msg.url   || pageUrl;
    pageTitle = msg.title || pageTitle;
    renderPageMemory();
  }
  if (msg.type === 'PAGE_LANG')     { detectedLang = msg.lang || ''; renderLangBtn(); applyUILanguage(); }
  if (msg.type === 'SELECTED_TEXT') { selectedText = msg.text || ''; updateSelectionUI(); }
  if (msg.type === 'SIDEBAR_OPENED') {
    if (msg.dir === 'rtl' || msg.dir === 'ltr') document.documentElement.dir = msg.dir;
    requestPageContent();
    window.parent.postMessage({ type: 'REQUEST_SELECTED_TEXT' }, '*');
  }
  if (msg.type === 'SELECTION_TRIGGER') {
    if (msg.text) { selectedText = msg.text; updateSelectionUI(); }
    switchTab('chat');
    document.getElementById('tab-chat').scrollTop = 0;
  }
  if (msg.type === 'CONTEXT_MENU_ACTION') {
    if (msg.text) { selectedText = msg.text; updateSelectionUI(); }
    handleAction(msg.action);
  }
});

chrome.storage.onChanged.addListener((changes) => {
  // Skip our own activeProvider write — we updated `provider` and `settings` already.
  const keys = Object.keys(changes);
  if (keys.length === 1 && keys[0] === 'activeProvider'
      && changes.activeProvider.newValue === settings.activeProvider) return;
  loadSettings();
});

// ── Page context pill ──────────────────────────────────────────────────
function renderContextPill() {
  const pill = document.getElementById('context-pill');
  if (!pill) return;
  const off = settings.pageContext === false;
  const txt = document.getElementById('context-pill-text');
  const tog = document.getElementById('context-pill-toggle');
  // Hide entirely if there's no page content to begin with.
  if (!pageContent || !pageContent.trim()) {
    pill.hidden = true;
    return;
  }
  pill.hidden = false;
  const tokens = Math.round(pageContent.length / 4);
  const human = tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : `${tokens}`;
  pill.classList.toggle('is-off', off);
  pill.setAttribute('aria-pressed', String(!off));
  pill.title = off
    ? (t('context_off_title') || 'Page context off — click to include this page')
    : (t('context_on_title')  || 'Page context on — click to exclude this page');
  txt.textContent = off
    ? (t('context_off') || 'Page context off')
    : `${t('context_including') || 'Including page context'} · ~${human} tokens`;
  if (tog) tog.textContent = off ? (t('context_toggle_off') || 'Off') : (t('context_toggle_on') || 'On');
  pill.onclick = async () => {
    settings.pageContext = off; // off was true → flip to enabled
    try { await chrome.storage.sync.set({ pageContext: settings.pageContext }); } catch {}
    renderContextPill();
  };
}

function updateSelectionUI() {
  const wrap = document.getElementById('selection-wrap');
  const prev = document.getElementById('selected-preview');
  if (selectedText) {
    // Show with slide-in animation
    const wasHidden = wrap.style.display === 'none' || wrap.classList.contains('is-hidden');
    wrap.style.display = '';
    prev.textContent = selectedText.length > 240 ? selectedText.slice(0, 240) + '…' : selectedText;
    if (wasHidden) {
      // Force reflow then add visible class for transition
      wrap.classList.add('is-hidden');
      void wrap.offsetWidth;
      requestAnimationFrame(() => wrap.classList.remove('is-hidden'));
    }
  } else {
    wrap.classList.add('is-hidden');
    // Hide after transition completes
    setTimeout(() => {
      if (wrap.classList.contains('is-hidden')) wrap.style.display = 'none';
    }, 220);
  }
  // Re-render Tools so the Selection actions section reflects current state
  if (document.getElementById('selection-actions')) renderTools();
}

const MAX_HISTORY_TURNS = 20;

function buildConversationMessages() {
  const msgs = turns
    .filter(t => !t.loading &&
      (t.role === 'user' || (t.role === 'assistant' && t.content)))
    .map(t => ({ role: t.role, content: t.content }));
  return msgs.length > MAX_HISTORY_TURNS ? msgs.slice(-MAX_HISTORY_TURNS) : msgs;
}

// ── Action dispatch ────────────────────────────────────────────────────
async function handleAction(action) {
  if (!provider) { showOnboarding(); return; }
  if (busy) return;

  let content, display, label;

  switch (action) {
    case 'summarize':
    case 'extract':
    case 'translate-page':
    case 'rewrite-page': {
      if (!pageContent) return showError(t('error_no_page'));
      const cfg = PAGE_ACTIONS[action];
      content = cfg.content;
      display = cfg.display;
      label   = cfg.label;
      break;
    }
    case 'find':
    case 'find-prompt': {
      const inp = document.getElementById('ask-input');
      inp.placeholder = t('find_placeholder');
      inp.focus();
      return;
    }
    case 'explain':
      if (!selectedText) return showError(t('error_select_text'));
      content = `Explain this clearly and concisely:\n\n"${selectedText}"`;
      display = `Explain: "${ellipsis(selectedText, 80)}"`;
      label = 'explain'; break;
    case 'reply':
      if (!selectedText) return showError(t('error_select_msg'));
      content = `Suggest 3 short, distinct reply options to this message. Number them 1, 2, 3:\n\n"${selectedText}"`;
      display = `Reply to: "${ellipsis(selectedText, 80)}"`;
      label = 'reply'; break;
    case 'translate':
      if (!selectedText) return showError(t('error_select_text'));
      content = `Translate this text to English. Preserve formatting:\n\n"${selectedText}"`;
      display = `Translate: "${ellipsis(selectedText, 80)}"`;
      label = 'translate'; break;
    case 'rewrite':
      if (!selectedText) return showError(t('error_select_text'));
      content = `Rewrite this to be clearer and more concise:\n\n"${selectedText}"`;
      display = `Rewrite: "${ellipsis(selectedText, 80)}"`;
      label = 'rewrite'; break;
    default:
      return;
  }

  pushTurn({ role: 'user', content, display, label });
  await runPrompt(label);
}

async function handleAsk() {
  if (!provider) { showOnboarding(); return; }
  if (busy) return;
  const input = document.getElementById('ask-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = ''; input.style.height = 'auto';
  pushTurn({ role: 'user', content: q, label: 'ask' });
  await runPrompt('ask');
}

// ── Compare-mode prompt runner ─────────────────────────────────────────
async function runComparePrompt(label) {
  busy = true;
  document.getElementById('ask-btn').disabled = true;

  const messages = buildConversationMessages();
  const langName = getLanguageName();
  const ctx = (settings.pageContext === false) ? '' : truncate(pageContent);

  const aInfo = activeProviderInfo();
  const bInfo = providerInfoById(compareProviderId);
  // Build two providers
  let bProvider = null;
  try { bProvider = ProviderFactory.get(compareProviderId, settings.apiKeys); }
  catch (e) { /* fall through; we'll mark error on B */ }

  const sameProvider = aInfo.id === bInfo.id;
  const aLabel = sameProvider ? `${aInfo.name} (A)` : aInfo.name;
  const bLabel = sameProvider ? `${bInfo.name} (B)` : bInfo.name;
  const skelA = pushTurn({ role: 'assistant', loading: true, action: `${actionLabel(label)} · ${aLabel}`, compareSide: 'A' });
  const skelB = pushTurn({ role: 'assistant', loading: true, action: `${actionLabel(label)} · ${bLabel}`, compareSide: 'B' });

  async function streamOne(skel, prov, info) {
    let accum = '';
    const startedAt = performance.now();
    try {
      const systemPrompt = prov.buildSystemPrompt(ctx, langName);
      await prov.completeStream(messages, systemPrompt, (chunk) => {
        accum += chunk;
        skel.loading = false;
        skel.streaming = true;
        skel.content = accum;
        skel.tokens = Math.max(1, Math.round(accum.length / 4));
        skel.elapsedMs = Math.round(performance.now() - startedAt);
        scheduleRenderTurns();
      });
      skel.loading = false;
      skel.streaming = false;
      skel.content = accum;
      skel.html = renderMarkdown(accum);
      skel.model = info;
      skel.tokens = Math.max(1, Math.round(accum.length / 4));
      skel.elapsedMs = Math.round(performance.now() - startedAt);
    } catch (err) {
      skel.loading = false;
      skel.streaming = false;
      skel.content = `**${info.name}**: ${err.message || 'Failed'}`;
      skel.html = renderMarkdown(skel.content);
      skel.model = info;
    }
  }

  try {
    await Promise.all([
      streamOne(skelA, provider, aInfo),
      bProvider
        ? streamOne(skelB, bProvider, bInfo)
        : Promise.resolve().then(() => {
            skelB.loading = false;
            skelB.content = `**${bInfo.name}**: ${t('compare_no_key') || 'No API key configured.'}`;
            skelB.html = renderMarkdown(skelB.content);
            skelB.model = bInfo;
          }),
    ]);
    renderTurns();
    persistCurrentThread();
  } finally {
    busy = false;
    document.getElementById('ask-btn').disabled = false;
  }
}

// ── Core prompt runner (streaming) ────────────────────────────────────
async function runPrompt(label) {
  if (compareMode && compareProviderId) {
    return runComparePrompt(label);
  }
  busy = true;
  const skel = pushTurn({ role: 'assistant', loading: true, action: actionLabel(label) });
  document.getElementById('ask-btn').disabled = true;

  const messages = buildConversationMessages();
  const langName = getLanguageName();
  // Respect the user's pageContext toggle (default true).
  const ctx = (settings.pageContext === false) ? '' : truncate(pageContent);
  const systemPrompt = provider.buildSystemPrompt(ctx, langName);

  let accum = '';
  const startedAt = performance.now();
  try {
    await provider.completeStream(messages, systemPrompt, (chunk) => {
      accum += chunk;
      skel.loading = false;
      skel.streaming = true;
      skel.content = accum;
      // Rough token estimate (4 chars ≈ 1 token); good enough for live counter.
      skel.tokens = Math.max(1, Math.round(accum.length / 4));
      skel.elapsedMs = Math.round(performance.now() - startedAt);
      scheduleRenderTurns();
    });
    skel.loading = false;
    skel.streaming = false;
    skel.content = accum;
    skel.html = renderMarkdown(accum);
    skel.model = activeProviderInfo();
    skel.tokens = Math.max(1, Math.round(accum.length / 4));
    skel.elapsedMs = Math.round(performance.now() - startedAt);
    renderTurns();
    persistCurrentThread();
  } catch (err) {
    turns.pop();
    renderTurns();
    showError(err.message || 'An unexpected error occurred.');
  } finally {
    busy = false;
    document.getElementById('ask-btn').disabled = false;
  }
}

// RAF-batched: parse markdown for the streaming turn once per frame, not per chunk.
function scheduleRenderTurns() {
  if (_renderPending) return;
  _renderPending = true;
  requestAnimationFrame(() => {
    _renderPending = false;
    const last = turns[turns.length - 1];
    if (last?.streaming && last.content) last.html = renderMarkdown(last.content);
    renderTurns();
  });
}

function pushTurn(t) {
  turns.push(t);
  document.getElementById('hero').style.display = 'none';
  renderTurns();
  return t;
}

function renderTurns() {
  const root = document.getElementById('turns');
  root.innerHTML = turns.map((t, i) => turnHtml(t, i)).join('');
  root.querySelectorAll('[data-copy]').forEach(b => {
    b.onclick = () => {
      const idx = +b.dataset.copy;
      const txt = turns[idx]?.content || '';
      navigator.clipboard.writeText(txt).then(() => {
        b.title = t('copied') || 'Copied!';
      }).catch(() => {});
    };
  });
  root.querySelectorAll('[data-use-this]').forEach(b => {
    b.onclick = () => useThisAnswer(+b.dataset.useThis);
  });
  // Code block copy buttons (markdown ```fences```)
  root.querySelectorAll('.sb-codeblock-copy').forEach(b => {
    b.onclick = () => {
      const code = b.closest('.sb-codeblock')?.querySelector('pre code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        const label = b.querySelector('span');
        const prev = label ? label.textContent : '';
        if (label) label.textContent = '✓ Copied';
        b.classList.add('is-copied');
        setTimeout(() => {
          if (label) label.textContent = prev;
          b.classList.remove('is-copied');
        }, 1400);
      }).catch(() => {});
    };
  });
  const scroller = document.getElementById('tab-chat');
  scroller.scrollTop = scroller.scrollHeight;
}

function turnHtml(t, i) {
  if (t.role === 'user') {
    return `
      <div class="sb-turn sb-turn--user">
        <div class="sb-turn-body">
          <div class="sb-turn-content sb-turn-content--user">${escapeHtml(t.display || t.content)}</div>
        </div>
      </div>`;
  }
  const cursor = t.streaming ? '<span class="sb-cursor"></span>' : '';
  const meter = (t.streaming && t.tokens) ? `
    <span class="sb-stream-meter" title="Estimated tokens · elapsed time">
      <span class="sb-stream-tokens">~${t.tokens.toLocaleString()} tokens</span>
      <span class="sb-stream-dot">·</span>
      <span class="sb-stream-time">${(t.elapsedMs / 1000).toFixed(1)}s</span>
    </span>` : '';
  const body = t.loading
    ? `<div class="sb-skeleton"><div class="sb-skel-line" style="width:94%"></div><div class="sb-skel-line" style="width:78%"></div><div class="sb-skel-line" style="width:85%"></div></div>`
    : `${t.html || ''}${cursor}${meter}`;
  const action = t.action ? `<div class="sb-turn-action">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/></svg>
      <span>${t.action}</span>
    </div>` : '';
  const foot = (!t.loading && !t.streaming) ? `
    <div class="sb-turn-foot">
      <span class="sb-turn-model">
        <span class="dot" style="background:${(t.model || activeProviderInfo()).hue}"></span>
        ${(t.model || activeProviderInfo()).name}
        ${t.tokens ? `<span class="sb-stream-meter sb-stream-meter--final">
          <span class="sb-stream-dot">·</span>
          <span>~${t.tokens.toLocaleString()} tokens</span>
          ${t.elapsedMs ? `<span class="sb-stream-dot">·</span><span>${(t.elapsedMs / 1000).toFixed(1)}s</span>` : ''}
        </span>` : ''}
      </span>
      <div class="sb-turn-foot-actions">
        ${t.compareSide ? `<button class="sb-use-this-btn" data-use-this="${i}" title="${window.t('compare_use_this_title') || 'Continue with this model'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>
          <span>${window.t('compare_use_this') || 'Use this'}</span>
        </button>` : ''}
        <button class="sb-mini-btn" data-copy="${i}" title="Copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
        </button>
      </div>
    </div>` : '';
  return `
    <div class="sb-turn">
      <div class="sb-turn-avatar">
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <path d="M16 3c2 5 5.5 8.5 10.5 10.5C21.5 15.5 18 19 16 24 14 19 10.5 15.5 5.5 13.5 10.5 11.5 14 8 16 3z" fill="var(--accent)"/>
        </svg>
      </div>
      <div class="sb-turn-body">
        ${action}
        <div class="sb-turn-content">${body}</div>
        ${foot}
      </div>
    </div>`;
}

// ── Errors ─────────────────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('error-message').textContent = msg;
  document.getElementById('error-state').style.display = 'block';
}

// ── Helpers ────────────────────────────────────────────────────────────
function getLanguageName() {
  return getEffectiveLangName(settings.language, detectedLang);
}
function truncate(t) {
  if (!t) return '';
  return t.length > 12000 ? t.slice(0, 12000) + '\n\n[truncated]' : t;
}
function ellipsis(t, n) { return t.length > n ? t.slice(0, n) + '…' : t; }
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Markdown renderer ──────────────────────────────────────────────────
function renderMarkdown(raw) {
  let text = escapeHtml(raw);
  // Fenced code blocks → wrapped <div class="sb-codeblock"> with lang badge + copy button.
  // Copy handler reads `pre code`.textContent at click time, so no encoding tricks needed.
  text = text.replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = (lang || 'text').toLowerCase();
    const display = code.replace(/\n$/, '');
    return `<div class="sb-codeblock">
      <div class="sb-codeblock-head">
        <span class="sb-codeblock-lang">${langLabel}</span>
        <button class="sb-codeblock-copy" type="button" title="Copy code">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <pre><code>${display}</code></pre>
    </div>`;
  });
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
             .replace(/^### (.+)$/gm,  '<h4>$1</h4>')
             .replace(/^## (.+)$/gm,   '<h3>$1</h3>')
             .replace(/^# (.+)$/gm,    '<h2>$1</h2>');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
             .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = renderTables(text);
  text = text.replace(/^([ \t]*[-*•] .+(\n|$))+/gm, m => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*[-*•] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  text = text.replace(/^([ \t]*\d+\. .+(\n|$))+/gm, m => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  text = '<p>' + text.replace(/\n\n+/g, '</p><p>') + '</p>';
  text = text.replace(/<p><\/p>/g, '');
  text = text.split('\n').map(line => /^<[a-z/]/.test(line.trim()) ? line : line + '<br>').join('\n');
  text = text.replace(/<p>(<(?:h[1-6]|ul|ol|table|pre)[^>]*>)/g, '$1')
             .replace(/(<\/(?:h[1-6]|ul|ol|table|pre)>)<\/p>/g, '$1');
  return text;
}
function renderTables(text) {
  return text.replace(/((\|.+\|\n)+)/g, m => {
    const rows = m.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return m;
    const isSep = (r) => /^\|[-| :]+\|$/.test(r.trim());
    let html = '<table><thead>'; let inHead = true;
    for (const row of rows) {
      if (isSep(row)) { html += '</thead><tbody>'; inHead = false; continue; }
      const cells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      const tag = inHead ? 'th' : 'td';
      html += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    }
    html += inHead ? '' : '</tbody>';
    html += '</table>';
    return html;
  });
}

// Direction is applied via the SIDEBAR_OPENED message from content.js —
// the iframe cannot read window.parent.document directly (cross-origin).

init();
