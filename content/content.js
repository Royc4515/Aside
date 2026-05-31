/**
 * Content script — injects the sidebar iframe into the host page and
 * proxies messages between the iframe and the page.
 */
(() => {
  if (window.__asideInjected) return;
  window.__asideInjected = true;

  const HOST_ID = 'aside-sidebar-host';
  const IFRAME_ID = 'aside-sidebar-frame';
  const TRIGGER_ID = 'aside-selection-trigger';
  let visible = false;

  // ── Authenticated bridge to the sidebar iframe ──────────────────────────
  // content.js runs in the host page's origin, so the iframe cannot tell our
  // messages apart from a malicious page's by origin alone. We mint a random
  // nonce, stash it in chrome.storage.session (which page scripts cannot read),
  // and attach it to every message we post INTO the iframe. The iframe reads
  // the same nonce from session storage and rejects anything without it.
  //
  // The nonce is never echoed back out, and we post it only to the iframe's
  // (cross-origin) window, so the host page never observes it. For the reverse
  // direction we trust the iframe purely by e.source — which cannot be spoofed.
  const EXT_ORIGIN = new URL(chrome.runtime.getURL('')).origin;
  let channelNonce = null;
  let channelReady = null;

  function setupChannel() {
    if (channelReady) return channelReady;
    channelReady = (async () => {
      const channelId = 'aside.ch.' + crypto.randomUUID();
      const nonce = crypto.randomUUID();
      try {
        await chrome.runtime.sendMessage({ type: 'ENSURE_SESSION' });
        await chrome.storage.session.set({ [channelId]: nonce });
        // Only trust the nonce once it is actually persisted where the iframe
        // can read it; otherwise allow a retry on the next call.
        channelNonce = nonce;
      } catch {
        channelReady = null;
        return null;
      }
      return channelId;
    })();
    return channelReady;
  }

  // Always awaits the channel so the nonce is present before we post — this is
  // what makes the un-awaited show() paths (FAB, context menu) safe on a cold
  // service worker, instead of racing a fixed timeout.
  async function postToFrame(msg) {
    await setupChannel();
    const iframe = document.getElementById(IFRAME_ID);
    if (!iframe || !channelNonce) return;
    iframe.contentWindow?.postMessage({ ...msg, k: channelNonce }, EXT_ORIGIN);
  }

  function getStoredPosition() {
    try { return localStorage.getItem('aside.position') || 'right'; } catch { return 'right'; }
  }
  function getStoredWidth() {
    try { return parseInt(localStorage.getItem('aside.width'), 10) || 420; } catch { return 420; }
  }

  async function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host) return host;
    const channelId = await setupChannel();
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-aside-position', getStoredPosition());
    host.style.setProperty('--aside-width', getStoredWidth() + 'px');
    const iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = chrome.runtime.getURL('sidebar/sidebar.html') + '#c=' + encodeURIComponent(channelId);
    iframe.allow = 'clipboard-read; clipboard-write';
    host.appendChild(iframe);
    document.documentElement.appendChild(host);
    return host;
  }

  async function show() {
    const host = await ensureHost();
    host.classList.add('is-visible');
    visible = true;
    document.documentElement.classList.add('aside-open');
    hideTrigger();
    // Prime the iframe with current state.
    setTimeout(() => {
      postToFrame({ type: 'SIDEBAR_OPENED', dir: document.documentElement.dir || 'ltr' });
      sendPageContent();
      sendPageLang();
      sendSelectedText();
    }, 200);
  }

  function hide() {
    const host = document.getElementById(HOST_ID);
    if (host) host.classList.remove('is-visible');
    document.documentElement.classList.remove('aside-open');
    visible = false;
  }

  function toggle() { (visible ? hide : show)(); }

  // Floating Trigger Button
  function createTrigger() {
    let btn = document.getElementById(TRIGGER_ID);
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = TRIGGER_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Ask Aside about this selection');
    btn.innerHTML = `
      <span class="aside-fab-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <path d="M16 3c2 5 5.5 8.5 10.5 10.5C21.5 15.5 18 19 16 24 14 19 10.5 15.5 5.5 13.5 10.5 11.5 14 8 16 3z" fill="white"/>
          <circle cx="16" cy="27" r="1.5" fill="white" opacity="0.85"/>
        </svg>
      </span>
      <span class="aside-fab-label">Ask Aside</span>
    `;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = getSelectedText();
      show();
      setTimeout(() => postToFrame({ type: 'SELECTION_TRIGGER', text }), 250);
    };
    // Don't let the FAB's own click-events bubble into the page's clear-selection logic
    btn.onmousedown = (e) => e.stopPropagation();
    document.body.appendChild(btn);
    return btn;
  }

  function positionTrigger() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      hideTrigger();
      return;
    }
    if (visible) return;

    try {
      const range = sel.getRangeAt(0);
      const rects = range.getClientRects();
      if (rects.length === 0) {
        hideTrigger();
        return;
      }

      const lastRect = rects[rects.length - 1];
      const btn = createTrigger();
      // Briefly clear inline pos so we can measure natural width
      btn.style.left = '-9999px';
      btn.style.top  = '-9999px';
      btn.classList.add('is-active');
      const bw = btn.offsetWidth || 110;
      const bh = btn.offsetHeight || 32;

      // Prefer placement to the right of selection's end, just below it.
      // Clamp to viewport (with 8px padding) so the FAB never slides offscreen.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 8;

      let x = lastRect.right + 10;          // viewport-relative
      let y = lastRect.bottom + 8;
      // If would overflow right edge, try left of selection start
      if (x + bw > vw - padding) {
        x = Math.max(padding, lastRect.left - bw - 10);
      }
      // If would overflow bottom, place above the selection
      if (y + bh > vh - padding) {
        y = Math.max(padding, lastRect.top - bh - 8);
      }
      // Convert to page coords
      btn.style.left = (x + window.scrollX) + 'px';
      btn.style.top  = (y + window.scrollY) + 'px';
    } catch (e) {
      hideTrigger();
    }
  }

  function hideTrigger() {
    const btn = document.getElementById(TRIGGER_ID);
    if (btn) {
      btn.classList.remove('is-active');
    }
  }

  // Page text extraction — prefer <article>/<main>, fallback to body.
  function extractPageContent() {
    const candidates = ['article', 'main', '[role="main"]', '#content', '.content'];
    let root = null;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.length > 200) { root = el; break; }
    }
    root = root || document.body;
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, aside, [aria-hidden="true"]').forEach(n => n.remove());
    let text = (clone.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > 30000) text = text.slice(0, 30000) + '\n\n[truncated]';
    return text;
  }

  function getSelectedText() {
    const sel = window.getSelection();
    return sel ? String(sel).trim() : '';
  }

  function sendPageContent() {
    postToFrame({ type: 'PAGE_CONTENT', content: extractPageContent() });
    postToFrame({ type: 'PAGE_META', url: location.href, title: document.title || '' });
  }

  function sendSelectedText() {
    postToFrame({ type: 'SELECTED_TEXT', text: getSelectedText() });
  }

  function sendPageLang() {
    const raw  = document.documentElement.lang || '';
    const code = raw.toLowerCase().split(/[-_]/)[0];
    const supported = ['en','he','es','fr','de','zh','ar','ja'];
    postToFrame({ type: 'PAGE_LANG', lang: supported.includes(code) ? code : '' });
  }

  // Listeners
  document.addEventListener('mouseup', () => {
    setTimeout(positionTrigger, 10);
  });

  // Dismiss FAB on scroll or when user clicks elsewhere
  let scrollDismissTimer;
  document.addEventListener('scroll', () => {
    // Throttle: only hide if user keeps scrolling
    clearTimeout(scrollDismissTimer);
    scrollDismissTimer = setTimeout(hideTrigger, 50);
  }, { passive: true, capture: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTrigger();
  });

  document.addEventListener('selectionchange', () => {
    if (!visible) return;
    sendSelectedText();
  });

  // Iframe → content script messages.
  // Only accept messages that genuinely originate from our sidebar iframe:
  // e.source is set by the browser and cannot be spoofed by page scripts.
  window.addEventListener('message', (e) => {
    const iframe = document.getElementById(IFRAME_ID);
    if (!iframe || e.source !== iframe.contentWindow) return;
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'CLOSE_SIDEBAR') hide();
    if (msg.type === 'REQUEST_PAGE_CONTENT') sendPageContent();
    if (msg.type === 'REQUEST_SELECTED_TEXT') sendSelectedText();
    if (msg.type === 'SET_POSITION') {
      const host = document.getElementById(HOST_ID);
      if (host) host.setAttribute('data-aside-position', msg.position || 'right');
      try { localStorage.setItem('aside.position', msg.position || 'right'); } catch {}
    }
    if (msg.type === 'SET_WIDTH') {
      const host = document.getElementById(HOST_ID);
      const w = Math.max(320, Math.min(720, +msg.width || 420));
      if (host) host.style.setProperty('--aside-width', w + 'px');
      try { localStorage.setItem('aside.width', String(w)); } catch {}
    }
  });

  // Background → content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'TOGGLE_SIDEBAR') toggle();
    if (msg?.type === 'CONTEXT_MENU_ACTION') {
      if (!visible) show();
      setTimeout(() => postToFrame({
        type: 'CONTEXT_MENU_ACTION', action: msg.action, text: msg.text,
      }), visible ? 0 : 500);
    }
  });
})();
