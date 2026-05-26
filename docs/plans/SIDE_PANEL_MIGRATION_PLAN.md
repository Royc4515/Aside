# Side Panel Migration Plan

Migrate Aside from an injected-iframe overlay to a real Chrome Side Panel (`chrome.sidePanel` API).

## Why

- No more z-index / CSS collisions with host sites.
- Survives page navigations cleanly (panel persists; overlay is re-injected per page).
- Doesn't steal page real estate or block clicks on host pages.
- Strict-CSP sites that currently break the overlay will work.

## Trade-offs / what we lose

- Browser owns panel chrome: no custom width animations, no left/right toggle from our UI (user controls it), no overlay mode.
- Side panel runs in extension context — it has **no direct access** to host page DOM. All page reads (article text, selection, lang) must flow through a content script via `chrome.tabs.sendMessage` / `chrome.runtime.sendMessage`.
- Cross-browser: Firefox uses the older `sidebar_action` API (different manifest key + shape). Out of scope for v1; Chrome/Edge only.

## Current page-DOM coupling (must be preserved via message bridge)

From `content/content.js`:
1. `extractPageContent()` — scrapes `<article>` / `<main>` text (capped at 30k chars).
2. `getSelectedText()` + `selectionchange` / `mouseup` live sync.
3. Floating "Ask Aside" FAB anchored to the user's text selection.
4. `PAGE_LANG` from `document.documentElement.lang`.
5. `PAGE_META` (URL + title).

The FAB **must stay in the page** (a side panel can't render next to a selection). Its click now opens the side panel via the background worker instead of toggling an in-page iframe.

## Target architecture

```
+----------------+   chrome.tabs.sendMessage    +----------------+
|  Side Panel    | <--------------------------> |  Content       |
|  (sidebar.*)   |                              |  Script        |
+----------------+                              +----------------+
        ^                                               ^
        | chrome.sidePanel.open()                       | FAB click
        |                                               |
        +---------- Background (service worker) --------+
                    + opens panel for active tab
                    + relays pending selection
                    + handles toggle-sidebar command
                    + handles context-menu actions
```

## Manifest changes (`manifest.json`)

Add:
```json
"permissions": ["storage", "activeTab", "scripting", "tabs", "contextMenus", "sidePanel"],
"side_panel": { "default_path": "sidebar/sidebar.html" }
```

Remove:
- `sidebar/*` entries from `web_accessible_resources` (panel is now loaded by the browser, not by a host page).
- Keep `content_scripts` — still needed for page scraping + FAB.

Keep `action.default_popup` or replace with a click handler that calls `chrome.sidePanel.open({ tabId })` (decide during impl).

## Background worker (`background.js`)

New responsibilities:
- On extension action click / `toggle-sidebar` command → `chrome.sidePanel.open({ tabId })`.
- On context-menu action → open panel, then forward action payload to panel once it signals `PANEL_READY`.
- On FAB → "ask about selection" message from content script → open panel, stash payload, replay on `PANEL_READY`.

Pending-payload pattern (needed because `sidePanel.open` is async and the panel takes time to load):
```js
let pending = null; // { tabId, type, payload }
// content -> background: { type: 'OPEN_PANEL_WITH', tabId, payload }
// panel  -> background: { type: 'PANEL_READY', tabId }
//   on PANEL_READY, flush `pending` for that tab to the panel.
```

## Message bridge swap list

Current code uses `iframe.contentWindow.postMessage` (page <-> iframe). Replace with extension messaging.

### Outbound: content script -> side panel
| Today (`postMessage`)        | After (`chrome.runtime.sendMessage`) |
|------------------------------|---------------------------------------|
| `SIDEBAR_OPENED`             | drop — panel knows it's open          |
| `PAGE_CONTENT`               | same name, via runtime msg            |
| `PAGE_META`                  | same                                  |
| `PAGE_LANG`                  | same                                  |
| `SELECTED_TEXT`              | same                                  |
| `SELECTION_TRIGGER`          | routed via background pending-payload |
| `CONTEXT_MENU_ACTION` relay  | routed via background pending-payload |

### Inbound: side panel -> content script
| Today                         | After                                          |
|-------------------------------|------------------------------------------------|
| `CLOSE_SIDEBAR`               | `chrome.sidePanel` doesn't expose close; drop, or send to background which can no-op |
| `REQUEST_PAGE_CONTENT`        | `chrome.tabs.sendMessage(activeTabId, ...)`    |
| `REQUEST_SELECTED_TEXT`       | same                                           |
| `SET_POSITION` / `SET_WIDTH`  | **delete** — browser owns panel geometry        |

Panel needs to know the active tab id: query on load + listen to `chrome.tabs.onActivated` / `onUpdated` and re-request page content on tab change.

## Sidebar code changes (`sidebar/sidebar.js`, 1461 lines)

- Replace every `window.addEventListener('message', ...)` handler that consumes content-script messages with `chrome.runtime.onMessage.addListener`.
- Replace every `parent.postMessage(...)` (sidebar -> content) with `chrome.tabs.sendMessage(activeTabId, ...)`.
- On load: send `PANEL_READY` to background, request current page content/selection from the active tab.
- Listen to `chrome.tabs.onActivated` to refresh page context when user switches tabs (decide: auto-refresh, or show "page changed — refresh?" affordance).

## CSS cleanup (`content/content.css`, `sidebar/sidebar.css`)

Delete (all overlay-positioning):
- `#aside-sidebar-host` fixed-position rules, `data-aside-position` left/right variants, `--aside-width`, `is-visible`, `aside-open` body class.
- Any width-resize logic.

Keep:
- FAB styles (`#aside-selection-trigger`).
- All in-panel UI styles in `sidebar.css` (they apply identically inside the browser-owned panel).

## Open questions to resolve before coding

1. **Tab-change behavior** — auto-refresh page context on tab switch, or keep last context until user asks? (Recommend: keep until user asks, show small "page changed" pill.)
2. **Action button** — keep popup, or make the toolbar icon directly open the side panel? (Recommend: direct open via `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.)
3. **Keep overlay as fallback?** — dual-mode adds complexity. Recommend full migration, no fallback.
4. **Per-tab vs global panel** — `chrome.sidePanel` supports both. Global (one panel, follows active tab) matches current UX better.

## Phased execution

1. **Scaffolding** — manifest entries, background `sidePanel.open` wiring, `setPanelBehavior` for action click. Verify the panel opens with the existing HTML.
2. **Message bridge** — swap `postMessage` ↔ `chrome.runtime.sendMessage` end-to-end. Get page content + selection flowing into the panel.
3. **FAB handoff** — pending-payload pattern in background; FAB click opens panel and delivers selection.
4. **Tab switching** — handle `onActivated` / `onUpdated`, refresh policy per open question #1.
5. **CSS / dead code purge** — remove overlay host, positioning, resize logic, `SET_POSITION` / `SET_WIDTH` plumbing.
6. **Manual QA matrix** — strict-CSP site (e.g. github.com), SPA navigation (e.g. youtube.com), RTL page (Hebrew Wikipedia), PDF viewer (panel should still work; page scraping won't), multiple windows.

## Estimate

~0.5–1 day focused. Bulk of time is the message-bridge swap (15–25 sites) and the FAB handoff handshake. Lowest-risk phase order is above — each step independently testable.

## Files touched

- `manifest.json`
- `background.js`
- `content/content.js`
- `content/content.css`
- `sidebar/sidebar.js`
- `sidebar/sidebar.css` (light)

No new files required.
