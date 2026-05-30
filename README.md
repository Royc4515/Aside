<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="marketing/hero-dark.png">
  <img src="marketing/hero-light.png" alt="Aside — AI in your sidebar" width="100%"/>
</picture>

# Aside

**AI in your sidebar. On any webpage.**

Ask any AI about the page you're reading — summarize, extract, translate,
or just chat. Six providers, one keystroke, zero context-switching.

<br/>

<img src="https://img.shields.io/badge/Chrome%20Extension-MV3-4285F4?logo=googlechrome&logoColor=white" alt="Chrome MV3">&nbsp;
<img src="https://img.shields.io/badge/providers-6-d97757" alt="6 providers">&nbsp;
<img src="https://img.shields.io/badge/themes-Light%20%C2%B7%20Dark%20%C2%B7%20Auto-8b5cf6" alt="3 themes">&nbsp;
<img src="https://img.shields.io/badge/languages-EN%20%C2%B7%20HE-0ea5e9" alt="EN / HE">&nbsp;
<img src="https://img.shields.io/badge/license-MIT-22c55e" alt="MIT">

<br/><br/>

**[Why Aside](#why-aside) · [Install](#install) · [How it works](#how-it-works) · [Privacy](#privacy) · [For developers](#for-developers)**

</div>

---

## Why Aside

You're reading something — an article, a research paper, an API doc, a long
email thread — and you want an AI's take *now*, without losing your place.

Aside opens a sidebar **right where you are**. It reads the page so you
don't have to paste anything. You pick the model. You stay on the page.

<br/>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="marketing/features-dark.png">
    <img src="marketing/features-light.png" alt="Context-aware AI sidebar for Chrome" width="92%"/>
  </picture>
</div>

<br/>

- **One keystroke.** `Alt + A` on any page. The sidebar slides in, already aware of what you're looking at.
- **Six AI providers.** Claude, Gemini, GPT-4o, Grok, Groq, and local Ollama — switch in a click, no separate logins.
- **Reads the page for you.** Summarize, extract key points, translate, find on page, or run a custom prompt. No copy-paste.
- **Streaming answers.** Tokens arrive as the model thinks — cancel any time.
- **Your theme. Your language.** Light, dark, or auto. English or Hebrew, with full RTL.
- **History that follows the page.** Conversations are saved per-site so you can pick up where you left off.

---

## Providers

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="marketing/providers-dark.png">
    <img src="marketing/providers-light.png" alt="Six providers, one sidebar" width="90%"/>
  </picture>
</div>

| Provider | What you need | Default model |
|---|---|---|
| **Claude** (Anthropic) | API key | `claude-sonnet-4-6` |
| **Gemini** (Google) | API key | `gemini-2.0-flash` |
| **OpenAI** | API key | `gpt-4o-mini` |
| **Grok** (xAI) | API key | `grok-3-mini` |
| **Groq** | API key | `llama-3.3-70b-versatile` |
| **Ollama** | Nothing — runs on your machine | `llama3.2` |

Add a key once in **Settings → Provider**. Aside validates it live against the
real API before saving. Switch providers any time from the sidebar header.

---

## Install

> Aside is open source and not yet on the Chrome Web Store. Install it as an
> unpacked extension — about **30 seconds**, no build, no npm, no account.

### Step 1 · Install the extension

1. **Download the code.** Grab the [latest ZIP](https://github.com/Royc4515/Aside/archive/refs/heads/main.zip) and unzip it anywhere, or `git clone https://github.com/Royc4515/Aside.git`.
2. **Open Chrome extensions.** Paste `chrome://extensions` into the address bar and press <kbd>Enter</kbd>.
3. **Turn on Developer mode.** Top-right toggle. Without it, Chrome won't load an unpacked extension.
4. **Load unpacked.** Click *Load unpacked* and select the unzipped `Aside` folder.
5. **Pin it to the toolbar.** Click the puzzle icon in the toolbar and pin Aside so it's one click away.
6. **Set the `Alt + A` shortcut.** Chrome only auto-assigns shortcuts for Web Store extensions, so set it once by hand: open `chrome://extensions/shortcuts`, find **Aside**, click the box next to *Toggle the AI sidebar*, and press <kbd>Alt</kbd> + <kbd>A</kbd>. (You can also just open it from the toolbar icon or the right-click menu.)

### Step 2 · Get a free Groq API key (recommended)

> Groq runs Llama 3.3 70B at conversational speed and has a generous free tier — perfect for daily use. About **60 seconds**.

1. **Open the Groq console.** [console.groq.com/keys](https://console.groq.com/keys) — a clean sign-in page; Google, GitHub, or email all work.
2. **Sign in.** No credit card required. The free tier covers tens of thousands of requests per day.
3. **Create an API key.** Click *Create API Key*, name it something like `Aside`, and confirm.
4. **Copy the key.** Groq shows it once. Copy it now — you can always create another later.
5. **Paste it into Aside.** Open Aside → *Settings* → *Groq*, paste the key, save. The sidebar validates it live before storing.

Prefer a different provider? Same flow with Anthropic Claude, OpenAI, Google Gemini, xAI Grok, or self-hosted Ollama. See [Providers](#providers) for what each one needs.

**Want a slim install zip?** Run `pwsh ./scripts/build-zip.ps1` (or `bash ./scripts/build-zip.sh`) — it produces `dist/aside-<version>.zip` containing only the runtime files, ready to share.

---

## How it works

<div align="center">
  <img src="marketing/dark-light.png" alt="Light and dark themes" width="92%"/>
</div>

<br/>

**Press `Alt + A`** and a slim sidebar appears on the right of the page (or
left — your choice). It already knows what's on the page, what language
the page is in, and what text you have selected.

**Tap a chip** — *Summarize*, *Key points*, *Translate*, *Explain*, *Find on page* —
or type your own prompt. Answers stream in token-by-token. Cancel any
time. Hit again on a different page and you're in a fresh conversation;
the history panel keeps the old one safe.

**Need a different provider?** The header dropdown switches between Claude,
Gemini, GPT-4o, Grok, Groq, and Ollama with one click. Each remembers its
own model selection.

---

## Privacy

- **Your API keys live on your machine.** Aside stores them in Chrome's encrypted local storage and sends them only to the provider you chose, over HTTPS. No analytics, no telemetry, no proxy server — your requests go straight from your browser to OpenAI / Anthropic / Google / xAI / Groq / your local Ollama.
- **Page content is sent only on your prompt.** When you press *Summarize* (or any action that needs the page), Aside grabs the readable body of the current tab, trims it to 12 000 characters, and includes it in **that one request**. Nothing is uploaded in the background.
- **Conversation history stays local.** Threads are saved to Chrome's `storage.local` on your device. Nothing leaves your browser until you ask the model another question.
- **Ollama mode is fully offline.** No key, no network call — your prompt and the page text go to the model running on your own computer.

---

## Keyboard shortcuts

| Shortcut | What it does |
|---|---|
| **`Alt + A`** | Toggle the sidebar on any page |
| `Esc` (inside sidebar) | Close the sidebar |
| `Ctrl/Cmd + Enter` | Send your prompt |
| Right-click → *Open AI Sidebar* | Open with selected text pre-filled |

---

## For developers

Aside is a vanilla MV3 Chrome extension — no build step, no bundler, no
framework. The full architecture, provider class hierarchy, and runtime
flow are documented in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

```
background.js       MV3 service worker (Alt+A, context menu, API-key validation)
content/            page-injected script + iframe host
sidebar/            main chat UI (HTML/CSS/JS, no framework)
options/            settings page (API keys, model picker, language)
popup/              toolbar popup
providers/          BaseProvider + 6 concrete providers + factory
shared/             provider monograms, helpers
_locales/{en,he}/   chrome.i18n message catalogs
```

Contributions welcome — open an issue or PR.

---

<div align="center">
  <sub>Built with care. MIT licensed. © 2026 Roy Carmelli.</sub>
</div>
