/**
 * Popup — provider status + open sidebar.
 */
async function init() {
  const stored = await Store.get(['activeProvider', 'apiKeys', 'selectedModels', 'theme']);
  // Apply theme (auto / light / dark) to <html>
  const theme = stored.theme || 'auto';
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  const provider = stored.activeProvider;
  const hasKey = provider && (stored.apiKeys?.[provider] || provider === 'ollama');

  const mark = document.getElementById('status-mark');
  const dot  = document.getElementById('status-dot');
  const name = document.getElementById('provider-name-text');
  const sub  = document.getElementById('provider-model-text');

  const META = {
    claude:  { label: 'Claude',  hue: '#c8643c' },
    gemini:  { label: 'Gemini',  hue: '#4577b3' },
    openai:  { label: 'OpenAI',  hue: '#10a37f' },
    grok:    { label: 'Grok',    hue: '#1f1d18' },
    groq:    { label: 'Groq',    hue: '#f55036' },
    ollama:  { label: 'Ollama',  hue: '#7e57c2' },
  };
  // Live model label from the catalog + the user's pick (never hardcoded here).
  const modelText = modelLabel(provider, resolveModel(provider, stored.selectedModels || {}));

  if (provider && hasKey && META[provider]) {
    if (window.providerChip) mark.outerHTML = window.providerChip(provider, 22, META[provider].hue).replace(/^\s+/, '');
    dot.classList.add('ok');
    dot.title = 'Active';
    name.textContent = META[provider].label;
    sub.textContent  = modelText;
  } else if (provider) {
    if (window.providerChip && META[provider]) mark.outerHTML = window.providerChip(provider, 22, META[provider].hue).replace(/^\s+/, '');
    dot.classList.add('warn');
    dot.title = 'No key';
    name.textContent = `${META[provider]?.label || provider}`;
    sub.textContent  = 'No API key';
  }

  document.getElementById('toggle-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEBAR' });
    window.close();
  });
  document.getElementById('settings-link').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}
init();
