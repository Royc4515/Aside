/**
 * Aside — settings storage layer.
 *
 * Everything lives in chrome.storage.local. We deliberately do NOT use
 * chrome.storage.sync: API keys and settings must never leave the device
 * (no server, no cloud). Conversation history already lives in local under
 * its own `aside.*` keys (see history.js).
 *
 * A one-time migration pulls anything older versions left in chrome.storage.sync
 * into local, then clears sync — so existing users' keys are moved off Google's
 * servers instead of being stranded there.
 *
 * Exposed on self.Store so it works in the service worker and in page scripts.
 */
(function () {
  // Top-level settings keys (everything that is NOT conversation history).
  const SETTINGS_KEYS = [
    'activeProvider', 'apiKeys', 'selectedModels',
    'language', 'position', 'width', 'theme', 'pageContext',
  ];
  const MIGRATION_FLAG = 'aside._migratedToLocal';

  let migrated = false;
  let migrating = null;

  async function migrateFromSyncOnce() {
    if (migrated) return;
    if (migrating) return migrating;
    migrating = (async () => {
      try {
        const flag = await chrome.storage.local.get(MIGRATION_FLAG);
        if (flag[MIGRATION_FLAG]) { migrated = true; return; }

        let legacy = {};
        try { legacy = await chrome.storage.sync.get(null); } catch {}
        const legacyKeys = legacy ? Object.keys(legacy) : [];
        if (legacyKeys.length) {
          // Never clobber data already written locally.
          const current = await chrome.storage.local.get(legacyKeys);
          const merged = {};
          for (const k of legacyKeys) {
            if (current[k] === undefined) merged[k] = legacy[k];
          }
          if (Object.keys(merged).length) await chrome.storage.local.set(merged);
        }
        try { await chrome.storage.sync.clear(); } catch {}
        await chrome.storage.local.set({ [MIGRATION_FLAG]: true });
        migrated = true;
      } catch {
        // If migration fails we still operate on local; retry on next access.
        migrating = null;
      }
    })();
    return migrating;
  }

  async function get(keys) {
    await migrateFromSyncOnce();
    return chrome.storage.local.get(keys);
  }

  async function set(items) {
    await migrateFromSyncOnce();
    return chrome.storage.local.set(items);
  }

  async function remove(keys) {
    await migrateFromSyncOnce();
    return chrome.storage.local.remove(keys);
  }

  /** Reset settings (incl. API keys) without touching conversation history. */
  async function clearSettings() {
    await migrateFromSyncOnce();
    return chrome.storage.local.remove(SETTINGS_KEYS);
  }

  self.Store = { get, set, remove, clearSettings, migrate: migrateFromSyncOnce, SETTINGS_KEYS };
})();
