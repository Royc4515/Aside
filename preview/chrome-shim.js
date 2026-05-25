/**
 * chrome-shim.js — runs ONLY when the file is opened outside an extension.
 * Detects absence of the real chrome.runtime.id and provides mock implementations
 * backed by localStorage so the UI is interactive for design preview.
 */
(function () {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) return; // real extension

  const STORE_KEY = '__aside_storage__';
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }
  function writeStore(o) { localStorage.setItem(STORE_KEY, JSON.stringify(o)); }

  function get(keys) {
    const all = readStore();
    if (!keys) return Promise.resolve({ ...all });
    if (typeof keys === 'string') return Promise.resolve({ [keys]: all[keys] });
    if (Array.isArray(keys)) {
      const r = {}; keys.forEach(k => { r[k] = all[k]; }); return Promise.resolve(r);
    }
    if (typeof keys === 'object') {
      const r = {}; Object.keys(keys).forEach(k => { r[k] = (k in all) ? all[k] : keys[k]; }); return Promise.resolve(r);
    }
    return Promise.resolve({});
  }
  function set(items) {
    const all = readStore();
    Object.assign(all, items);
    writeStore(all);
    return Promise.resolve();
  }
  function clear() { writeStore({}); return Promise.resolve(); }

  const I18N = {
    en: {
      'tab_chat':'Chat','tab_tools':'Tools',
      'hero_title':'How can I help with this page?',
      'hero_sub':'Summarize, extract, translate, or ask anything. Page context is included automatically.',
      'selected_label':'Selected text','from_page':'From page',
      'tools_page':'Page actions','tools_selection':'Selection actions',
      'composer_placeholder':'Ask anything about this page…',
      'foot_note':'Aside can make mistakes. Check important info.',
      'onboarding_title':'Set up your AI',
      'onboarding_sub':'Pick a provider (Claude, Gemini, Groq, etc.) and add your API key. Keys stay on your device.',
      'onboarding_cta':'Open Settings',
      'error_title':'Something went wrong','retry':'Try again',
    },
    he: {
      'tab_chat':'צ׳אט','tab_tools':'כלים',
      'hero_title':'איך אפשר לעזור עם העמוד הזה?',
      'hero_sub':'סכמו, חלצו, תרגמו, או שאלו כל דבר. תוכן העמוד נכלל אוטומטית.',
      'selected_label':'טקסט נבחר','from_page':'מהעמוד',
      'tools_page':'פעולות עמוד','tools_selection':'פעולות על בחירה',
      'composer_placeholder':'שאלו כל דבר על העמוד הזה…',
      'foot_note':'Aside עלול לטעות. בדקו מידע חשוב.',
      'onboarding_title':'התחילו את ה-AI שלכם',
      'onboarding_sub':'בחרו ספק והוסיפו מפתח API. המפתחות נשמרים אצלכם.',
      'onboarding_cta':'פתחו הגדרות',
      'error_title':'משהו השתבש','retry':'נסו שוב',
    }
  };
  const dir = (location.hash.match(/dir=(\w+)/) || [])[1] || new URLSearchParams(location.search).get('dir');
  const lang = (dir === 'rtl') ? 'he' : 'en';

  // Build the shim
  window.chrome = window.chrome || {};
  window.chrome.runtime = {
    id: '__aside-preview__',
    getURL: (p) => p,
    sendMessage: (msg, cb) => { console.log('[shim] runtime.sendMessage', msg); cb && cb({ ok: true }); },
    openOptionsPage: () => {
      // Navigate the parent (preview frame) to Settings if possible
      try { window.parent.postMessage({ type: '__open_settings' }, '*'); } catch {}
      // Fallback: navigate self
      const url = '../options/options.html';
      try { window.location.href = url; } catch {}
    },
    onMessage: { addListener: () => {} },
  };
  window.chrome.storage = {
    sync:  { get, set, clear, remove: () => Promise.resolve() },
    local: { get, set, clear, remove: () => Promise.resolve() },
    onChanged: { addListener: () => {}, removeListener: () => {} },
  };
  window.chrome.i18n = {
    getMessage: (k) => (I18N[lang] && I18N[lang][k]) || (I18N.en[k] || ''),
    getUILanguage: () => lang === 'he' ? 'he' : 'en-US',
  };
  window.chrome.commands = { onCommand: { addListener: () => {} } };
  window.chrome.tabs = { query: () => Promise.resolve([]), sendMessage: () => Promise.resolve() };

  // Seed reasonable defaults SYNCHRONOUSLY before sidebar.js runs init()
  (function seedDefaults() {
    const all = readStore();
    if (!all.activeProvider) {
      writeStore({
        activeProvider: 'gemini',
        apiKeys: { ...(all.apiKeys||{}), gemini: 'demo-key' },
        language: lang === 'he' ? 'he' : 'auto',
      });
    }
  })();

  // Override ProviderFactory once it loads so preview returns canned responses
  // instead of hitting real APIs (which would fail without a key).
  // Uses a getter/setter on window.ProviderFactory so we patch synchronously
  // the moment provider-factory.js assigns it — no race against sidebar.js init.
  let __PF;
  function patchFactory(factory) {
    if (!factory || factory.__shimmed) return factory;
    factory.__shimmed = true;
    factory.get = function (id) {
      function cannedResponse(prompt) {
        const p = (prompt || '').toLowerCase();
        if (lang === 'he') {
          if (p.includes('summar')) return 'דוגמה: סיכום קצר של העמוד.\n\n- נקודה ראשונה\n- נקודה שנייה\n- נקודה שלישית';
          if (p.includes('translat')) return 'תרגום לדוגמה של הטקסט הנבחר.';
          if (p.includes('explain')) return 'הסבר ברור: זוהי תצוגה מקדימה של הצ׳אט. כשתתקינו את התוסף האמיתי עם מפתח API, התשובות יהיו אמיתיות.';
          if (p.includes('hello world') || p.includes('javascript')) return 'דוגמת **Hello World** ב-JavaScript:\n\n```js\nconsole.log("Hello, world!");\n```\n\nשורת הקוד מדפיסה את הטקסט לקונסולה.';
          return 'זו תצוגה מקדימה. הוסיפו מפתח API דרך ההגדרות כדי לקבל תשובות אמיתיות.';
        }
        if (p.includes('summar')) return 'Here\'s a quick summary of the page:\n\n- This is a **preview** of the redesigned sidebar.\n- The chat thread, tools tab, and command bar are wired up.\n- Markdown, tables, and code blocks all render.\n\n```js\nconsole.log("ready");\n```';
        if (p.includes('translat')) return 'This is the translated text. Real translations will come from your selected provider.';
        if (p.includes('explain')) return 'Sure — this is the **preview mode**. The real extension calls your chosen provider (Claude, GPT-4o, Gemini…) with your API key. For now, responses are canned so you can see the layout.';
        if (p.includes('extract')) return '| Field | Value |\n|---|---|\n| Title | Sample Page |\n| Author | Demo |\n| Tags | preview, design |';
        if (p.includes('reply')) return '1. Sounds good — let\'s do it.\n2. Could you share more context first?\n3. I\'ll need to think on this and get back to you.';
        if (p.includes('hello world') || p.includes('javascript')) return 'Here\'s a classic **Hello World** in JavaScript:\n\n```js\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("world");\n```\n\nThe `greet` function takes a `name` parameter and uses a template literal to log a friendly message. Call it with any string to get a personalised greeting.';
        return 'This is a preview response. Install Aside as a Chrome extension and add your API key to get real answers.';
      }
      function lastUserPrompt(messages) {
        if (!Array.isArray(messages)) return '';
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user') return messages[i].content || '';
        }
        return '';
      }
      return {
        async complete(prompt) {
          await new Promise(r => setTimeout(r, 700));
          return cannedResponse(prompt);
        },
        async completeStream(messages, system, onChunk) {
          const full = cannedResponse(lastUserPrompt(messages));
          let i = 0;
          while (i < full.length) {
            const next = Math.min(i + (16 + Math.floor(Math.random() * 12)), full.length);
            onChunk(full.slice(i, next));
            i = next;
            await new Promise(r => setTimeout(r, 18));
          }
        },
        buildSystemPrompt(context, lang) {
          return [context, lang ? `Respond in ${lang}.` : ''].filter(Boolean).join('\n\n');
        }
      };
    };
    return factory;
  }
  // Intercept ProviderFactory assignment (provider-factory.js does `self.ProviderFactory = ...`)
  if (Object.getOwnPropertyDescriptor(window, 'ProviderFactory')?.value) {
    __PF = patchFactory(window.ProviderFactory);
  } else {
    Object.defineProperty(window, 'ProviderFactory', {
      configurable: true,
      enumerable: true,
      get() { return __PF; },
      set(v)  { __PF = patchFactory(v); },
    });
  }
})();
