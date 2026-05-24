/**
 * Runtime i18n helper — uses the translations.js table so the UI language
 * can switch without a page reload (chrome.i18n is locked to browser locale).
 * translations.js must be loaded before this file.
 */
(function () {
  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n); if (v) el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = t(el.dataset.i18nPlaceholder); if (v) el.placeholder = v;
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = t(el.dataset.i18nTitle); if (v) el.title = v;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyI18n());
  } else {
    applyI18n();
  }

  window.applyI18n = applyI18n;
})();
