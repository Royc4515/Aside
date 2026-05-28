// ============================================================
// Aside landing — sticky nav, reveal animations, i18n (EN/HE)
// ============================================================

// ---------- i18n dictionary --------------------------------

const STRINGS = {
  en: {
    'meta.title': 'Aside — AI sidebar for Chrome. Claude, Gemini, GPT-4o, Grok, Groq, Ollama.',
    'meta.description': 'Aside is a Chrome extension that puts six AI providers — Claude, Gemini, GPT-4o, Grok, Groq, and local Ollama — one keystroke away on any page.',

    'nav.features': 'Features',
    'nav.providers': 'Providers',
    'nav.how': 'How it works',
    'nav.faq': 'FAQ',
    'nav.privacy': 'Privacy',
    'nav.install': 'Install',
    'nav.github': 'GitHub',

    'hero.eyebrow.short': 'A Chrome extension',
    'hero.title': 'AI in your <em>sidebar.</em>',
    'hero.lede': "AI that already knows the page you're on. Summarize, extract key points, translate, or just chat — with the provider you choose.",
    'hero.cta.install': 'Install from GitHub',
    'hero.cta.howToInstall': 'How to install →',
    'hero.cta.storeSoon': '<strong>Coming to the Chrome Web Store</strong> · Free, MIT licensed.',
    'hero.meta.mit': 'MIT licensed',
    'hero.meta.notelemetry': 'No telemetry',
    'hero.meta.langs': '8 UI languages',
    'a11y.skip': 'Skip to content',

    'strip.providers': 'Providers',
    'strip.keystroke': 'Keystroke',
    'strip.telemetry': 'Telemetry',
    'strip.languages': 'UI languages',
    'strip.mv3': 'Manifest V3',

    'features.kicker': 'Why Aside',
    'features.h2': 'Built to disappear into your workflow.',
    'features.intro': "You're reading something — an article, a paper, an API doc — and you want an AI's take, right now, without leaving the page.",
    'features.f1.h': 'One keystroke',
    'features.f1.p': "<kbd>Alt</kbd>+<kbd>A</kbd> on any page. The sidebar slides in, already knowing what you're reading.",
    'features.f2.h': 'Six AI providers',
    'features.f2.p': 'Claude, Gemini, GPT-4o, Grok, Groq, and local Ollama — switch in one click, no separate logins.',
    'features.f3.h': 'Reads the page for you',
    'features.f3.p': 'Summarize, extract key points, translate, find on page, or write your own prompt. No copy-paste.',
    'features.f4.h': 'Streaming answers',
    'features.f4.p': 'Tokens arrive as the model thinks — cancel any time, edit, and ask again.',
    'features.f5.h': 'Your theme, your language',
    'features.f5.p': 'Light or dark — auto-matches your system. Eight UI languages — English, Hebrew, Spanish, French, German, Chinese, Arabic, Japanese — with full RTL support.',
    'features.f6.h': 'History that follows the page',
    'features.f6.p': 'Conversations are saved per-site so you can pick up where you left off.',

    'providers.kicker': 'Providers',
    'providers.h2': 'Bring the model you already pay for.',
    'providers.intro': 'Add a key once in <strong>Settings → Provider</strong>. Aside validates it against the live API before saving — invalid keys never get stored. Switch any time, right from the sidebar.',
    'providers.ollamaVendor': 'Local · offline',

    'how.kicker': 'How it works',
    'how.h2': 'Three steps to a smarter page.',
    'how.s1.h': 'Press <kbd>Alt</kbd>+<kbd>A</kbd>',
    'how.s1.p': "A slim sidebar slides in on the right (or left — your choice). It already knows the page's language and what text you have selected.",
    'how.s2.h': 'Click a chip — or type',
    'how.s2.p': '<em>Summarize</em>, <em>Key points</em>, <em>Translate</em>, <em>Explain</em>, <em>Find on page</em>. Or write your own prompt. Answers stream in token-by-token.',
    'how.s3.h': 'Switch models any time',
    'how.s3.p': 'The header dropdown swaps between Claude, Gemini, GPT-4o, Grok, Groq, and Ollama with one click. Your active provider persists between sessions.',

    'privacy.kicker': 'Privacy',
    'privacy.h2': 'Your keys. Your machine. Your data.',
    'privacy.c1.h': 'Keys stay local',
    'privacy.c1.p': "API keys live in Chrome's encrypted local storage on your device and are sent only to the provider you chose, over HTTPS. They never sync to the cloud.",
    'privacy.c2.h': 'No middleman',
    'privacy.c2.p': 'No analytics, no telemetry, no proxy server. Requests go straight from your browser to the model provider.',
    'privacy.c3.h': 'Only on your prompt',
    'privacy.c3.p': 'Page content is included only when <em>you</em> ask. Trimmed to 12,000 characters and sent with that single request.',
    'privacy.c4.h': 'Fully offline mode',
    'privacy.c4.p': 'Pick <strong>Ollama</strong> and nothing leaves your computer — your prompt and the page text stay on your machine.',

    'faq.kicker': 'FAQ',
    'faq.h2': 'Common questions.',
    'faq.q1.q': 'Is Aside really free?',
    'faq.q1.a': "Yes. Aside itself is open source under the MIT license, free to use. You pay only what your provider charges for API calls — Anthropic, Google, OpenAI, xAI, and Groq each set their own pricing. Pick Ollama and run it locally — the whole stack is free.",
    'faq.q2.q': 'Are my API keys safe?',
    'faq.q2.a': "Keys live in Chrome's encrypted local storage on your device and are sent only to the provider that issued them, over HTTPS. They never sync to the cloud and never reach any Aside server — because there is none. No proxy, no analytics, no telemetry. Read the full <a href=\"PRIVACY.html\">Privacy Policy</a>.",
    'faq.q3.q': 'Do I need an account to use Aside?',
    'faq.q3.a': "No account, no sign-up, no email. Install the extension, paste at least one provider API key, and you're in. Aside has no login of its own.",
    'faq.q4.q': 'Which browsers are supported?',
    'faq.q4.a': "Aside is a Manifest V3 extension and runs on any Chromium-based browser — Google Chrome, Microsoft Edge, Brave, Arc, Opera. Firefox is on the roadmap — we'll add it once we port the manifest.",
    'faq.q5.q': 'Can I use Aside fully offline?',
    'faq.q5.a': 'Yes. Pick Ollama as the provider and Aside makes no network calls outside localhost. Your prompts, selected text, and page content stay on your machine.',
    'faq.q6.q': 'Where is my conversation history stored?',
    'faq.q6.a': "Threads are saved per-site in Chrome's <code>storage.local</code> on your device. They aren't synced to any cloud and can be cleared from Settings or by uninstalling the extension.",
    'faq.q7.q': "<kbd>Alt</kbd>+<kbd>A</kbd> doesn't open the sidebar — how do I fix it?",
    'faq.q7.a': "Chrome doesn't auto-assign keyboard shortcuts to unpacked extensions (only to Chrome Web Store installs). Open <code>chrome://extensions/shortcuts</code>, find <strong>Aside</strong>, and set <em>Toggle the AI sidebar</em> to <kbd>Alt</kbd>+<kbd>A</kbd> (or any combo you like). 10 seconds.",

    'install.kicker': 'Install',
    'install.h2': 'Two ways to install. A minute either way.',
    'install.c1.h': 'Chrome Web Store',
    'install.c1.pill': 'Coming soon',
    'install.c1.p': "One-click install, automatic updates. We're preparing the store listing — check back shortly.",
    'install.c1.btn': 'Add to Chrome',
    'install.c2.h': 'Load unpacked',
    'install.c2.pill': 'Available now',
    'install.c2.s1': 'Download the repo — <a href="https://github.com/Royc4515/Aside/archive/refs/heads/main.zip">latest ZIP</a> — and unzip it.',
    'install.c2.s2': 'Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.',
    'install.c2.s3': 'Click <strong>Load unpacked</strong> and pick the folder that contains <code>manifest.json</code> (the <code>Aside-main</code> folder you just unzipped — not a subfolder).',
    'install.c2.s4': 'Open <strong>Settings</strong> and paste at least one API key.',
    'install.c2.s5': 'Hit <kbd>Alt</kbd>+<kbd>A</kbd> on any page.',
    'install.c2.s6': "If the shortcut doesn't respond, open <code>chrome://extensions/shortcuts</code> and set <kbd>Alt</kbd>+<kbd>A</kbd> for <em>Toggle the AI sidebar</em> — Chrome doesn't always auto-assign keys to unpacked extensions.",
    'install.c2.btn': 'Open repository →',
    'install.footnote': 'No build step. No npm install. No accounts. Just unzip and load.',

    'cta.h2': 'Ready to read smarter?',
    'cta.p': 'Open source. MIT-licensed. Free forever.',
    'cta.btn1': 'Get Aside on GitHub',
    'cta.btn2': 'Read the architecture →',

    'footer.architecture': 'Architecture',
    'footer.privacy': 'Privacy Policy',
    'footer.copy': '© 2026 Roy Carmelli · MIT licensed',
  },

  he: {
    'meta.title': 'Aside — סרגל AI ל-Chrome. Claude, Gemini, GPT-4o, Grok, Groq, Ollama.',
    'meta.description': 'Aside הוא תוסף Chrome המביא שישה ספקי AI — Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama מקומי — בהקשה אחת, בכל דף.',

    'nav.features': 'תכונות',
    'nav.providers': 'ספקים',
    'nav.how': 'איך זה עובד',
    'nav.faq': 'שאלות נפוצות',
    'nav.privacy': 'פרטיות',
    'nav.install': 'התקנה',
    'nav.github': 'GitHub',

    'hero.eyebrow.short': 'תוסף Chrome',
    'hero.title': 'בינה מלאכותית <span class="accent">בסרגל הצד.</span>',
    'hero.lede': 'AI שמכיר את הדף שאתם קוראים. סכמו, חלצו תובנות, תרגמו או פשוט שוחחו — עם הספק שאתם בוחרים.',
    'hero.cta.install': 'התקינו מ-GitHub',
    'hero.cta.howToInstall': '← איך מתקינים',
    'hero.cta.storeSoon': '<strong>בקרוב ב-Chrome Web Store</strong> · חינמי, רישיון MIT.',
    'a11y.skip': 'דלגו לתוכן',
    'hero.meta.mit': 'רישיון MIT',
    'hero.meta.notelemetry': 'ללא טלמטריה',
    'hero.meta.langs': '8 שפות ממשק',

    'strip.providers': 'ספקים',
    'strip.keystroke': 'הקשה',
    'strip.telemetry': 'טלמטריה',
    'strip.languages': 'שפות ממשק',
    'strip.mv3': 'Manifest V3',

    'features.kicker': 'למה Aside',
    'features.h2': 'מתוכנן להיטמע בעבודה שלכם.',
    'features.intro': 'אתם קוראים משהו — מאמר, מחקר, תיעוד API או שרשור מיילים ארוך — ורוצים את הזווית של AI <em>עכשיו</em>, בלי לעזוב את הדף.',
    'features.f1.h': 'הקשה אחת',
    'features.f1.p': '<kbd>Alt</kbd>+<kbd>A</kbd> בכל דף. סרגל הצד נפתח — וכבר יודע מה אתם קוראים.',
    'features.f2.h': 'שישה ספקי AI',
    'features.f2.p': 'Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama מקומי — מחליפים בלחיצה, ללא התחברויות נפרדות.',
    'features.f3.h': 'קורא את הדף עבורכם',
    'features.f3.p': 'סיכום, נקודות מפתח, תרגום, חיפוש בדף או פרומפט משלכם. בלי להעתיק ולהדביק.',
    'features.f4.h': 'תשובות בסטרימינג',
    'features.f4.p': 'הטוקנים מגיעים תוך כדי שהמודל חושב — אפשר לעצור, לערוך ולשאול שוב, בכל רגע.',
    'features.f5.h': 'העיצוב והשפה שלכם',
    'features.f5.p': 'בהיר או כהה — מתאים את עצמו אוטומטית לתצוגת המערכת. שמונה שפות ממשק — אנגלית, עברית, ספרדית, צרפתית, גרמנית, סינית, ערבית ויפנית — עם תמיכה מלאה ב-RTL.',
    'features.f6.h': 'היסטוריה לכל דף',
    'features.f6.p': 'השיחות נשמרות לכל אתר בנפרד, כדי שתוכלו להמשיך מהמקום שבו עצרתם.',

    'providers.kicker': 'ספקים',
    'providers.h2': 'השתמשו במודל שאתם כבר משלמים עבורו.',
    'providers.intro': 'הוסיפו מפתח פעם אחת ב-<strong>הגדרות → ספק</strong>. Aside מאמת אותו מול ה-API האמיתי לפני השמירה — מפתחות לא תקפים לא נשמרים. החליפו בכל רגע — ישירות מהסרגל.',
    'providers.ollamaVendor': 'מקומי · אופליין',

    'how.kicker': 'איך זה עובד',
    'how.h2': 'שלוש הקשות לדף חכם יותר.',
    'how.s1.h': 'הקישו <kbd>Alt</kbd>+<kbd>A</kbd>',
    'how.s1.p': 'סרגל צד דק נפתח מימין (או משמאל — איך שתעדיפו). הוא כבר יודע את שפת הדף ומה סימנתם.',
    'how.s2.h': 'לחצו על צ׳יפ — או הקלידו',
    'how.s2.p': '<em>סיכום</em>, <em>נקודות מפתח</em>, <em>תרגום</em>, <em>הסבר</em>, <em>חיפוש בדף</em>. או כתבו פרומפט משלכם. התשובות מגיעות טוקן-אחר-טוקן.',
    'how.s3.h': 'החליפו מודלים בכל רגע',
    'how.s3.p': 'התפריט בכותרת הסרגל מחליף בין Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama בלחיצה אחת. הספק הפעיל נשמר בין הפעלות.',

    'privacy.kicker': 'פרטיות',
    'privacy.h2': 'המפתחות שלכם. המחשב שלכם. המידע שלכם.',
    'privacy.c1.h': 'המפתחות נשארים אצלכם',
    'privacy.c1.p': 'מפתחות ה-API נשמרים באחסון המקומי המוצפן של Chrome במחשב שלכם, ונשלחים רק לספק שבחרתם — ב-HTTPS. הם לא מסונכרנים לענן.',
    'privacy.c2.h': 'בלי מתווך',
    'privacy.c2.p': 'בלי אנליטיקס, בלי טלמטריה, בלי שרת מתווך. הבקשות עוברות ישירות מהדפדפן שלכם לספק המודל.',
    'privacy.c3.h': 'רק כשאתם מבקשים',
    'privacy.c3.p': 'תוכן הדף נשלח רק כש<em>אתם</em> מבקשים. מוגבל ל-12,000 תווים ונשלח רק עם אותה הבקשה.',
    'privacy.c4.h': 'מצב אופליין מלא',
    'privacy.c4.p': 'בחרו ב-<strong>Ollama</strong> ושום דבר לא יוצא מהמחשב שלכם — הפרומפט וטקסט הדף נשארים אצלכם.',

    'faq.kicker': 'שאלות נפוצות',
    'faq.h2': 'שאלות שאתם שואלים.',
    'faq.q1.q': 'באמת חינמי?',
    'faq.q1.a': 'כן. Aside עצמו הוא קוד פתוח ברישיון MIT, ללא עלות. אתם משלמים רק על שימוש ב-API של הספק שבחרתם — לכל אחד מהם — Anthropic, Google, OpenAI, xAI, Groq — מחירון משלו. אם אתם בוחרים ב-Ollama מקומי, כל המערכת חינמית.',
    'faq.q2.q': 'מפתחות ה-API שלי בטוחים?',
    'faq.q2.a': 'המפתחות נשמרים באחסון המקומי המוצפן של Chrome במחשב שלכם ונשלחים רק לספק שהנפיק אותם — ב-HTTPS. הם לא מסונכרנים לענן ולא מגיעים לשום שרת של Aside — כי אין כזה. אין שרת מתווך. אין אנליטיקס. אין טלמטריה. קראו את <a href="PRIVACY.html">מדיניות הפרטיות המלאה</a>.',
    'faq.q3.q': 'צריך חשבון כדי להשתמש ב-Aside?',
    'faq.q3.a': 'אין חשבון, אין הרשמה, אין אימייל. מתקינים את התוסף, מדביקים לפחות מפתח API אחד, ויוצאים לדרך. Aside לא דורש התחברות בכלל.',
    'faq.q4.q': 'אילו דפדפנים נתמכים?',
    'faq.q4.a': 'Aside הוא תוסף Manifest V3, ורץ על כל דפדפן מבוסס Chromium — Google Chrome, Microsoft Edge, Brave, Arc, Opera. תמיכה ב-Firefox במפת הדרכים — נוסיף ברגע שנשלים את התאמת ה-manifest.',
    'faq.q5.q': 'אפשר להשתמש לגמרי אופליין?',
    'faq.q5.a': 'כן. בוחרים Ollama כספק, ו-Aside לא מבצע שום קריאת רשת מחוץ ל-localhost. הפרומפטים, הטקסט שסימנתם ותוכן הדף נשארים על המחשב שלכם.',
    'faq.q6.q': 'איפה נשמרת היסטוריית השיחות?',
    'faq.q6.a': 'השיחות נשמרות לפי אתר ב-<code>storage.local</code> של Chrome במחשב שלכם. הן לא מסונכרנות לענן, ואפשר למחוק אותן מההגדרות או על-ידי הסרת התוסף.',
    'faq.q7.q': '<kbd>Alt</kbd>+<kbd>A</kbd> לא פותח את הסרגל — איך מתקנים?',
    'faq.q7.a': 'Chrome לא תמיד מקצה אוטומטית קיצורי מקלדת לתוספים שנטענו ידנית (זה אוטומטי רק בהתקנה מ-Chrome Web Store). פתחו <code>chrome://extensions/shortcuts</code>, מצאו את <strong>Aside</strong>, והגדירו את הקיצור עבור <em>Toggle the AI sidebar</em> ל-<kbd>Alt</kbd>+<kbd>A</kbd> (או לכל צירוף שתעדיפו). עניין של 10 שניות.',

    'install.kicker': 'התקנה',
    'install.h2': 'שתי דרכים. דקה לכל אחת.',
    'install.c1.h': 'Chrome Web Store',
    'install.c1.pill': 'בקרוב',
    'install.c1.p': 'התקנה בלחיצה, עדכונים אוטומטיים. אנחנו מכינים את הדף בחנות — חזרו לבדוק בקרוב.',
    'install.c1.btn': 'הוסיפו ל-Chrome',
    'install.c2.h': 'טעינה ידנית',
    'install.c2.pill': 'זמין עכשיו',
    'install.c2.s1': 'הורידו את הריפו — <a href="https://github.com/Royc4515/Aside/archive/refs/heads/main.zip">קובץ ה-ZIP העדכני</a> — וחלצו אותו.',
    'install.c2.s2': 'פתחו את <code>chrome://extensions</code> והפעילו <strong>מצב מפתחים</strong>.',
    'install.c2.s3': 'לחצו <strong>טעינה לא ארוזה</strong> ובחרו את התיקייה המכילה את <code>manifest.json</code> (התיקייה <code>Aside-main</code> שחילצתם — ולא תת-תיקייה בתוכה).',
    'install.c2.s4': 'פתחו את <strong>ההגדרות</strong> והדביקו לפחות מפתח API אחד.',
    'install.c2.s5': 'הקישו <kbd>Alt</kbd>+<kbd>A</kbd> בכל דף.',
    'install.c2.s6': 'אם הקיצור לא מגיב, פתחו <code>chrome://extensions/shortcuts</code> והגדירו <kbd>Alt</kbd>+<kbd>A</kbd> עבור <em>Toggle the AI sidebar</em> — Chrome לא תמיד מקצה אוטומטית מקשים לתוספים שנטענו ידנית.',
    'install.c2.btn': '← פתחו את הריפו',
    'install.footnote': 'בלי build. בלי npm install. בלי חשבונות. מחלצים, טוענים, וזהו.',

    'cta.h2': 'מוכנים לקריאה חכמה יותר?',
    'cta.p': 'קוד פתוח. רישיון MIT. חינמי לתמיד.',
    'cta.btn1': 'הורידו את Aside מ-GitHub',
    'cta.btn2': '← קראו את הארכיטקטורה',

    'footer.architecture': 'ארכיטקטורה',
    'footer.privacy': 'מדיניות פרטיות',
    'footer.copy': '© 2026 Roy Carmelli · רישיון MIT',
  },
};

