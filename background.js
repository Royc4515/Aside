/**
 * Background service worker.
 * Routes commands and messages between popup, content script, and sidebar iframe.
 */

importScripts('shared/store.js');

/**
 * Grant content scripts (untrusted contexts) read/write access to
 * chrome.storage.session, used to hold the per-channel postMessage nonce
 * that authenticates the content-script ↔ sidebar iframe bridge.
 */
async function ensureSessionAccess() {
  try {
    await chrome.storage.session.setAccessLevel({
      accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
    });
  } catch {}
}
ensureSessionAccess();
chrome.runtime.onStartup?.addListener(ensureSessionAccess);

// Toolbar/keyboard command → ask the active tab to toggle.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-sidebar') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(() => {
      // If content script not injected (e.g. after reload), try injecting it now.
      injectContentScript(tab.id).then(() => {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(() => {});
      });
    });
  }
});

// Popup → toggle in active tab.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'TOGGLE_SIDEBAR') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(() => {
          injectContentScript(tab.id).then(() => {
            chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(() => {});
          });
        });
      }
    });
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
  // Content script asks us to (re)grant session-storage access before it
  // writes the channel nonce. Reply only once access is actually granted.
  if (msg?.type === 'ENSURE_SESSION') {
    ensureSessionAccess().then(() => sendResponse({ ok: true }));
    return true;
  }
});

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'aside-explain',
      title: 'Aside: Explain selection',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'aside-summarize',
      title: 'Aside: Summarize page',
      contexts: ['page']
    });
  });
}

// First-run / Update: open options page and setup context menus.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  setupContextMenus();
  ensureSessionAccess();
  // Pull any data older versions left in chrome.storage.sync into local.
  await Store.migrate();

  if (reason === 'install') {
    const { activeProvider } = await Store.get(['activeProvider']);
    if (!activeProvider) chrome.runtime.openOptionsPage();
  }
});

// Context menu click handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const action = info.menuItemId.replace('aside-', '');
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_ACTION',
      action: action,
      text: info.selectionText
    }).catch(() => {
      injectContentScript(tab.id).then(() => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXT_MENU_ACTION',
          action: action,
          text: info.selectionText
        }).catch(() => {});
      });
    });
  }
});

/**
 * Helper to inject content script if missing (e.g. extension reloaded)
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/content.css']
    });
  } catch (err) {
    console.error('Failed to inject content script:', err);
  }
}
