<div align="center">

# AI Sidebar

### Aside — your AI co-reader for any webpage

**A Chrome extension that adds an AI assistant to every page you visit.  
Summarize, translate, extract data, or just ask anything — the page context is included automatically.**

<br>

<img src="https://img.shields.io/badge/Chrome%20Extension-MV3-4285F4?logo=googlechrome&logoColor=white" alt="Chrome MV3">&nbsp;
<img src="https://img.shields.io/badge/providers-6-8b5cf6" alt="6 providers">&nbsp;
<img src="https://img.shields.io/badge/languages-EN%20%C2%B7%20HE-f59e0b" alt="EN + HE UI">&nbsp;
<img src="https://img.shields.io/badge/build-none-22c55e" alt="no build step">

</div>

<br>

**[What it does](#what-it-does) · [Install](#install) · [Using Aside](#using-aside) · [Providers & keys](#providers--keys) · [Privacy](#privacy)**

---

## What it does

Open any webpage, hit **Alt+A**, and a sidebar slides in. From there you can:

- **Summarize** the page into clean bullets
- **Extract** tables, lists, facts, contact info — whatever structured data is on the page
- **Translate** the whole page or just a selection
- **Find** specific information and get it quoted back with context
- **Explain** highlighted text in plain language
- **Reply** to an email or message with three suggested drafts
- **Rewrite** anything for clarity, tone, or length
- **Ask anything** — the visible page content is sent along automatically

The sidebar streams responses token-by-token, keeps your chat history per tab, and never blocks the page underneath.

---

## Install

1. Clone or download this repository
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked** and pick the `ai-sidebar` folder
5. Click the toolbar icon → **Settings** → paste an API key for at least one provider

> No build step. Plain HTML, CSS, and JS.

---

## Using Aside

### Open and close
- **Alt+A** toggles the sidebar on the current tab
- Or click the extension icon, or right-click anywhere → *Open AI Sidebar*

> If Alt+A doesn't work, another extension probably grabbed it. Re-bind at `chrome://extensions/shortcuts`.

### Quick actions
- **Tools tab** — one-click cards for Summarize, Extract, Find, Translate, Explain, Reply, Rewrite
- **Selection actions** — highlight text on the page first, then use the Selection cards (Explain, Translate, Rewrite, Reply)
- **Composer** — type any question; the page content is attached automatically

### Language

Aside auto-detects the page language from `<html lang>` and matches the sidebar's UI and responses to it.

- **Globe icon** in the header → pick **Auto** or a specific language
- Eight supported response languages: English, Hebrew, Spanish, French, German, Chinese, Arabic, Japanese
- The sidebar UI itself currently switches between **English** and **Hebrew** (with full RTL layout for Hebrew)

### Model switching
Click the model name in the composer area to switch providers or models on the fly. Your last choice is remembered per provider.

---

## Providers & keys

Aside supports six AI providers. You only need a key for the ones you actually use.

| Provider | Default model | Where to get a key |
|---|---|---|
| **Claude** (Anthropic) | `claude-sonnet-4-6` | [console.anthropic.com](https://console.anthropic.com/) |
| **Gemini** (Google) | `gemini-2.0-flash` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **OpenAI** | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Grok** (xAI) | `grok-3-mini` | [console.x.ai](https://console.x.ai/) |
| **Groq** | `llama-3.3-70b-versatile` | [console.groq.com](https://console.groq.com/keys) |
| **Ollama** (local) | `llama3.2` | runs locally — no key needed |

Keys are validated live against each provider's API when you save them, so you'll know immediately if a key is bad.

---

## Privacy

- **Keys stay on your device** — stored in `chrome.storage.sync`, never sent anywhere except the provider you're calling
- **Page content goes only to your chosen provider** — Aside has no backend of its own
- **No telemetry, no analytics, no tracking**

The extension requests `<all_urls>` host permission because it needs to read page content on whatever site you're on. It only does that when you actually open the sidebar.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| **Alt+A** | Toggle sidebar |
| **Enter** | Send message |
| **Shift+Enter** | New line in composer |
| **Esc** | Close sidebar |

---

<div align="center">
<sub>Aside can make mistakes. Check important info.</sub>
</div>
