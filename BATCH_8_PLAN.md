# Aside — Feature Improvement Plan (Batch 8)

Phased plan to extend the extension with power-user features, multimodal capabilities, and local data management. Each batch is a self-contained session.

Status legend: ☐ pending · ◐ in progress · ☑ shipped

---

## 🎯 Batch 8.1 — Export & Data Management ☐
**Effort:** ~2 hrs · **Scope:** Storage reading, Blob creation, Clipboard API
**Goal:** Give users ownership of their data and easy ways to share chats.

| # | Item | Files |
|---|---|---|
| 1 | **Chat Export (Header)** — Add a subtle "Share/Export" icon next to Compare in the header. Click opens a minimal dropdown: "Copy as TXT", "Copy as MD", "Download TXT", "Download MD". | `sidebar/sidebar.html`, `sidebar/sidebar.css`, `sidebar/sidebar.js` |
| 2 | **Local Backup & Restore** — Add a "Data Management" section in Settings. Two buttons: "Export All Chats (JSON)" and "Import Chats". Validates JSON structure on import and merges/overwrites gracefully. | `options/options.html`, `options/options.css`, `options/options.js`, `sidebar/history.js` |

**Acceptance:** Can download a single chat as `.md` and the entire history as `.json`, then restore it successfully.

---

## 🎯 Batch 8.2 — Custom Provider Endpoints ☐
**Effort:** ~1.5 hrs · **Scope:** Options UI, ProviderFactory extension
**Goal:** Allow developers/enterprises to route traffic to local models (LM Studio) or private/corporate endpoints.

| # | Item | Files |
|---|---|---|
| 3 | **Custom Provider UI** — Add "Custom (OpenAI Compatible)" to the provider grid in Settings. When selected, shows fields for: `Base URL`, `API Key`, and `Model Name`. | `options/options.html`, `options/options.js`, `sidebar/translations.js` |
| 4 | **Factory Integration** — Pass custom configuration to `OpenAICompatProvider` via `ProviderFactory`. | `providers/provider-factory.js`, `providers/base-provider.js` (if needed) |

**Acceptance:** Pointing the Custom Provider to a local LM Studio server (`http://localhost:1234/v1`) successfully streams a response.

---

## 🎯 Batch 8.3 — Voice & Audio (Web APIs) ☐
**Effort:** ~2 hrs · **Scope:** Web Speech API integration
**Goal:** Hands-free interaction using native browser capabilities (No external libs).

| # | Item | Files |
|---|---|---|
| 5 | **Text-to-Speech (TTS)** — Add a small "Play" icon to assistant turns in the chat. Click uses `window.speechSynthesis` to read the response. Click again to pause/stop. | `sidebar/sidebar.js` (turn HTML generation), `sidebar/sidebar.css` |
| 6 | **Speech-to-Text (STT)** — Add a "Mic" icon inside the Composer toolbar. Click starts `webkitSpeechRecognition`. Transcribed text fills the `textarea` live, allowing user to edit before hitting Enter. | `sidebar/sidebar.html`, `sidebar/sidebar.js` |

**Acceptance:** Can dictate a prompt via microphone, send it, and listen to the AI's response via the play button.

---

## 🎯 Batch 8.4 — Vision Basics (Multimodal) ☐
**Effort:** ~3 hrs · **Scope:** Drag & Drop, File API, UI additions
**Goal:** Let the AI "see" images from the page or user's clipboard.

| # | Item | Files |
|---|---|---|
| 7 | **Image Attachment Chip** — Allow Drag & Drop into the composer, Paste (Ctrl+V), or file selection. Image shows up as a small thumbnail chip *above* the input area (with a small 'X' to remove). | `sidebar/sidebar.html`, `sidebar/sidebar.css`, `sidebar/sidebar.js` |
| 8 | **Provider Vision Support** — Convert the uploaded image to Base64 and append it to the standard message array format for providers that support Vision (OpenAI, Claude, Gemini). | `providers/...` (update logic to accept image content block) |
| 9 | **Page Image Capture (Optional extra)** — Add an action to right-click images on the page and send them directly to the sidebar context. | `background.js`, `content/content.js` |

**Acceptance:** Drag an image into the sidebar, ask "What's in this image?", and get a correct response from Claude/GPT-4o.

---

## 🎯 Batch 8.5 — Local RAG for Long Contexts ☐
**Effort:** ~4+ hrs · **Scope:** Transformers.js CDN, text chunking, vector math
**Goal:** Smartly answer questions on massive pages (50k+ chars) without hitting token limits, keeping all processing local.

| # | Item | Files |
|---|---|---|
| 10 | **Transformers.js Integration** — Load `Transformers.js` via jsDelivr CDN inside a background worker or offscreen document. Download a lightweight embedding model (e.g., `all-MiniLM-L6-v2`) on first use. | `background.js` or `rag-worker.js` (new) |
| 11 | **Chunking & Embeddings** — When page context is active and exceeds limits, split text into chunks (e.g., ~500 chars). Generate embeddings for chunks and the user's prompt. | `rag-worker.js` |
| 12 | **Vector Search & Injection** — Calculate cosine similarity locally. Pick the top N most relevant chunks and inject them as the "Page Context" instead of the whole page. | `sidebar/sidebar.js`, `rag-worker.js` |

**Acceptance:** Open a 20,000-word Wikipedia page, ask a highly specific question about paragraph 40, and get a fast, accurate answer based purely on local chunk matching.
