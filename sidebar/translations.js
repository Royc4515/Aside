// Runtime translation table — supports switching UI language without reloading.
// Add new locales by adding a key matching a normalised BCP-47 code.

const TRANSLATIONS = {
  en: {
    // ── static (data-i18n) ────────────────────────────────────────────────
    onboarding_title: 'Set up your AI',
    onboarding_sub:   'Pick a provider (Claude, Gemini, Groq, etc.) and add your API key. Keys stay on your device.',
    onboarding_cta:   'Open Settings',
    tab_chat:         'Chat',
    tab_tools:        'Tools',
    hero_title:       'How can I help with this page?',
    hero_sub:         'Summarize, extract, translate, or ask anything. Page context is included automatically.',
    selected_label:   'Selected text',
    from_page:        'From page',
    error_title:      'Something went wrong',
    retry:            'Try again',
    tools_page:       'Page actions',
    tools_selection:  'Selection actions',
    composer_placeholder: 'Ask anything about this page…',
    foot_note:        'Aside can make mistakes. Check important info.',

    // ── hero suggestions ──────────────────────────────────────────────────
    hero_summarize:   'Summarize this page',
    hero_extract:     'Extract key points & data',
    hero_translate:   'Translate this page',

    // ── errors & placeholders ─────────────────────────────────────────────
    error_no_page:    'Could not read this page.',
    error_select_text:'Select some text first.',
    error_select_msg: 'Select a message first.',
    find_placeholder: 'What should I find on this page?',

    // ── action result labels (shown in assistant turn header) ─────────────
    action_summarize: 'Summary',
    action_explain:   'Explanation',
    action_ask:       'Answer',
    action_reply:     'Reply suggestions',
    action_extract:   'Extracted data',
    action_translate: 'Translation',
    action_rewrite:   'Rewrite',
    action_find:      'Found on page',

    // ── tool cards ────────────────────────────────────────────────────────
    tool_summarize:           'Summarize',
    tool_summarize_sub:       'Smart digest of the page',
    tool_extract:             'Extract data',
    tool_extract_sub:         'Tables, lists, facts',
    tool_find:                'Find on page',
    tool_find_sub:            'Search & quote sections',
    tool_translate_page:      'Translate',
    tool_translate_page_sub:  'Match your language',
    tool_explain:             'Explain',
    tool_explain_sub:         'Clear explanation',
    tool_reply:               'Reply',
    tool_reply_sub:           '3 reply suggestions',
    tool_translate:           'Translate',
    tool_translate_sub:       'Translate selection',
    tool_rewrite:             'Rewrite',
    tool_rewrite_sub:         'Improve clarity',

    // ── cmd bar ───────────────────────────────────────────────────────────
    cmd_summarize:      'Summarize',
    cmd_extract:        'Extract',
    cmd_translate_page: 'Translate',
    cmd_rewrite_page:   'Rewrite',
    cmd_find:           'Find',

    // ── pickers ───────────────────────────────────────────────────────────
    picker_switch_model:  'Switch model',
    picker_response_lang: 'Response language',
    picker_lang_auto:     'detect from page',
  },

  he: {
    // ── static ────────────────────────────────────────────────────────────
    onboarding_title: 'התחילו את ה-AI שלכם',
    onboarding_sub:   'בחרו ספק (Claude, Gemini, Groq וכו׳) והוסיפו מפתח API. המפתחות נשמרים אצלכם.',
    onboarding_cta:   'פתחו הגדרות',
    tab_chat:         'צ׳אט',
    tab_tools:        'כלים',
    hero_title:       'איך אפשר לעזור עם העמוד הזה?',
    hero_sub:         'סכמו, חלצו, תרגמו, או שאלו כל דבר. תוכן העמוד נכלל אוטומטית.',
    selected_label:   'טקסט נבחר',
    from_page:        'מהעמוד',
    error_title:      'משהו השתבש',
    retry:            'נסו שוב',
    tools_page:       'פעולות עמוד',
    tools_selection:  'פעולות על בחירה',
    composer_placeholder: 'שאלו כל דבר על העמוד הזה…',
    foot_note:        'Aside עלול לטעות. בדקו מידע חשוב.',

    // ── hero suggestions ──────────────────────────────────────────────────
    hero_summarize:   'סכמו את העמוד',
    hero_extract:     'חלצו נקודות מפתח ונתונים',
    hero_translate:   'תרגמו את העמוד',

    // ── errors & placeholders ─────────────────────────────────────────────
    error_no_page:    'לא ניתן לקרוא את העמוד.',
    error_select_text:'בחרו טקסט קודם.',
    error_select_msg: 'בחרו הודעה קודם.',
    find_placeholder: 'מה לחפש בעמוד הזה?',

    // ── action result labels ──────────────────────────────────────────────
    action_summarize: 'סיכום',
    action_explain:   'הסבר',
    action_ask:       'תשובה',
    action_reply:     'הצעות תגובה',
    action_extract:   'נתונים שחולצו',
    action_translate: 'תרגום',
    action_rewrite:   'שכתוב',
    action_find:      'נמצא בעמוד',

    // ── tool cards ────────────────────────────────────────────────────────
    tool_summarize:           'סיכום',
    tool_summarize_sub:       'תקציר חכם של העמוד',
    tool_extract:             'חילוץ נתונים',
    tool_extract_sub:         'טבלאות, רשימות, עובדות',
    tool_find:                'חיפוש בעמוד',
    tool_find_sub:            'חיפוש וציטוט קטעים',
    tool_translate_page:      'תרגום',
    tool_translate_page_sub:  'התאמה לשפה שלכם',
    tool_explain:             'הסבר',
    tool_explain_sub:         'הסבר ברור',
    tool_reply:               'תגובה',
    tool_reply_sub:           '3 הצעות תגובה',
    tool_translate:           'תרגום',
    tool_translate_sub:       'תרגמו את הבחירה',
    tool_rewrite:             'שכתוב',
    tool_rewrite_sub:         'שיפור ניסוח',

    // ── cmd bar ───────────────────────────────────────────────────────────
    cmd_summarize:      'סיכום',
    cmd_extract:        'חילוץ',
    cmd_translate_page: 'תרגום',
    cmd_rewrite_page:   'שכתוב',
    cmd_find:           'חיפוש',

    // ── pickers ───────────────────────────────────────────────────────────
    picker_switch_model:  'החלפת מודל',
    picker_response_lang: 'שפת תגובה',
    picker_lang_auto:     'זיהוי אוטומטי',
  },
};

let _uiLang = 'en';

function setUILanguage(lang) {
  _uiLang = TRANSLATIONS[lang] ? lang : 'en';
}

function t(key) {
  return TRANSLATIONS[_uiLang]?.[key] ?? TRANSLATIONS.en[key] ?? '';
}
