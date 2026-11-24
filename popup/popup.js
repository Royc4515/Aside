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
  // If the catalog didn't load, show the raw pick rather than break the popup.
  const modelText = (typeof modelLabel === 'function' && typeof resolveModel === 'function')
    ? modelLabel(provider, resolveModel(provider, stored.selectedModels || {}))
    : (stored.selectedModels?.[provider] || '');

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
  initUpdates();
}

// Written by background.js after an update; same key as UPDATE_NOTICE_KEY there.
const UPDATE_NOTICE_KEY = 'aside.updateNotice';
const RELEASES_URL = 'https://github.com/Royc4515/Aside/releases';

/**
 * Two update affordances:
 *  - after Chrome installed a new version, a one-time "Updated to vX" note
 *    linking to that release's notes (also clears the toolbar badge);
 *  - a "Check for updates" button that asks the Web Store now instead of
 *    waiting for Chrome's periodic check, and applies a found update on a
 *    second click.
 */
async function initUpdates() {
  const note = document.getElementById('update-note');
  const { [UPDATE_NOTICE_KEY]: notice } = await Store.get([UPDATE_NOTICE_KEY]);
  if (notice?.to) {
    document.getElementById('update-note-version').textContent = `v${notice.to}`;
    const link = document.getElementById('update-note-link');
    // Only a plain x.y.z maps to a release tag; anything else goes to the list.
    link.href = /^\d+(\.\d+){1,3}$/.test(notice.to)
      ? `${RELEASES_URL}/tag/v${notice.to}` : RELEASES_URL;
    note.hidden = false;
    // Opening the notes counts as read. Clear it before the popup closes on
    // the new tab, or the write can be cut off and the note comes back.
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await dismissUpdateNote();
      chrome.tabs.create({ url: link.href });
      window.close();
    });
    document.getElementById('update-note-close').addEventListener('click', dismissUpdateNote);
  }

  const btn    = document.getElementById('update-btn');
  const label  = document.getElementById('update-btn-label');
  const status = document.getElementById('update-status');
  let readyVersion = null;

  btn.addEventListener('click', async () => {
    if (readyVersion) {
      // Reload swaps in the downloaded version. Open sidebars lose their
      // connection until reopened, which is why this waits for a click.
      chrome.runtime.reload();
      return;
    }
    // don't touch / Chrome answers "no_update" for unpacked copies instead of
    // failing, which would falsely say "latest". Store installs get update_url.
    if (!chrome.runtime.getManifest().update_url) {
      status.textContent = 'This copy is not from the Chrome Web Store, so it cannot check for updates.';
      return;
    }
    btn.disabled = true;
    status.textContent = 'Checking...';
    try {
      const res = await chrome.runtime.requestUpdateCheck();
      // Chrome 109+ resolves { status, version }; keep the array form for safety.
      const st  = res?.status ?? (Array.isArray(res) ? res[0] : undefined);
      const ver = res?.version ?? (Array.isArray(res) ? res[1]?.version : undefined);
      if (st === 'update_available') {
        readyVersion = ver || 'new';
        label.textContent = ver ? `Update to v${ver} now` : 'Update now';
        status.textContent = 'Open sidebars close and reopen on Alt+A.';
      } else if (st === 'throttled') {
        status.textContent = 'Checked recently. Try again in a few minutes.';
      } else {
        status.textContent = `You're on the latest version (v${chrome.runtime.getManifest().version}).`;
      }
    } catch {
      status.textContent = 'Could not reach the Chrome Web Store. Try again later.';
    } finally {
      btn.disabled = false;
    }
  });

  async function dismissUpdateNote() {
    note.hidden = true;
    try { await chrome.runtime.sendMessage({ type: 'UPDATE_NOTICE_SEEN' }); } catch {}
  }
}

init();