// ---------- Language detection & persistence ---------------

const LS_KEY = 'aside.lang';

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'en' || saved === 'he') return saved;
  } catch {}
  const langs = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const l of langs) {
    if (typeof l === 'string' && l.toLowerCase().startsWith('he')) return 'he';
  }
  return 'en';
}

function applyLang(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const str = dict[key];
    if (str == null) return;
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, str);
    else el.textContent = str;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const str = dict[key];
    if (str != null) el.innerHTML = str;
  });

  // Toggle button state
  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(lang === 'he'));
    toggle.querySelectorAll('.lang-opt').forEach((opt) => {
      opt.classList.toggle('is-active', opt.dataset.lang === lang);
    });
    const otherLabel = lang === 'he' ? 'Switch language to English' : 'החלף שפה לעברית';
    toggle.setAttribute('aria-label', otherLabel);
  }
}

function setLang(lang) {
  try { localStorage.setItem(LS_KEY, lang); } catch {}
  applyLang(lang);
}

// ---------- Boot -------------------------------------------

applyLang(detectInitialLang());

const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
  langToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('lang') === 'he' ? 'he' : 'en';
    setLang(current === 'he' ? 'en' : 'he');
  });
}

// ---------- Theme (light / dark) ---------------------------
// System preference is the implicit default (resolved by the inline
// head script before paint); the toggle only flips between explicit
// light and dark and saves the choice.

const THEME_KEY = 'aside.theme';

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('data-theme', theme);
    const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }
}

function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
}

applyTheme(currentTheme());

const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
}

// ---------- Sticky-nav border on scroll --------------------

const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 4);
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Reveal-on-scroll -------------------------------

const targets = document.querySelectorAll(
  '.hero-copy, .hero-art, .feature, .provider, .steps li, .priv-card, .install-card, .showcase, .cta-band-inner'
);
targets.forEach((el) => el.classList.add('reveal'));

const revealAll = () => targets.forEach((el) => el.classList.add('is-visible'));

if ('IntersectionObserver' in window && !navigator.webdriver) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  targets.forEach((el) => io.observe(el));
  // Safety net for headless crawlers that run JS but never scroll
  // (social preview bots, some SEO crawlers).
  setTimeout(revealAll, 1500);
} else {
  revealAll();
}
