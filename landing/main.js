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

    'hero.eyebrow': 'Chrome extension · MV3 · Open source',
    'hero.eyebrow.free': 'Free · MIT licensed',
    'hero.title': 'AI in your sidebar.<br /><span class="accent">On any webpage.</span>',
    'hero.lede': "Ask any AI about the page you're reading — summarize, extract, translate, or just chat. Six providers, one keystroke, zero context-switching.",
    'hero.cta.install': 'Install from GitHub',
    'hero.cta.howToInstall': 'How to install →',
    'hero.cta.storeSoon': 'Coming to the Chrome Web Store soon.',
    'hero.meta.shortcut': '<kbd>Alt</kbd> <span>+</span> <kbd>A</kbd> on any page',
    'hero.meta.nobuild': 'No build · No accounts',
    'hero.meta.mit': 'MIT licensed',
    'a11y.skip': 'Skip to content',

    'strip.providers': 'Providers',
    'strip.keystroke': 'Keystroke',
    'strip.telemetry': 'Telemetry',
    'strip.languages': 'Languages · EN / HE',
    'strip.mv3': 'Manifest V3',

    'features.kicker': 'Why Aside',
    'features.h2': 'Built to disappear into your workflow.',
    'features.intro': "You're reading something — an article, a research paper, an API doc, a long email thread — and you want an AI's take <em>now</em>, without losing your place.",
    'features.f1.h': 'One keystroke',
    'features.f1.p': '<kbd>Alt</kbd>+<kbd>A</kbd> on any page. The sidebar slides in, already aware of what you\'re looking at.',
    'features.f2.h': 'Six AI providers',
    'features.f2.p': 'Claude, Gemini, GPT-4o, Grok, Groq, and local Ollama — switch in a click, no separate logins.',
    'features.f3.h': 'Reads the page for you',
    'features.f3.p': 'Summarize, extract key points, translate, find on page, or run a custom prompt. No copy-paste.',
    'features.f4.h': 'Streaming answers',
    'features.f4.p': 'Tokens arrive as the model thinks — cancel any time, edit, and ask again.',
    'features.f5.h': 'Your theme, your language',
    'features.f5.p': 'Light, dark, or auto. English or Hebrew, with full RTL support.',
    'features.f6.h': 'History that follows the page',
    'features.f6.p': 'Conversations are saved per-site so you can pick up where you left off.',

    'providers.kicker': 'Providers',
    'providers.h2': 'Bring the model you already pay for.',
    'providers.intro': 'Add a key once in <strong>Settings → Provider</strong>. Aside validates it live against the real API before saving. Switch any time from the sidebar header.',
    'providers.ollamaVendor': 'Local · offline',

    'how.kicker': 'How it works',
    'how.h2': 'Three keys away from a smarter page.',
    'how.s1.h': 'Press <kbd>Alt</kbd>+<kbd>A</kbd>',
    'how.s1.p': "A slim sidebar slides in on the right (or left — your choice). It already knows the page's language and what text you have selected.",
    'how.s2.h': 'Tap a chip — or type',
    'how.s2.p': '<em>Summarize</em>, <em>Key points</em>, <em>Translate</em>, <em>Explain</em>, <em>Find on page</em>. Or write your own prompt. Answers stream in token-by-token.',
    'how.s3.h': 'Switch models any time',
    'how.s3.p': 'The header dropdown swaps between Claude, Gemini, GPT-4o, Grok, Groq, and Ollama with one click. Each remembers its own model.',

    'privacy.kicker': 'Privacy',
    'privacy.h2': 'Your keys. Your machine. Your data.',
    'privacy.c1.h': 'Keys stay local',
    'privacy.c1.p': "API keys live in Chrome's encrypted local storage and are sent only to the provider you chose, over HTTPS.",
    'privacy.c2.h': 'No middleman',
    'privacy.c2.p': 'No analytics, no telemetry, no proxy server. Requests go straight from your browser to the model provider.',
    'privacy.c3.h': 'Only on your prompt',
    'privacy.c3.p': 'Page content is included only when <em>you</em> ask. Trimmed to 12 000 characters and sent with that single request.',
    'privacy.c4.h': 'Fully offline mode',
    'privacy.c4.p': 'Pick <strong>Ollama</strong> and nothing leaves your computer — your prompt and the page text stay on your machine.',

    'faq.kicker': 'FAQ',
    'faq.h2': 'Common questions.',
    'faq.q1.q': 'Is Aside really free?',
    'faq.q1.a': "Yes. Aside itself is open source under the MIT license and costs nothing. You pay only what your chosen AI provider charges for API usage — Anthropic, Google, OpenAI, xAI, and Groq each have their own pricing. If you pick Ollama and run it locally, the whole stack is free.",
    'faq.q2.q': 'Are my API keys safe?',
    'faq.q2.a': "Keys live in Chrome's encrypted local storage on your device and are sent only to the provider that issued them, over HTTPS. There is no Aside server, no proxy, no analytics, no telemetry. Read the full <a href=\"PRIVACY.html\">Privacy Policy</a>.",
    'faq.q3.q': 'Do I need an account to use Aside?',
    'faq.q3.a': "No account, no sign-up, no email. Install the extension, paste at least one provider API key, and you're in. Aside has no auth layer of its own.",
    'faq.q4.q': 'Which browsers are supported?',
    'faq.q4.a': 'Aside is a Manifest V3 extension and runs on any Chromium-based browser — Google Chrome, Microsoft Edge, Brave, Arc, Opera. Firefox is on the roadmap once we port the manifest.',
    'faq.q5.q': 'Can I use Aside fully offline?',
    'faq.q5.a': 'Yes. Pick Ollama as the provider and Aside makes no network calls outside localhost. Your prompts, selected text, and page content stay on your machine.',
    'faq.q6.q': 'Where is my conversation history stored?',
    'faq.q6.a': "Threads are saved per-site in Chrome's <code>storage.local</code> on your device. They aren't synced to any cloud and can be cleared from Settings or by uninstalling the extension.",

    'install.kicker': 'Install',
    'install.h2': 'Two ways in. Both take about a minute.',
    'install.c1.h': 'Chrome Web Store',
    'install.c1.pill': 'Coming soon',
    'install.c1.p': "One-click install, automatic updates. We're preparing the store listing — check back shortly.",
    'install.c1.btn': 'Add to Chrome',
    'install.c2.h': 'Load unpacked',
    'install.c2.pill': 'Available now',
    'install.c2.s1': 'Download the repo — <a href="https://github.com/Royc4515/Aside/archive/refs/heads/main.zip">latest ZIP</a> — and unzip it.',
    'install.c2.s2': 'Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.',
    'install.c2.s3': 'Click <strong>Load unpacked</strong> and pick the <code>Aside-main</code> folder.',
    'install.c2.s4': 'Open <strong>Settings</strong> and paste at least one API key.',
    'install.c2.s5': 'Hit <kbd>Alt</kbd>+<kbd>A</kbd> on any page.',
    'install.c2.btn': 'Open repository →',
    'install.footnote': 'No build step. No npm install. No accounts. Just unzip and load.',

    'cta.h2': 'Ready to read smarter?',
    'cta.p': 'Open source, MIT-licensed, and free forever.',
    'cta.btn1': 'Get Aside on GitHub',
    'cta.btn2': 'Read the architecture →',

    'footer.architecture': 'Architecture',
    'footer.privacy': 'Privacy Policy',
    'footer.copy': 'Built with care. MIT licensed. © 2026 Roy Carmelli.',
  },

  he: {
    'meta.title': 'Aside — סרגל AI לכרום. Claude, Gemini, GPT-4o, Grok, Groq, Ollama.',
    'meta.description': 'Aside היא תוסף לכרום שמביא שישה ספקי AI — Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama מקומי — במרחק הקשה אחת מכל דף.',

    'nav.features': 'תכונות',
    'nav.providers': 'ספקים',
    'nav.how': 'איך זה עובד',
    'nav.faq': 'שאלות נפוצות',
    'nav.privacy': 'פרטיות',
    'nav.install': 'התקנה',
    'nav.github': 'GitHub',

    'hero.eyebrow': 'תוסף Chrome · MV3 · קוד פתוח',
    'hero.eyebrow.free': 'חינמי · רישיון MIT',
    'hero.title': 'בינה מלאכותית בסרגל הצד.<br /><span class="accent">בכל דף באינטרנט.</span>',
    'hero.lede': 'שאלו כל מודל AI על הדף שאתם קוראים — סכמו, חלצו, תרגמו או פשוט שוחחו. שישה ספקים, הקשה אחת, בלי לקפוץ בין חלונות.',
    'hero.cta.install': 'התקינו מ-GitHub',
    'hero.cta.howToInstall': '← איך מתקינים',
    'hero.cta.storeSoon': 'בקרוב גם ב-Chrome Web Store.',
    'a11y.skip': 'דלגו לתוכן',
    'hero.meta.shortcut': '<kbd>Alt</kbd> <span>+</span> <kbd>A</kbd> בכל דף',
    'hero.meta.nobuild': 'בלי build · בלי חשבונות',
    'hero.meta.mit': 'רישיון MIT',

    'strip.providers': 'ספקים',
    'strip.keystroke': 'הקשה',
    'strip.telemetry': 'טלמטריה',
    'strip.languages': 'שפות · עב / EN',
    'strip.mv3': 'Manifest V3',

    'features.kicker': 'למה Aside',
    'features.h2': 'בנוי כדי להיעלם לתוך זרימת העבודה שלכם.',
    'features.intro': 'אתם קוראים משהו — מאמר, מחקר, תיעוד API או שרשור מיילים ארוך — ואתם רוצים תשובה מ-AI <em>עכשיו</em>, בלי לאבד את המקום.',
    'features.f1.h': 'הקשה אחת',
    'features.f1.p': '<kbd>Alt</kbd>+<kbd>A</kbd> בכל דף. סרגל הצד נפתח, כבר מודע למה שאתם קוראים.',
    'features.f2.h': 'שישה ספקי AI',
    'features.f2.p': 'Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama מקומי — מחליפים בקליק, בלי התחברויות נפרדות.',
    'features.f3.h': 'קורא את הדף בשבילכם',
    'features.f3.p': 'סיכום, נקודות מפתח, תרגום, חיפוש בדף או prompt מותאם. בלי copy-paste.',
    'features.f4.h': 'תשובות בסטרימינג',
    'features.f4.p': 'טוקנים מגיעים תוך כדי שהמודל חושב — אפשר לבטל, לערוך ולשאול שוב בכל רגע.',
    'features.f5.h': 'העיצוב והשפה שלכם',
    'features.f5.p': 'מצב בהיר, כהה או אוטומטי. אנגלית או עברית, עם תמיכה מלאה ב-RTL.',
    'features.f6.h': 'היסטוריה לפי דף',
    'features.f6.p': 'השיחות נשמרות לפי אתר כך שתוכלו להמשיך מהמקום שעצרתם.',

    'providers.kicker': 'ספקים',
    'providers.h2': 'הביאו את המודל שאתם כבר משלמים עליו.',
    'providers.intro': 'הוסיפו מפתח פעם אחת ב-<strong>הגדרות → ספק</strong>. Aside מאמת אותו מול ה-API האמיתי לפני שמירה. החליפו בכל רגע מכותרת הסרגל.',
    'providers.ollamaVendor': 'מקומי · אופליין',

    'how.kicker': 'איך זה עובד',
    'how.h2': 'שלוש הקשות מדף חכם יותר.',
    'how.s1.h': 'הקישו <kbd>Alt</kbd>+<kbd>A</kbd>',
    'how.s1.p': 'סרגל צד דק נפתח מימין (או משמאל — לבחירתכם). הוא כבר יודע את שפת הדף ואיזה טקסט סימנתם.',
    'how.s2.h': 'הקליקו על צ׳יפ — או הקלידו',
    'how.s2.p': '<em>סיכום</em>, <em>נקודות מפתח</em>, <em>תרגום</em>, <em>הסבר</em>, <em>חיפוש בדף</em>. או כתבו prompt משלכם. התשובות מגיעות טוקן-אחר-טוקן.',
    'how.s3.h': 'החליפו מודלים בכל רגע',
    'how.s3.p': 'התפריט בכותרת מחליף בין Claude, Gemini, GPT-4o, Grok, Groq ו-Ollama בקליק. כל אחד זוכר את המודל שלו.',

    'privacy.kicker': 'פרטיות',
    'privacy.h2': 'המפתחות שלכם. המחשב שלכם. הנתונים שלכם.',
    'privacy.c1.h': 'המפתחות נשארים מקומיים',
    'privacy.c1.p': 'מפתחות ה-API נשמרים באחסון המקומי המוצפן של Chrome ונשלחים רק לספק שבחרתם, ב-HTTPS.',
    'privacy.c2.h': 'בלי מתווך',
    'privacy.c2.p': 'בלי אנליטיקס, בלי טלמטריה, בלי שרת proxy. הבקשות עוברות ישירות מהדפדפן שלכם לספק המודל.',
    'privacy.c3.h': 'רק לפי בקשתכם',
    'privacy.c3.p': 'תוכן הדף נשלח רק כש<em>אתם</em> מבקשים. נחתך ל-12,000 תווים ונשלח עם הבקשה הבודדת הזו.',
    'privacy.c4.h': 'מצב אופליין מלא',
    'privacy.c4.p': 'בחרו ב-<strong>Ollama</strong> ושום דבר לא יוצא מהמחשב שלכם — ה-prompt וטקסט הדף נשארים אצלכם.',

    'faq.kicker': 'שאלות נפוצות',
    'faq.h2': 'שאלות שחוזרות.',
    'faq.q1.q': 'באמת חינמי?',
    'faq.q1.a': 'כן. Aside עצמו הוא קוד פתוח ברישיון MIT, ללא עלות. אתם משלמים רק על שימוש ב-API של הספק שבחרתם — לכל אחד מהם (Anthropic, Google, OpenAI, xAI, Groq) מחירון משלו. אם אתם בוחרים ב-Ollama מקומי, כל הסטאק חינמי.',
    'faq.q2.q': 'מפתחות ה-API שלי בטוחים?',
    'faq.q2.a': 'המפתחות נשמרים באחסון המוצפן המקומי של Chrome במחשב שלכם ונשלחים רק לספק שהנפיק אותם, ב-HTTPS. אין שרת של Aside, אין proxy, אין אנליטיקס, אין טלמטריה. קראו את <a href="PRIVACY.html">מדיניות הפרטיות המלאה</a>.',
    'faq.q3.q': 'צריך חשבון כדי להשתמש ב-Aside?',
    'faq.q3.a': 'אין חשבון, אין הרשמה, אין אימייל. מתקינים את התוסף, מדביקים לפחות מפתח API אחד, ויוצאים לדרך. ל-Aside אין שכבת autenticantion משלו.',
    'faq.q4.q': 'אילו דפדפנים נתמכים?',
    'faq.q4.a': 'Aside הוא תוסף Manifest V3 ורץ על כל דפדפן מבוסס Chromium — Google Chrome, Microsoft Edge, Brave, Arc, Opera. Firefox במפת הדרכים ברגע שנפורט את ה-manifest.',
    'faq.q5.q': 'אפשר להשתמש לגמרי אופליין?',
    'faq.q5.a': 'כן. בוחרים Ollama כספק, ו-Aside לא עושה שום קריאת רשת מחוץ ל-localhost. הפרומפטים, הטקסט שסימנתם ותוכן הדף נשארים על המחשב שלכם.',
    'faq.q6.q': 'איפה נשמרת היסטוריית השיחות?',
    'faq.q6.a': 'שיחות נשמרות לפי אתר ב-<code>storage.local</code> של Chrome במחשב שלכם. הן לא מסונכרנות לענן וניתן לנקות אותן מההגדרות או על-ידי הסרת התוסף.',

    'install.kicker': 'התקנה',
    'install.h2': 'שתי דרכים להתקין. שתיהן לוקחות בערך דקה.',
    'install.c1.h': 'Chrome Web Store',
    'install.c1.pill': 'בקרוב',
    'install.c1.p': 'התקנה בקליק, עדכונים אוטומטיים. אנחנו מכינים את הדף בחנות — בדקו שוב בקרוב.',
    'install.c1.btn': 'הוסיפו לכרום',
    'install.c2.h': 'טעינה ידנית',
    'install.c2.pill': 'זמין עכשיו',
    'install.c2.s1': 'הורידו את הריפו — <a href="https://github.com/Royc4515/Aside/archive/refs/heads/main.zip">קובץ ה-ZIP האחרון</a> — ופתחו אותו.',
    'install.c2.s2': 'פתחו את <code>chrome://extensions</code> והפעילו <strong>מצב מפתחים</strong>.',
    'install.c2.s3': 'לחצו <strong>טעינה לא ארוזה</strong> ובחרו את התיקייה <code>Aside-main</code>.',
    'install.c2.s4': 'פתחו <strong>הגדרות</strong> והדביקו לפחות מפתח API אחד.',
    'install.c2.s5': 'הקישו <kbd>Alt</kbd>+<kbd>A</kbd> בכל דף.',
    'install.c2.btn': '← פתחו את הריפו',
    'install.footnote': 'בלי build. בלי npm install. בלי חשבונות. רק לפתוח ולטעון.',

    'cta.h2': 'מוכנים לקרוא בצורה חכמה יותר?',
    'cta.p': 'קוד פתוח, רישיון MIT, חינמי לתמיד.',
    'cta.btn1': 'קבלו את Aside ב-GitHub',
    'cta.btn2': '← קראו את הארכיטקטורה',

    'footer.architecture': 'ארכיטקטורה',
    'footer.privacy': 'מדיניות פרטיות',
    'footer.copy': 'נבנה בקפידה. רישיון MIT. © 2026 Roy Carmelli.',
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
