/**
 * Aside — Settings page.
 */

// `model` is a static fallback only; the live label comes from
// providerModelLabel() (model catalog + the user's pick).
const PROVIDERS = [
  { id: 'claude',  name: 'Claude',  model: 'Claude Sonnet 4.5', letter: 'C', tier: 'paid', hue: 'var(--p-claude)', placeholder: 'sk-ant-…' },
  { id: 'openai',  name: 'GPT-4o',  model: 'GPT-4o mini',       letter: 'G', tier: 'paid', hue: 'var(--p-gpt)',    placeholder: 'sk-…' },
  { id: 'gemini',  name: 'Gemini',  model: 'Gemini 2.0 Flash',  letter: 'G', tier: 'free', hue: 'var(--p-gemini)', placeholder: 'AIza…' },
  { id: 'grok',    name: 'Grok',    model: 'Grok 3 mini',       letter: 'X', tier: 'paid', hue: 'var(--p-grok)',   placeholder: 'xai-…' },
  { id: 'groq',    name: 'Groq',    model: 'Llama 3.3 70B',     letter: 'G', tier: 'free', hue: 'var(--p-groq)',   placeholder: 'gsk_…' },
  { id: 'ollama',  name: 'Ollama',  model: 'Llama 3.1',         letter: 'O', tier: 'free', hue: 'var(--p-ollama)', placeholder: '' },
];

