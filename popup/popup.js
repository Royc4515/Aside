/**
 * Popup — provider status + open sidebar.
 */
async function init() {
  const stored = await chrome.storage.local.get(['activeProvider', 'apiKeys', 'theme']);
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
    claude:  { label: 'Claude',  model: 'sonnet-4-5',  hue: '#c8643c' },
    gemini:  { label: 'Gemini',  model: '2.0-flash',   hue: '#4577b3' },
    openai:  { label: 'GPT-4o',  model: 'mini',        hue: '#10a37f' },
    grok:    { label: 'Grok',    model: '3-mini',      hue: '#1f1d18' },
    groq:    { label: 'Groq',    model: 'llama-3.3',   hue: '#f55036' },
    ollama:  { label: 'Ollama',  model: 'local',       hue: '#7e57c2' },
  };

  if (provider && hasKey && META[provider]) {
    if (window.providerChip) mark.outerHTML = window.providerChip(provider, 22, META[provider].hue).replace(/^\s+/, '');
    dot.classList.add('ok');
    dot.title = 'Active';
    name.textContent = META[provider].label;
    sub.textContent  = META[provider].model;
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
