# SEO / GEO report - Aside landing page and README

Date: 2026-10-10. Goal: get https://royc4515.github.io/Aside/ and the repo README to show up on Google, on Bing and in AI answers for searches like "AI sidebar Chrome extension", "BYOK AI extension", "AI sidebar Hebrew RTL".

Bottom line: the technical base was already decent (Lighthouse SEO was already 100). The real gaps were in content and structure: Hebrew had no URL of its own, the English text that crawlers see differed from what users see, the share image was outdated, and the page had no paragraph that defines the product in a citable way. All of that is fixed in this PR. The rest (Search Console, Bing, Web Store, mentions) is manual and listed below.

---

## 1. Audit (before the change)

| Item | State on the live site | Note |
|---|---|---|
| `<title>` | "Aside [em dash] Every AI model, one sidebar" | No "Chrome extension" or "AI sidebar", em dash |
| meta description | "A Chrome sidebar that puts Claude, ChatGPT... BYOK. Local. Open source." | OK, but no verb (summarize/translate) or search intent |
| OG / Twitter | Existed, `og-card.png` 1200x630 | The image showed **GPT-4o mini** (a retired model) and a cropped mockup, not a current screenshot |
| canonical | Correct | - |
| hreflang | **Missing** | Hebrew existed only as a JS swap on the same URL, so Google never saw a Hebrew page |
| robots.txt | `/Aside/robots.txt` with Allow all | **Not effective**: crawlers only read robots.txt at the host root, and `royc4515.github.io/robots.txt` returns 404 (which means "everything allowed", so nobody was blocked) |
| sitemap.xml | Existed, 3 URLs | Not discoverable through a root robots.txt, so it must be submitted manually |
| JSON-LD | Minimal SoftwareApplication | No FAQPage, no screenshot, no featureList |
| Static vs rendered text | **Mismatch** | The static H1 was "AI, on your side." while users saw "Every AI model. One sidebar." AI crawlers that don't run JS (GPTBot, ClaudeBot, PerplexityBot) saw the old text |
| Feature claim | "Save prompt snippets you actually use" | **Not true in the code**: `sidebar/prompt-templates.js` holds 8 built-in templates and has no saving. Fixed |
| Chrome Web Store | **Not published** | The site button reads "Coming to Chrome Web Store" (disabled), the README says "not yet on the Chrome Web Store", and there is no CWS link anywhere in the repo |
| Indexing | Couldn't be checked from here | There is no `site:` search access from this environment. Check in Search Console |

Lighthouse on the live site (before): Performance 97, Accessibility 95, Best Practices 100, **SEO 100**.

---

## 2. What changed

### Landing page (`site/`)
- **title + description** written for search intent:
  - EN: `Aside - AI Sidebar Chrome Extension (BYOK, Open Source)` (55 characters) / description of 159 characters with summarize, translate, chat, the 6 providers and "your own API key".
  - HE: `Aside - סיידבר AI לכרום בעברית, עם המפתח שלכם (BYOK)`.
- **OG + Twitter cards**: title, description and alt in both languages, `og:locale` + `og:locale:alternate`.
- **New share image** (`og-card.png`): a **real** screenshot of the extension loaded unpacked in Chromium and opened on an article, showing a summary from Claude Sonnet 5.5. The API call was answered by a local mock (no key, no network), so the answer text is scripted but every pixel is the real UI. The capture script is in `marketing/og/capture-og.mjs`.
- **A "What is Aside?" section**: one definitional paragraph in sentences you can quote (what it is, what it does, BYOK, Hebrew/RTL), plus a **supported providers table** (provider, what you need, default model). It reuses the existing tokens and logical CSS properties, so RTL needs no overrides.
- **FAQ**: 3 new questions (does it work with a ChatGPT Plus / Claude Pro subscription - BYOK; is it on the Web Store and how to install; what gets sent and to whom - privacy, 12,000 characters, page context can be turned off). The language answer was expanded to cover RTL pages and the Auto reply language. Every claim was checked against the code (`action-config.js`, `sidebar.js`, `store.js`, `manifest.json`).
- **JSON-LD** (`@graph`): `SoftwareApplication` (applicationCategory BrowserApplication, operatingSystem Google Chrome, offers with price 0, browserRequirements Chrome 114+, screenshot, featureList, downloadUrl, license, author), `WebPage`, and `FAQPage` that matches the visible questions exactly (it's generated from the same dictionary).
- **Hebrew page at its own URL**: `site/he/index.html` with `lang="he" dir="rtl"`, static Hebrew text (also readable by crawlers without JS), its own canonical, and `hreflang` en/he/x-default on both pages. `data-page-lang="he"` makes sure the `/he/` URL always shows Hebrew, even when the browser or a stored preference says English. The design is unchanged: it's exactly the same page you get today after switching to Hebrew.
- **`scripts/build-site.mjs`**: builds the Hebrew page, the JSON-LD and the static English text from `site/assets/i18n.js`. `--check` runs in CI (deploy-site.yml, now also on PRs without deploying), so they can't drift apart again.
- **robots.txt**: explicitly allows AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended and others), with a comment explaining that it only takes effect at the host root.
- **sitemap.xml**: 4 URLs (including `/he/`), `xhtml:link` hreflang, lastmod.
- **llms.txt**: a factual summary for AI tools (what the product is, providers and default models, privacy, installation).
- Em dashes replaced with plain hyphens across the site and the README (a rule in CLAUDE.md). The `?v=` cache-buster was bumped to `1.1.3.2` because the CSS/JS changed.
- **No** analytics, tracking or third-party scripts were added. The only external resource is still the Google Fonts that was already there.