const NAV = [
  { id: 'provider',    label: 'Provider',    icon: '<path d="M12 3l2 5 5 .5-4 4 1.5 5L12 15l-4.5 2.5L9 12l-4-4 5-.5z"/>' },
  { id: 'appearance',  label: 'Appearance',  icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M3 9h18"/>' },
  { id: 'language',    label: 'Language',    icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>' },
  { id: 'advanced',    label: 'Advanced',    icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.4V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.4-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.4-1z"/>' },
];

const PAGE_TITLES = {
  provider:   { title: 'Provider',    sub: 'Choose a model and add API keys. Keys stay on your device.' },
  appearance: { title: 'Appearance',  sub: 'Where the sidebar lives, how wide it is, and what theme to use.' },
  language:   { title: 'Language',    sub: 'Tell Aside what language to respond in.' },
  advanced:   { title: 'Advanced',    sub: 'Fine-tune behaviour. Reset everything if things go sideways.' },
};

let state = {
  activeProvider: 'gemini',
  apiKeys: {},
  selectedModels: {},
  language: 'auto',
  position: 'right',
  width: 420,
  theme: 'auto',
  pageContext: true,
};
let baseline = null; // snapshot of state from last save / load
let activePage = 'provider';

function stateSnapshot() {
  return JSON.stringify({ ...state, apiKeys: { ...state.apiKeys }, selectedModels: { ...state.selectedModels } });
}
function snapshotBaseline() {
  baseline = stateSnapshot();
  updateDirtyState();
}
function isDirty() {
  if (!baseline) return false;
  return stateSnapshot() !== baseline;
}
function updateDirtyState() {
  const btn = document.getElementById('save-btn');
  if (!btn) return;
  btn.classList.toggle('is-dirty', isDirty());
  btn.disabled = !isDirty();
}

// ── Init ────────────────────────────────────────────────────────────
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light' || theme === 'dark') html.setAttribute('data-theme', theme);
  else html.removeAttribute('data-theme');
}

async function init() {
  const stored = await chrome.storage.sync.get([
    'activeProvider','apiKeys','selectedModels','language','position','width','theme','pageContext'
  ]);
  state = {
    ...state,
    ...stored,
    apiKeys: stored.apiKeys || {},
    selectedModels: stored.selectedModels || {},
  };
  applyTheme(state.theme);
  renderNav();
  renderProviders();
  renderModel();
  renderKeys();
  renderAppearance();
  renderLanguage();
  renderAdvanced();
  bindGlobal();
  snapshotBaseline();
  showPage(activePage);
}

function bindGlobal() {
  document.getElementById('save-btn').onclick = async () => {
    await chrome.storage.sync.set(state);
    snapshotBaseline();
    flashSaved();
  };
  document.getElementById('reset-btn').onclick = async () => {
    if (!confirm('Reset all settings? Your API keys will also be cleared.')) return;
    await chrome.storage.sync.clear();
    location.reload();
  };
}

function flashSaved() {
  const el = document.getElementById('saved-indicator');
  el.style.display = '';
  el.textContent = '✓ Saved';
  setTimeout(() => { el.style.display = 'none'; }, 1800);
}

// ── Nav ────────────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(n => `
    <button class="set-nav-item${n.id===activePage?' is-active':''}" data-page="${n.id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg>
      <span>${n.label}</span>
    </button>
  `).join('');
  nav.querySelectorAll('.set-nav-item').forEach(b => {
    b.onclick = () => showPage(b.dataset.page);
  });
}

function showPage(id) {
  activePage = id;
  document.querySelectorAll('.set-nav-item').forEach(n =>
    n.classList.toggle('is-active', n.dataset.page === id));
  document.querySelectorAll('.set-page').forEach(p =>
    p.hidden = p.dataset.page !== id);
  const meta = PAGE_TITLES[id];
  if (meta) {
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-sub').textContent = meta.sub;
  }
}

// ── Providers ──────────────────────────────────────────────────────
function renderProviders() {
  const root = document.getElementById('providers');
  root.innerHTML = PROVIDERS.map(p => `
    <button class="set-provider${p.id===state.activeProvider?' is-active':''}" data-id="${p.id}">
      ${window.providerChip ? window.providerChip(p.id, 36, p.hue) : `<span class="set-provider-mark" style="background:${p.hue}">${p.letter}</span>`}
      <span class="set-provider-body">
        <span class="set-provider-name">${p.name}</span>
        <span class="set-provider-model">${providerModelLabel(p.id)}</span>
      </span>
      <span class="set-tier set-tier--${p.tier}">${p.tier === 'paid' ? 'Paid' : 'Free'}</span>
    </button>
  `).join('');
  root.querySelectorAll('.set-provider').forEach(b => {
    b.onclick = async () => {
      state.activeProvider = b.dataset.id;
      await chrome.storage.sync.set({ activeProvider: state.activeProvider });
      snapshotBaseline(); // active provider auto-saves, so re-baseline
      renderProviders();
      renderModel();
    };
  });
}

// Live model label for a provider (catalog default unless the user picked one).
function providerModelLabel(id) {
  if (typeof resolveModel === 'function' && typeof modelLabel === 'function') {
    return modelLabel(id, resolveModel(id, state.selectedModels));
  }
  const p = PROVIDERS.find(x => x.id === id);
  return p ? p.model : '';
}

// ── Model picker (for the active provider) ─────────────────────────
const CUSTOM_VALUE = '__custom__';

function renderModel() {
  const sel = document.getElementById('model-select');
  const custom = document.getElementById('model-custom');
  const label = document.getElementById('model-label');
  if (!sel || !custom) return;

  const id = state.activeProvider;
  const provName = (PROVIDERS.find(p => p.id === id) || {}).name || id;
  if (label) label.textContent = `Model for ${provName}`;

  const catalog = (typeof PROVIDER_MODELS !== 'undefined' && PROVIDER_MODELS[id]) || { default: '', options: [] };
  const current = (state.selectedModels[id] && String(state.selectedModels[id]).trim()) || catalog.default;
  const known = catalog.options.some(o => o.id === current);

  sel.innerHTML = catalog.options.map(o =>
    `<option value="${o.id}"${o.id === current && known ? ' selected' : ''}>${o.label}${o.id === catalog.default ? ' · default' : ''}</option>`
  ).join('') + `<option value="${CUSTOM_VALUE}"${!known ? ' selected' : ''}>Custom…</option>`;

  const showCustom = !known;
  custom.hidden = !showCustom;
  custom.value = showCustom ? current : '';

  sel.onchange = () => {
    if (sel.value === CUSTOM_VALUE) {
      custom.hidden = false;
      custom.focus();
      // Leave selectedModels as-is until the user types something.
    } else {
      custom.hidden = true;
      state.selectedModels = { ...state.selectedModels, [id]: sel.value };
      updateDirtyState();
      renderProviders();
    }
  };
  custom.oninput = () => {
    const v = custom.value.trim();
    state.selectedModels = { ...state.selectedModels, [id]: v };
    updateDirtyState();
    renderProviders();
  };
}

function renderKeys() {
  const root = document.getElementById('keys');
  root.innerHTML = PROVIDERS.filter(p => p.id !== 'ollama').map(p => `
    <div class="set-key-row">
      <div class="set-key-label">
        ${window.providerChip ? window.providerChip(p.id, 22, p.hue) : `<span class="dot" style="background:${p.hue}"></span>`}
        <span>${p.name}</span>
      </div>
      <div class="set-key-input">
        <input
          type="password"
          data-id="${p.id}"
          placeholder="${p.placeholder}"
          value="${state.apiKeys[p.id] || ''}"
          autocomplete="off"
          spellcheck="false"
        />
        <button class="set-key-validate" data-id="${p.id}">${state.apiKeys[p.id] ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  `).join('');
  root.querySelectorAll('input[data-id]').forEach(inp => {
    inp.oninput = () => { state.apiKeys[inp.dataset.id] = inp.value; updateDirtyState(); };
  });
  root.querySelectorAll('.set-key-validate').forEach(btn => {
    btn.onclick = async () => {
      await chrome.storage.sync.set({ apiKeys: state.apiKeys, activeProvider: state.activeProvider });
      snapshotBaseline();
      btn.textContent = '✓ Saved';
      btn.classList.add('is-valid');
      setTimeout(() => { btn.classList.remove('is-valid'); btn.textContent = 'Save'; }, 1500);
    };
  });
}

// ── Appearance ─────────────────────────────────────────────────────
function renderAppearance() {
  document.querySelectorAll('.set-segments').forEach(seg => {
    const setting = seg.dataset.setting;
    seg.querySelectorAll('.set-seg').forEach(b => {
      b.classList.toggle('is-active', b.dataset.value === state[setting]);
      b.onclick = () => {
        state[setting] = b.dataset.value;
        if (setting === 'theme') applyTheme(state.theme);
        updateDirtyState();
        renderAppearance();
      };
    });
  });
  const slider = document.getElementById('width-slider');
  const val = document.getElementById('width-val');
  slider.value = state.width;
  val.textContent = `${state.width}px`;
  slider.oninput = () => {
    state.width = +slider.value;
    val.textContent = `${state.width}px`;
    updateDirtyState();
  };
}

// ── Language ──────────────────────────────────────────────────────
function renderLanguage() {
  const sel = document.getElementById('language-select');
  sel.value = state.language || 'auto';
  sel.onchange = () => { state.language = sel.value; updateDirtyState(); };
}

// ── Advanced ──────────────────────────────────────────────────────
function renderAdvanced() {
  const t = document.getElementById('page-context-toggle');
  t.checked = state.pageContext !== false;
  t.onchange = () => { state.pageContext = t.checked; updateDirtyState(); };
}

init();
