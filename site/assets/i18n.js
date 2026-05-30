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
      "privacy.title": "Your keys stay in your browser",
      "privacy.body": "Aside is 100% client-side. API keys live in chrome.storage.sync (encrypted by Chrome, synced to your own Google account only). Requests go directly from your browser to the provider you chose. No telemetry, no analytics, no server in the middle.",
      "privacy.cta": "Read the full Privacy Policy",
      "faq.title": "Frequently asked",
      "faq.q1": "Is Aside free?",
      "faq.a1": "The extension is free and open source. You pay each AI provider directly for usage (or use a free tier — Groq and Gemini both offer one).",
      "faq.q2": "Where are my API keys stored?",
      "faq.a2": "In chrome.storage.sync — Chrome encrypts them and syncs them across your own Chrome instances via your Google account. They never reach any server we control (there is no server we control). Conversation history is stored locally only.",
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
      "privacy.title": "המפתחות שלכם נשארים בדפדפן",
      "privacy.body": "Aside פועל 100% בצד הלקוח. מפתחות API נשמרים ב-chrome.storage.sync (מוצפנים על-ידי Chrome ומסונכרנים רק לחשבון Google שלכם). הבקשות נשלחות ישירות מהדפדפן אל הספק שבחרתם. ללא טלמטריה, ללא איסוף נתונים, ללא שרת באמצע.",
      "privacy.cta": "קראו את מדיניות הפרטיות המלאה",
      "faq.title": "שאלות נפוצות",
      "faq.q1": "האם Aside חינמי?",
      "faq.a1": "התוסף עצמו חינמי וקוד פתוח. על השימוש משלמים ישירות לספק ה-AI שבחרתם — או שמשתמשים במסלול החינמי שלו. ל-Groq ול-Gemini יש מסלול חינמי.",
      "faq.q2": "איפה מפתחות ה-API שלי נשמרים?",
      "faq.a2": "ב-chrome.storage.sync — Chrome מצפין ומסנכרן אותם בין הדפדפנים שלכם דרך חשבון Google. הם לא מגיעים לאף שרת שלנו, פשוט כי אין לנו שרת. היסטוריית השיחות נשמרת מקומית בלבד.",
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