### README
- H1 `Aside - AI sidebar for Chrome` plus an opening paragraph that defines the product (Chrome extension, AI sidebar, BYOK, the 6 providers, no server or analytics, Hebrew/RTL).
- Links to the site and to the Hebrew page, a more descriptive hero alt text, and a short FAQ section (free, subscriptions vs BYOK, Hebrew/RTL, Compare mode, Web Store).

### Docs
- `CLAUDE.md`: the generator command, and a rule that site copy goes into the dictionary in both languages.
- `docs/MONTHLY_UPDATE.md`: the providers table, `llms.txt` and the generator added to the monthly runbook.

---

## 3. Verification

| Check | Result |
|---|---|
| Lighthouse SEO | 100 before, 100 after (EN and HE) |
| Lighthouse Accessibility | 95 before, 96 after (the 2 remaining failures were already there: contrast elsewhere on the page, plus label-content-name-mismatch) |
| Lighthouse Best Practices | 100 / 100 |
| Lighthouse Performance | Same local server: 79-80 before, 79-80 after (LCP 3.8s, CLS 0 in both). 97 on GitHub Pages; the gap is the local server, not the change |
| JSON-LD | Parses in both pages, 3 nodes, FAQPage with 9 questions in the right language |
| Static vs JS parity | `/he/` without JS equals root rendered in Hebrew by JS (114 texts, 12 attributes, no differences). Static EN equals rendered EN |
| Language pin | `/he/` with English stored still shows `lang=he dir=rtl` |
| Mobile 375px | No horizontal scroll in EN or HE. The table wraps instead of scrolling |
| Visual | The new section in EN/HE, light/dark, desktop/mobile, plus the Hebrew FAQ, all checked by screenshot |
| `node scripts/check-models.mjs` | Passes |
| `node --check` on every JS file | Clean |
| `bash scripts/build-zip.sh` | Passes; the ZIP contains no site/marketing files |

Notes:
- Lighthouse SEO only checks basics (title, meta, crawlability, hreflang validity). The real value of this PR is in content, the second URL and structured data, which Lighthouse doesn't score.
- **Rich results:** since 2023 Google shows FAQ rich results only for government and health sites, and SoftwareApplication rich results require ratings (aggregateRating/review). We have neither, and I didn't invent any. So don't expect stars or an FAQ accordion in Google. The markup still helps Google, Bing and AI engines understand the page.

---

## 4. Manual steps (in order)

### Google Search Console
1. https://search.google.com/search-console, then "Add property", then **URL prefix** (not Domain - you can't verify DNS on github.io): `https://royc4515.github.io/Aside/`.
2. Verification: **HTML file** (download `google....html`, put it in `site/`, push to main). That's a static file, not tracking. Alternative: a `google-site-verification` meta tag.
3. Sitemaps, then submit `https://royc4515.github.io/Aside/sitemap.xml`.
4. URL Inspection, then "Request indexing" for `/Aside/` and `/Aside/he/`.
5. After about a week: check Pages (indexing) and Performance (queries). If `/he/` is reported as "Duplicate without user-selected canonical", let me know.

### Bing Webmaster Tools (also matters for ChatGPT search and Copilot)
1. https://www.bing.com/webmasters, then "Import from Google Search Console" (fastest), or add the site and verify with an XML file.
2. Submit the same sitemap.
3. URL Submission for both URLs. IndexNow is optional (it needs a key file in `site/`, also not tracking).

### Repo settings on GitHub (I can't do these from here)
- **About:** description: `Free, open-source AI sidebar Chrome extension. Summarize, translate or chat about any page with Claude, ChatGPT, Gemini, Grok, Groq or local Ollama. BYOK, no telemetry, Hebrew/RTL.`
- **Website:** `https://royc4515.github.io/Aside/`
- **Topics** (up to 20):
  `chrome-extension`, `ai-sidebar`, `byok`, `browser-extension`, `manifest-v3`, `ai-assistant`, `llm`, `claude`, `chatgpt`, `openai`, `gemini`, `grok`, `groq`, `ollama`, `summarizer`, `translation`, `rtl`, `hebrew`, `privacy`, `open-source`
- **Social preview:** Settings, then Social preview, then upload `site/assets/img/og-card.png`.

### Refreshing the share-image cache
- Facebook: https://developers.facebook.com/tools/debug/ then "Scrape Again".
- LinkedIn: https://www.linkedin.com/post-inspector/
- X has no public validator anymore; the card updates on the next crawl.

