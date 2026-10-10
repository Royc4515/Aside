# Chrome Web Store assets

Everything the Chrome Web Store listing needs, ready to upload.

| File | Store field | Size |
|---|---|---|
| `screenshot-1-summarize.png` | Screenshot 1 | 1280x800 |
| `screenshot-2-hebrew-rtl.png` | Screenshot 2 | 1280x800 |
| `screenshot-3-compare.png` | Screenshot 3 | 1280x800 |
| `screenshot-4-providers.png` | Screenshot 4 | 1280x800 |
| `screenshot-5-tools.png` | Screenshot 5 | 1280x800 |
| `small-tile.png` | Small promo tile (required) | 440x280 |
| `marquee.png` | Marquee promo tile (optional) | 1400x560 |
| `../../icons/icon-128.png` | Store icon | 128x128 |
| `aside.zip` from the [latest release](https://github.com/Royc4515/Aside/releases/latest) | Package | `manifest.json` at the zip root |

The screenshots are real captures of the unpacked extension. API calls were
answered by local mocks (no key, no network), so the answer text is scripted.

## Re-rendering

```bash
# Needs playwright resolvable (e.g. NODE_PATH) and Pillow.
CHROME=/path/to/chrome node marketing/cws/capture-cws.mjs out    # out/<name>-2x.png
python3 -c "
from PIL import Image
for n in ['1-summarize','2-hebrew-rtl','3-compare','4-providers','5-tools']:
    Image.open(f'out/{n}-2x.png').convert('RGB').resize((1280,800), Image.LANCZOS).save(f'marketing/cws/screenshot-{n}.png', optimize=True)
Image.open('out/1-summarize-2x.png').crop((1620,0,2560,1600)).save('marketing/cws/sidebar-crop.png')"
CHROME=/path/to/chrome node marketing/cws/render-promo.mjs       # small-tile.png, marquee.png
```

## Listing text

The store name and short description come from `ext_name` and
`ext_description` in `_locales/<lang>/messages.json`; they can't be typed in
the dashboard. Change them there (and release) if you want different ones.

**Category:** Productivity > Tools

### Description (English)

```
Aside opens an AI sidebar on any webpage. It reads the page you are on, so you can summarize, translate, extract data or chat about it without copy-pasting or leaving the tab.

BRING YOUR OWN KEY
Use the API keys you already have for Claude (Anthropic), OpenAI, Gemini (Google), Grok (xAI) or Groq, or run a local model with Ollama and no key at all. Keys are stored only in your browser's local storage and are sent only to the provider you pick. Groq and Gemini offer free API tiers.

WHAT YOU CAN DO
- Summarize, extract key data, translate, rewrite or find anything on the page
- Ask about selected text from the right-click menu
- One-tap prompts: bullet points, action items, ELI5, counter-arguments and more
- Compare mode: send one prompt to two providers and keep the better answer
- Pick any model per provider, or type a custom model id
- Streaming answers you can cancel, with history saved per site

LANGUAGES
English and Hebrew interface with full right-to-left support. Replies in English, Hebrew, Spanish, French, German, Chinese, Arabic or Japanese, by default in the page's language.

PRIVACY
No account, no server in the middle, no analytics, no telemetry. Page text is sent only with a prompt you send, and you can switch page context off with one click.

Open source (MIT): https://github.com/Royc4515/Aside
```

### Description (Hebrew)

```
Aside פותח סיידבר AI בכל אתר. הוא קורא את העמוד שאתם נמצאים בו, כך שאפשר לסכם, לתרגם, לחלץ נתונים או לשוחח עליו, בלי להעתיק ולהדביק ובלי לעזוב את הטאב.

המפתח שלכם (BYOK)
השתמשו במפתחות ה-API שכבר יש לכם ל-Claude (Anthropic), OpenAI, Gemini (Google), Grok (xAI) או Groq, או הריצו מודל מקומי עם Ollama בלי מפתח בכלל. המפתחות נשמרים רק באחסון המקומי של הדפדפן ונשלחים רק לספק שבחרתם. ל-Groq ול-Gemini יש מסלול API חינמי.

מה אפשר לעשות
- לסכם, לחלץ נתונים, לתרגם, לנסח מחדש או למצוא כל דבר בעמוד
- לשאול על טקסט מסומן מתפריט הקליק הימני
- פרומפטים בלחיצה אחת: נקודות עיקריות, משימות לביצוע, הסבר פשוט, טיעוני נגד ועוד
- מצב השוואה: אותה שאלה לשני ספקים, ושומרים את התשובה הטובה יותר
- בחירת מודל לכל ספק, או הקלדת מזהה מודל מותאם
- תשובות זורמות שאפשר לעצור, והיסטוריה שנשמרת לפי אתר

שפות
ממשק בעברית ובאנגלית עם תמיכה מלאה בימין לשמאל (RTL). תשובות בעברית, אנגלית, ספרדית, צרפתית, גרמנית, סינית, ערבית או יפנית, וכברירת מחדל בשפת העמוד.

פרטיות
בלי חשבון, בלי שרת באמצע, בלי איסוף נתונים ובלי טלמטריה. טקסט העמוד נשלח רק יחד עם שאלה ששלחתם, ואפשר לכבות את הקשר העמוד בלחיצה אחת.

קוד פתוח (MIT): https://github.com/Royc4515/Aside
```

## Privacy practices tab

- **Single purpose:** Lets the user ask an AI model of their choice about the webpage they are viewing, in a sidebar.
- **activeTab, scripting, tabs, host permission `<all_urls>`:** inject the sidebar into the page the user is on and read its text when the user sends a prompt.
- **storage:** keep the user's API keys, settings and conversation history on the device.
- **contextMenus:** "Explain selection" and "Summarize page" in the right-click menu.
- **Remote code:** No. All code ships in the package; the extension only sends requests to the AI provider's API.
- **Data usage:** tick "Website content" (sent only to the AI provider the user chose, at the user's request). Certify that data is not sold, not used for unrelated purposes and not used for creditworthiness.
- **Privacy policy URL:** https://royc4515.github.io/Aside/privacy.html
