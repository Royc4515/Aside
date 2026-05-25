<div align="center">

# Aside — AI Sidebar

**Chrome extension that injects a context-aware AI assistant sidebar into any webpage,
routing prompts to one of six AI providers with streaming responses, conversation history, and bilingual UI (EN / HE).**

<br>

<img src="https://img.shields.io/badge/Chrome%20Extension-MV3-4285F4?logo=googlechrome&logoColor=white" alt="Chrome MV3">&nbsp;
<img src="https://img.shields.io/badge/providers-6-8b5cf6" alt="6 providers">&nbsp;
<img src="https://img.shields.io/badge/i18n-EN%20%C2%B7%20HE-0ea5e9" alt="EN / HE">&nbsp;
<img src="https://img.shields.io/badge/build-none-22c55e" alt="no build step">&nbsp;
<img src="https://img.shields.io/badge/version-1.0.0-64748b" alt="v1.0.0">

</div>

<br>

**[Features](#features) · [Architecture](#architecture) · [Providers](#providers) · [Install](#install)**

---

## Features

### Provider System

- **Six AI providers** — Claude, Gemini, OpenAI, Grok, Groq, and Ollama; selected at runtime via `ProviderFactory`
- **Shared OpenAI-compatible base** — `OpenAICompatProvider` implements the chat-completions wire format once; `OpenAIProvider`, `GrokProvider`, and `GroqProvider` are thin subclasses that set `url` and `model`
- **Uniform message-array API** — every provider takes `(messages[], systemPrompt)`; the sidebar never branches on which class is running

### Conversation & UI

- **Streaming responses** — token-by-token via SSE (`_streamSSE`) for OpenAI-style providers and NDJSON for Ollama; cancellable from the UI
- **Multi-turn conversation history** — threads persisted to `chrome.storage.local` (5MB), with an in-sidebar history panel, search, per-page filter, and restore
- **Quick page actions** — one-tap chips for summarize / explain / key-points / translate / find on page, plus a curated prompt-template menu
- **Bilingual UI (EN / HE)** — `translations.js` table + runtime `i18n.js` helper; UI flips RTL when Hebrew is active. Includes page-language auto-detection via `PAGE_LANG` message
- **Per-provider model picker** — Settings page lets each provider keep its own selected model

### Extension Platform

- **MV3 service worker** — `background.js` handles the `Alt+A` keyboard command, context-menu registration, and live `VALIDATE_KEY` requests with a 10-second `Promise.race` timeout
- **Cross-origin `postMessage` security** — sidebar iframe validates `event.source === window.parent` before accepting any message; user-supplied text is always set via `textContent`, never `innerHTML`
- **Page content extraction** — `extractPageContent()` walks semantic selectors (`article`, `main`, `[role="main"]`, `.article-body`…), strips nav/chrome nodes, and truncates at 12,000 chars
- **Live API-key validation** — Settings sends `VALIDATE_KEY` to the service worker, which instantiates the provider and calls `validate()` against the real API
- **Custom Markdown renderer** — hand-rolled `renderMarkdown()` covers headings, bold/italic, code blocks, tables, and lists; output is sanitized by a DOM-based allowlist (`sanitizeHTML()`) before insertion

---

## Architecture

### Class Hierarchy

```mermaid
classDiagram
    class BaseProvider {
        +buildSystemPrompt()
        +complete(messages, systemPrompt)
        +completeStream(messages, systemPrompt, onChunk)
        +validate()
        #_streamSSE()
        #_fetchJson()
    }
    class OpenAICompatProvider {
        +complete()
        +completeStream()
    }
    BaseProvider <|-- OpenAICompatProvider
    BaseProvider <|-- ClaudeProvider
    BaseProvider <|-- GeminiProvider
    BaseProvider <|-- OllamaProvider
    OpenAICompatProvider <|-- OpenAIProvider
    OpenAICompatProvider <|-- GrokProvider
    OpenAICompatProvider <|-- GroqProvider
```

### Runtime Flow

```mermaid
flowchart LR
    A["Alt+A\nor Context Menu"] --> SW["Service Worker\n(background.js)"]
    SW -->|"chrome.tabs\n.sendMessage"| CS["content.js"]
    CS -->|"creates iframe"| SB["sidebar.js"]
    SB <-->|"postMessage\nPAGE_CONTENT\nSELECTED_TEXT\nPAGE_LANG"| CS
    SB <-->|"chrome.storage\n.local"| H["history.js\n(threads)"]
    SB --> PF["ProviderFactory\n.get()"]
    PF --> PR["Provider"]
    PR -->|"fetch + SSE / NDJSON"| API["AI API"]
    API -.->|"token stream"| PR
    PR -.->|"onChunk"| SB
```

`ProviderFactory.get(name, apiKeys, selectedModels)` applies the **Strategy pattern** — the sidebar calls `provider.completeStream(messages, systemPrompt, onChunk)` with no knowledge of which class is running. `OpenAIProvider`, `GrokProvider`, and `GroqProvider` reuse the entire `OpenAICompatProvider` implementation by only declaring their endpoint URL and default model. Switching providers requires a single `chrome.storage.sync` write.

### Project Layout

```
background.js              ← MV3 service worker
manifest.json              ← MV3 manifest (Alt+A command, context menu, options_ui)
_locales/{en,he}/          ← chrome.i18n message catalogs
content/                   ← page-injected content script + iframe host CSS
sidebar/
  sidebar.{html,css,js}    ← main chat UI (Variant C)
  history.js               ← thread storage layer
  i18n.js + translations.js← runtime UI translation
  action-config.js         ← page-action chip definitions
  prompt-templates.js      ← one-tap prompt presets
options/                   ← settings page (API keys, model picker, language)
popup/                     ← toolbar popup
providers/                 ← BaseProvider + 6 concrete providers + factory
shared/provider-marks.js   ← shared SVG provider monograms
```

---

## Providers

| Provider | Default model | Additional models |
|---|---|---|
| **Claude** (Anthropic) | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` · `claude-opus-4-7` |
| **Gemini** (Google) | `gemini-2.0-flash` | `gemini-1.5-flash` · `gemini-1.5-pro` · `gemini-2.5-pro` |
| **OpenAI** | `gpt-4o-mini` | `gpt-4o` · `o4-mini` |
| **Grok** (xAI) † | `grok-3-mini` | `grok-3` |
| **Groq** † | `llama-3.3-70b-versatile` | `llama-3.1-8b-instant` · `gemma2-9b-it` |
| **Ollama** (local) | `llama3.2` | any locally pulled model |

<sup>† Grok, Groq, and OpenAI all extend `OpenAICompatProvider` — the chat-completions wire format is shared in one place.</sup>

---

## Install

1. Clone or download this repository
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `ai-sidebar` folder
5. Click the extension's **Details → Extension options** to add API keys (or use the toolbar popup)
6. Open any page and press **Alt + A** (or right-click → *Open AI Sidebar*)

> [!NOTE]
> No build step required — plain HTML, CSS, and JS. Ollama runs locally with no key; all other providers need an API key entered in the options page.