### Optional: robots.txt at the root
Only needed if you ever want an explicit rule. A `Royc4515/royc4515.github.io` repo with a `robots.txt` at its root would be the one crawlers actually read. Today the 404 means "everything allowed", which is what we want, so this isn't urgent.

---

## 5. Suggested Chrome Web Store listing

**Name** (up to 75 characters; also update `ext_name` in `_locales/*/messages.json`, which still has an em dash):
`Aside - AI Sidebar for Claude, ChatGPT, Gemini (BYOK)`

**Summary** (up to 132 characters; `ext_description` in `_locales`):
`AI sidebar on any page: summarize, translate or chat with Claude, ChatGPT, Gemini, Grok, Groq or Ollama. Your own API key, no tracking.`

**Category:** Productivity, Tools (or Workflow & Planning).

**Description:**

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

**Single purpose (Privacy practices):** `Lets the user ask an AI model of their choice about the webpage they are viewing, in a sidebar.`

**Permission justifications:**
- `activeTab`, `scripting`, `tabs` and host `<all_urls>`: inject the sidebar into the page the user is on and read its text when the user sends a prompt.
- `storage`: keep the user's API keys, settings and history on the device.
- `contextMenus`: "Explain selection" and "Summarize page" in the right-click menu.
- Data use: "Website content" is sent only to the AI provider the user chose, at the user's request. Not sold, not used for anything else.

**Assets:** screenshots at 1280x800 (you can reuse `marketing/og/capture-og.mjs` with a matching viewport), and a 440x280 promo tile.

After it's published: put the CWS link in the site button ("Coming to Chrome Web Store" becomes "Add to Chrome"; the `cta.store` key already exists in i18n.js), add `installUrl` to the JSON-LD in `scripts/build-site.mjs`, and add it to the README.

---

## 6. Where to mention it (backlinks and visibility in AI answers)

AI engines mostly cite pages that other people link to and talk about. Ordered by expected impact:

**Launch sites**
- **Product Hunt** - graphics are ready in `marketing/social/ph-*.png`. Launch on a Tuesday or Wednesday, after the Web Store listing exists if possible.
- **Hacker News - Show HN:** "Show HN: Aside - open-source BYOK AI sidebar for Chrome (Claude, GPT, Gemini, Ollama)". Lead with the technical angle: no build, no server, vanilla MV3.
- **AlternativeTo:** add Aside as an alternative to existing AI sidebars (Sider, Merlin, MaxAI, HARPA AI). The open-source + BYOK + privacy angle is the differentiator.
- AI tool directories: There's An AI For That, Futurepedia.

**Reddit** (read each subreddit's self-promotion rules first and post with value, not just a link)
- r/chrome_extensions, r/SideProject, r/opensource
- r/LocalLLaMA and r/ollama - the Ollama mode with no key and no network is a strong angle there
- r/ClaudeAI, r/OpenAI, r/GoogleGeminiAI, r/grok - only where self-promotion is allowed

**GitHub lists**
- The **Ollama** README has a community integrations section (browser extensions). A PR that adds Aside there is a high-quality link.
- awesome lists: search GitHub for `awesome chrome extensions`, `awesome claude`, `awesome ollama`, `awesome llm apps`. Pick lists that are active (recently merged PRs), and follow each list's format.

**Dev communities**
- A post on dev.to or Hashnode: "How I built a BYOK AI sidebar in vanilla MV3 without a build step" (nonce-authenticated postMessage, the CSP, streaming). Technical articles are exactly what AI answers like to cite.

**Israeli communities** (the Hebrew/RTL angle is unique: most AI sidebars don't support a Hebrew interface)
- Geektime - pitch a short item or a guest post.
- LinkedIn - a Hebrew post with the demo video, with the RTL and privacy angle.
- Facebook groups for AI/ChatGPT in Hebrew and for Israeli developers - check names and rules before posting (I didn't list specific groups so I wouldn't invent names).
- Bar-Ilan CS and Brain Sciences student groups.

---

## 7. Other issues I found (not fixed here, out of scope)

1. **The "Aside" name is clipped in the sidebar header at the default 420px width** (it showed up while capturing the screenshot; at 470px it's fine). That's a bug in `sidebar/sidebar.css`, and the header got more crowded after the language button was added.
2. Em dashes in the extension itself: `ext_name` in `_locales/en` and `_locales/he` ("Aside [em dash] AI in your sidebar") plus strings in the sidebar. This contradicts the CLAUDE.md rule and will appear in the Web Store.
3. The options page shows `v1.0.0` (`options/options.html`) while the manifest is 1.1.3.
4. Groq free tier: the README says "about a thousand requests a day" and the site says "tens of thousands of requests per day". One of them is wrong.
5. `faq.a2` says the keys "are never... sent to any server", but they are sent to the provider's API (that's the whole point). Worth rewording to "only to the provider you chose".
6. `feat.2.body` says "never store them" even though keys are stored locally. That's accurate about "we", but confusing.
