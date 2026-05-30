/**
 * Aside landing site — lightweight i18n.
 * - Persists language choice in localStorage ("aside.site.lang")
 * - Defaults to browser language (Hebrew → he, anything else → en)
 * - Swaps text via [data-i18n="<key>"] and [data-i18n-attr="<attr>:<key>"]
 * - Flips dir=rtl on Hebrew
 */
(function () {
  const STORE_KEY = "aside.site.lang";
  const SUPPORTED = ["en", "he"];

  const dict = {
    en: {
      "nav.features": "Features",
      "nav.install": "Install",
      "nav.privacy": "Privacy",
      "nav.github": "GitHub",
      "cta.store": "Add to Chrome",
      "cta.store_soon": "Coming to Chrome Web Store",
      "cta.source": "Install from source",
      "hero.eyebrow": "Chrome Extension",
      "hero.title_a": "Every AI model.",
      "hero.title_b": "One sidebar.",
      "hero.sub": "Aside puts Claude, ChatGPT, Gemini, Grok, Groq and local Ollama side-by-side in a sidebar that travels with you. Bring your own keys. Nothing leaves your browser.",
      "hero.meta": "Free · Open source · BYOK",
      "providers.label": "Works with",
      "features.title": "Built for fast comparison",
      "features.sub": "Designed for people who ask the same prompt to three models before they trust an answer.",
      "feat.1.title": "Side-by-side comparison",
      "feat.1.body": "Pin two providers side-by-side and run the same prompt against both. Answers stream in parallel.",
      "feat.2.title": "Bring your own key",
      "feat.2.body": "Add the API keys you already have. We never see them, never store them, never proxy them.",
      "feat.3.title": "Local history",
      "feat.3.body": "Every conversation stays in your browser storage. No accounts, no cloud sync, no analytics.",
      "feat.4.title": "Prompt templates",
      "feat.4.body": "Save prompt snippets you actually use and fire them with one click.",
      "feat.5.title": "Works on any tab",
      "feat.5.body": "Press Alt+A on any page. Context follows, sidebar stays out of the way.",
      "feat.6.title": "Eight languages, RTL too",
      "feat.6.body": "Interface and responses in English, Hebrew, Spanish, French, German, Chinese, Arabic, and Japanese. Right-to-left handled correctly.",
      "gallery.title": "The easy way to use AI",
      "gallery.sub": "Familiar look, no glaring chrome — built to live next to whatever you’re reading.",
      "install.title": "Up and running in two minutes",
      "install.sub": "Two short setups. The first installs the extension; the second gets you a free API key so you can actually use it.",
      "install.aside.eyebrow": "Step 1",
      "install.aside.title": "Install Aside on Chrome",
      "install.aside.note": "No build step, no npm. Just download and load the folder. About 30 seconds.",
      "install.aside.s1.h": "Download the code",
      "install.aside.s1.b": "Grab the ZIP and unzip it anywhere on your machine.",
      "install.aside.s1.cta": "Download ZIP →",
      "install.aside.s2.h": "Open Chrome extensions",
      "install.aside.s2.b": "Paste chrome://extensions into the address bar and press Enter.",
      "install.aside.s3.h": "Turn on Developer mode",
      "install.aside.s3.b": "Top-right toggle. Without it, Chrome won’t load an unpacked extension.",
      "install.aside.s4.h": "Load unpacked",
      "install.aside.s4.b": "Click Load unpacked and select the unzipped Aside folder.",
      "install.aside.s5.h": "Pin it to the toolbar",
      "install.aside.s5.b": "Click the puzzle icon in the toolbar and pin Aside so it’s one click away.",
      "install.aside.s6.h": "Set the Alt + A shortcut",
      "install.aside.s6.b": "Chrome only auto-assigns shortcuts for Web Store extensions, so set it once by hand: open chrome://extensions/shortcuts, find Aside, click the box next to “Toggle the AI sidebar”, and press Alt + A. Now it opens on any page.",
      "install.groq.eyebrow": "Step 2 · Free",
      "install.groq.title": "Get a free Groq API key",
      "install.groq.note": "Groq runs Llama 3.3 70B at conversational speed and has a generous free tier — perfect for daily use. About 60 seconds.",
      "install.groq.s1.h": "Open the Groq console",
      "install.groq.s1.b": "A clean sign-in page — Google, GitHub, or email all work.",
      "install.groq.s1.cta": "Open console.groq.com/keys →",
      "install.groq.s2.h": "Sign in",
      "install.groq.s2.b": "No credit card required. The free tier covers tens of thousands of requests per day.",
      "install.groq.s3.h": "Create an API key",
      "install.groq.s3.b": "Click Create API Key, name it something like Aside, and confirm.",
      "install.groq.s4.h": "Copy the key",
      "install.groq.s4.b": "Groq shows the key once. Copy it now — you can always create another later.",
      "install.groq.s5.h": "Paste it into Aside",
      "install.groq.s5.b": "Open Aside → Settings → Groq, paste the key, save. The sidebar validates it live before storing.",
      "privacy.title": "Your keys stay in your browser",
      "privacy.body": "Aside is 100% client-side. API keys live in chrome.storage.sync (encrypted by Chrome, synced to your own Google account only). Requests go directly from your browser to the provider you chose. No telemetry, no analytics, no server in the middle.",
      "privacy.cta": "Read the full Privacy Policy",
      "faq.title": "Frequently asked",
      "faq.q1": "Is Aside free?",
      "faq.a1": "The extension is free and open source. You pay each AI provider directly for usage (or use a free tier — Groq and Gemini both offer one).",
      "faq.q2": "Where are my API keys stored?",
      "faq.a2": "In chrome.storage.sync — Chrome encrypts them and syncs them across your own Chrome instances via your Google account. They never reach any server we control (there is no server we control). Conversation history is stored locally only.",
      "faq.q6": "Can I choose which model each provider uses?",
      "faq.a6": "Yes. Each provider ships with a sensible default, and Settings → Model lets you switch — e.g. Claude Sonnet 4.5, Opus, or Haiku. There's also a Custom field to type any model id the provider supports, so you're never stuck waiting for us to add a new one.",
      "faq.q3": "Which providers are supported?",
      "faq.a3": "Anthropic Claude, OpenAI ChatGPT, Google Gemini, xAI Grok, Groq, and self-hosted Ollama. Adding more is straightforward — see the repo.",
      "faq.q4": "Which languages does it support?",
      "faq.a4": "Eight: English, Hebrew, Spanish, French, German, Chinese, Arabic, and Japanese. Both the UI and the response language are switchable, with full RTL for Hebrew and Arabic.",
      "faq.q5": "Can I run it on Firefox or Edge?",
      "faq.a5": "Edge yes (Chromium-based). Firefox isn't packaged yet — contributions welcome.",
      "footer.tagline": "Open source · MIT licensed",
      "footer.privacy": "Privacy",
      "footer.support": "Support",
      "footer.github": "GitHub",
    },
    he: {
      "nav.features": "פיצ׳רים",
      "nav.install": "התקנה",
      "nav.privacy": "פרטיות",
      "nav.github": "GitHub",
      "cta.store": "הוספה ל-Chrome",
      "cta.store_soon": "בקרוב ב-Chrome Web Store",
      "cta.source": "התקנה ידנית",
      "hero.eyebrow": "תוסף ל-Chrome",
      "hero.title_a": "כל מודלי ה-AI.",
      "hero.title_b": "סיידבר אחד.",
      "hero.sub": "Aside מאחד את Claude, ChatGPT, Gemini, Grok, Groq ו-Ollama המקומי בסיידבר אחד שעובד בכל טאב. המפתחות שלכם, ושום דבר לא יוצא מהדפדפן.",
      "hero.meta": "חינמי · קוד פתוח · עם המפתחות שלכם",
      "providers.label": "עובד עם",
      "features.title": "השוואה זריזה בין מודלים",
      "features.sub": "למי ששואל את אותה שאלה בכמה מודלים לפני שהוא בוחר תשובה.",
      "feat.1.title": "השוואה זה לצד זה",
      "feat.1.body": "הצמידו שני ספקים זה לצד זה ושלחו את אותו פרומפט לשניהם. התשובות זורמות במקביל.",
      "feat.2.title": "המפתחות שלכם, נשארים אצלכם",
      "feat.2.body": "השתמשו במפתחות ה-API שכבר יש לכם. אנחנו לא רואים, לא שומרים, ולא מעבירים אותם דרך שום שרת.",
      "feat.3.title": "היסטוריה מקומית",
      "feat.3.body": "כל שיחה נשמרת באחסון המקומי של הדפדפן. ללא חשבון, ללא ענן, ללא איסוף נתונים.",
      "feat.4.title": "תבניות פרומפט",
      "feat.4.body": "שמרו את הפרומפטים שאתם באמת חוזרים אליהם, והפעילו בלחיצה אחת.",
      "feat.5.title": "עובד בכל טאב",
      "feat.5.body": "לחצו Alt+A בכל עמוד. הסיידבר נפתח עם ההקשר של מה שאתם קוראים, ולא מפריע.",
      "feat.6.title": "שמונה שפות, וגם RTL",
      "feat.6.body": "ממשק ותשובות באנגלית, עברית, ספרדית, צרפתית, גרמנית, סינית, ערבית ויפנית. תמיכה מלאה בכתיבה מימין לשמאל.",
      "gallery.title": "הדרך הקלה להשתמש ב-AI",
      "gallery.sub": "מראה מוכר, בלי עומס ויזואלי. בנוי לחיות לצד התוכן, לא להחליף אותו.",
      "install.title": "מותקן ומוכן בשתי דקות",
      "install.sub": "שני שלבים קצרים. הראשון מתקין את התוסף, השני מביא לכם מפתח API חינמי כדי שתוכלו להשתמש בו באמת.",
      "install.aside.eyebrow": "שלב 1",
      "install.aside.title": "התקנת Aside ב-Chrome",
      "install.aside.note": "בלי build, בלי npm. פשוט להוריד ולטעון את התיקייה. כ-30 שניות.",
      "install.aside.s1.h": "הורידו את הקוד",
      "install.aside.s1.b": "קחו את קובץ ה-ZIP וחלצו אותו לכל מקום במחשב.",
      "install.aside.s1.cta": "הורדת ZIP →",
      "install.aside.s2.h": "פתחו את דף התוספים של Chrome",
      "install.aside.s2.b": "הדביקו chrome://extensions בשורת הכתובת ולחצו Enter.",
      "install.aside.s3.h": "הפעילו מצב מפתחים",
      "install.aside.s3.b": "מתג בפינה הימנית למעלה. בלעדיו Chrome לא יטען תוסף לא ארוז.",
      "install.aside.s4.h": "טענו תוסף לא ארוז",
      "install.aside.s4.b": "לחצו Load unpacked ובחרו את תיקיית Aside שחילצתם.",
      "install.aside.s5.h": "הצמידו לסרגל הכלים",
      "install.aside.s5.b": "לחצו על אייקון הפאזל בסרגל והצמידו את Aside, כדי שיהיה במרחק לחיצה.",
      "install.aside.s6.h": "הגדירו את קיצור Alt + A",
      "install.aside.s6.b": "Chrome מגדיר קיצורים אוטומטית רק לתוספים מה-Web Store, אז הגדירו אותו פעם אחת ידנית: פתחו chrome://extensions/shortcuts, מצאו את Aside, לחצו על התיבה ליד “Toggle the AI sidebar” ולחצו Alt + A. מעכשיו הוא נפתח בכל עמוד.",
      "install.groq.eyebrow": "שלב 2 · חינם",
      "install.groq.title": "מפתח API חינמי של Groq",
      "install.groq.note": "Groq מריצים את Llama 3.3 70B במהירות שיחה אמיתית, עם tier חינמי נדיב — מושלם לשימוש יומיומי. כ-60 שניות.",
      "install.groq.s1.h": "פתחו את הקונסולה של Groq",
      "install.groq.s1.b": "דף sign-in פשוט — Google, GitHub או מייל, כולם עובדים.",
      "install.groq.s1.cta": "פתיחת console.groq.com/keys →",
      "install.groq.s2.h": "התחברו",
      "install.groq.s2.b": "ללא כרטיס אשראי. ה-tier החינמי מכסה עשרות אלפי בקשות ביום.",
      "install.groq.s3.h": "צרו מפתח API",
      "install.groq.s3.b": "לחצו Create API Key, תנו לו שם (למשל Aside), ואשרו.",
      "install.groq.s4.h": "העתיקו את המפתח",
      "install.groq.s4.b": "Groq מציגים את המפתח פעם אחת בלבד. העתיקו עכשיו — תמיד אפשר ליצור עוד אחד אחר כך.",
      "install.groq.s5.h": "הדביקו ב-Aside",
      "install.groq.s5.b": "פתחו את Aside ← הגדרות ← Groq, הדביקו את המפתח, ושמרו. הסיידבר בודק את המפתח מול ה-API לפני שמירה.",
      "privacy.title": "המפתחות שלכם נשארים בדפדפן",
      "privacy.body": "Aside פועל 100% בצד הלקוח. מפתחות API נשמרים ב-chrome.storage.sync (מוצפנים על-ידי Chrome ומסונכרנים רק לחשבון Google שלכם). הבקשות נשלחות ישירות מהדפדפן אל הספק שבחרתם. ללא טלמטריה, ללא איסוף נתונים, ללא שרת באמצע.",
      "privacy.cta": "קראו את מדיניות הפרטיות המלאה",
      "faq.title": "שאלות נפוצות",
      "faq.q1": "האם Aside חינמי?",
      "faq.a1": "התוסף עצמו חינמי וקוד פתוח. על השימוש משלמים ישירות לספק ה-AI שבחרתם — או שמשתמשים במסלול החינמי שלו. ל-Groq ול-Gemini יש מסלול חינמי.",
      "faq.q2": "איפה מפתחות ה-API שלי נשמרים?",
      "faq.a2": "ב-chrome.storage.sync — Chrome מצפין ומסנכרן אותם בין הדפדפנים שלכם דרך חשבון Google. הם לא מגיעים לאף שרת שלנו, פשוט כי אין לנו שרת. היסטוריית השיחות נשמרת מקומית בלבד.",
      "faq.q6": "אפשר לבחור איזה מודל כל ספק משתמש בו?",
      "faq.a6": "כן. לכל ספק יש מודל ברירת מחדל, ובהגדרות ← מודל אפשר להחליף — למשל Claude Sonnet 4.5, Opus או Haiku. יש גם שדה Custom להקליד כל מזהה מודל שהספק תומך בו, כך שלעולם לא תהיו תקועים בהמתנה שנוסיף מודל חדש.",
      "faq.q3": "אילו ספקים נתמכים?",
      "faq.a3": "Anthropic Claude, OpenAI ChatGPT, Google Gemini, xAI Grok, Groq, ו-Ollama להרצה מקומית. קל להוסיף עוד — הקוד פתוח ב-GitHub.",
      "faq.q4": "אילו שפות נתמכות?",
      "faq.a4": "שמונה: אנגלית, עברית, ספרדית, צרפתית, גרמנית, סינית, ערבית ויפנית. הן שפת הממשק והן שפת התשובות ניתנות להחלפה, עם תמיכה מלאה ב-RTL לעברית וערבית.",
      "faq.q5": "האם זה יעבוד ב-Firefox או ב-Edge?",
      "faq.a5": "Edge כן (מבוסס Chromium). Firefox עדיין לא נארז — מוזמנים לעזור עם זה ב-GitHub.",
      "footer.tagline": "קוד פתוח · רישיון MIT",
      "footer.privacy": "פרטיות",
      "footer.support": "תמיכה",
      "footer.github": "GitHub",
    },
  };

  function detectInitial() {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || "en").toLowerCase();
    return browser.startsWith("he") ? "he" : "en";
  }

  function apply(lang) {
    const table = dict[lang] || dict.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (table[key] != null) el.textContent = table[key];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      const [attr, key] = spec.split(":");
      if (attr && key && table[key] != null) el.setAttribute(attr, table[key]);
    });

    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.textContent = lang === "he" ? "EN" : "עב";
      btn.setAttribute("aria-label", lang === "he" ? "Switch to English" : "החלף לעברית");
    });
  }

  function init() {
    const initial = detectInitial();
    apply(initial);
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cur = document.documentElement.lang === "he" ? "he" : "en";
        const next = cur === "he" ? "en" : "he";
        localStorage.setItem(STORE_KEY, next);
        apply(next);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
