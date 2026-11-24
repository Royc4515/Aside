/**
 * Background service worker.
 * Routes commands and messages between popup, content script, and sidebar iframe.
 */

importScripts('shared/store.js', 'shared/version.js');

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
  // Popup or sidebar: the user dismissed the "Updated to vX" note or opened
  // its release notes. Clearing here keeps the key and the badge in one place.
  if (msg?.type === 'UPDATE_NOTICE_SEEN') {
    clearUpdateNotice().then(() => sendResponse({ ok: true }));
    return true;
  }
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
chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  setupContextMenus();
  ensureSessionAccess();
  // Pull any data older versions left in chrome.storage.sync into local.
  await Store.migrate();

  if (reason === 'install') {
    const { activeProvider } = await Store.get(['activeProvider']);
    if (!activeProvider) chrome.runtime.openOptionsPage();
  }
  if (reason === 'update') await noteUpdate(previousVersion);
  await rememberVersion();
});

// Read by popup/popup.js and sidebar/sidebar.js; cleared by UPDATE_NOTICE_SEEN.
const UPDATE_NOTICE_KEY = 'aside.updateNotice';
// The version this profile last ran. See checkVersionChange().
const LAST_VERSION_KEY = 'aside.lastVersion';

/**
 * Remember that Aside just updated, so the popup can say so and link to the
 * release notes. The toolbar badge points the user at the popup.
 */
async function noteUpdate(previousVersion) {
  const current = chrome.runtime.getManifest().version;
  // don't touch / "Reload" on an unpacked build fires 'update' with the same
  // version; without this every dev reload would announce a fake update.
  // Only a move to a newer version counts, so a downgrade stays quiet.
  if (!AsideVersion.isPlain(previousVersion) || !AsideVersion.isPlain(current)) return;
  if (AsideVersion.compare(current, previousVersion) <= 0) return;
  await Store.set({ [UPDATE_NOTICE_KEY]: { from: previousVersion, to: current } });
  showUpdateBadge();
}

async function rememberVersion() {
  await Store.set({ [LAST_VERSION_KEY]: chrome.runtime.getManifest().version });
}

/**
 * Catch updates that onInstalled misses.
 * don't touch / an unpacked copy whose files were replaced and then picked up
 * by a browser restart (not the Reload button) runs the new version with no
 * onInstalled event at all (verified in Chromium). Comparing against the last
 * version this profile ran covers that, and is harmless when onInstalled did
 * fire: both write the same notice.
 */
async function checkVersionChange() {
  try {
    const { [LAST_VERSION_KEY]: last } = await Store.get([LAST_VERSION_KEY]);
    // First run with this code: nothing to compare yet, just record it.
    if (last) await noteUpdate(last);
    await rememberVersion();
  } catch {}
}
checkVersionChange();

async function clearUpdateNotice() {
  await Store.remove(UPDATE_NOTICE_KEY);
  chrome.action.setBadgeText({ text: '' }).catch(() => {});
}

function showUpdateBadge() {
  chrome.action.setBadgeBackgroundColor({ color: '#c8643c' }).catch(() => {});
  chrome.action.setBadgeText({ text: 'NEW' }).catch(() => {});
}

// The badge does not survive a browser restart; put it back while the
// notice is still unread.
chrome.runtime.onStartup?.addListener(async () => {
  const { [UPDATE_NOTICE_KEY]: notice } = await Store.get([UPDATE_NOTICE_KEY]);
  if (notice) showUpdateBadge();
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
