/**
 * Aside — Chat history storage layer.
 * Threads live in chrome.storage.local (heavy data — 5MB limit, not 100KB sync).
 *
 * Schema:
 *   aside.threads.index = [{id, title, updatedAt, pageUrl, pageTitle, providerId, turnCount}, ...]
 *   aside.thread.<id>   = { id, createdAt, updatedAt, pageUrl, pageTitle, providerId, turns: [...] }
 *
 * Index is metadata only (small, fast to load).
 * Full thread loads on restore.
 *
 * Exposed on window.History.
 */
(function () {
  const INDEX_KEY = 'aside.threads.index';
  const THREAD_KEY = (id) => `aside.thread.${id}`;
  const MAX_THREADS = 100;  // older ones get culled

  // ── Storage backend (chrome.storage.local, falls back to localStorage shim) ─
  function localGet(keys) {
    try {
      if (chrome?.storage?.local) return chrome.storage.local.get(keys);
    } catch {}
    // Fallback for preview shim: chrome.storage.sync mirrors chrome.storage.local
    return (chrome?.storage?.sync || { get: () => Promise.resolve({}) }).get(keys);
  }
  function localSet(items) {
    try {
      if (chrome?.storage?.local) return chrome.storage.local.set(items);
    } catch {}
    return (chrome?.storage?.sync || { set: () => Promise.resolve() }).set(items);
  }
  function localRemove(keys) {
    try {
      if (chrome?.storage?.local) return chrome.storage.local.remove(keys);
    } catch {}
    return (chrome?.storage?.sync || { remove: () => Promise.resolve() }).remove(keys);
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function ellipsis(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }
  function deriveTitle(turns) {
    const firstUser = (turns || []).find(t => t.role === 'user');
    if (!firstUser) return 'New chat';
    return ellipsis((firstUser.display || firstUser.content || 'New chat').trim().split('\n')[0], 60);
  }
  function deriveDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }

  // ── Index ───────────────────────────────────────────────────────
  async function listThreads() {
    const { [INDEX_KEY]: idx } = await localGet([INDEX_KEY]);
    return Array.isArray(idx) ? idx : [];
  }
  async function writeIndex(idx) {
    return localSet({ [INDEX_KEY]: idx });
  }

  // ── Core CRUD ───────────────────────────────────────────────────
  async function loadThread(id) {
    if (!id) return null;
    const { [THREAD_KEY(id)]: thread } = await localGet([THREAD_KEY(id)]);
    return thread || null;
  }

  /**
   * Save/upsert a thread.
   * @param {object} payload { id?, turns, pageUrl?, pageTitle?, providerId? }
   * @returns {Promise<string>} id of saved thread
   */
  async function saveThread(payload) {
    const now = Date.now();
    const id = payload.id || uid();
    const existing = payload.id ? await loadThread(payload.id) : null;
    const thread = {
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      pageUrl:   payload.pageUrl    || existing?.pageUrl    || '',
      pageTitle: payload.pageTitle  || existing?.pageTitle  || '',
      providerId:payload.providerId || existing?.providerId || '',
      turns: stripTurnsForStorage(payload.turns || []),
    };
    // Write full thread
    await localSet({ [THREAD_KEY(id)]: thread });
    // Update index (move to top, dedupe by id)
    const idx = await listThreads();
    const meta = {
      id,
      title: deriveTitle(thread.turns),
      updatedAt: now,
      pageUrl:   thread.pageUrl,
      pageTitle: thread.pageTitle,
      providerId:thread.providerId,
      turnCount: thread.turns.length,
    };
    const filtered = idx.filter(x => x.id !== id);
    filtered.unshift(meta);
    // Cull beyond MAX_THREADS
    let final = filtered;
    if (final.length > MAX_THREADS) {
      const dropped = final.slice(MAX_THREADS);
      final = final.slice(0, MAX_THREADS);
      await localRemove(dropped.map(t => THREAD_KEY(t.id)));
    }
    await writeIndex(final);
    return id;
  }

  /** Drop transient fields (loading, streaming, html) so storage stays small */
  function stripTurnsForStorage(turns) {
    return turns
      .filter(t => !t.loading) // never persist a pending turn
      .map(t => {
        const out = { role: t.role, content: t.content };
        if (t.display) out.display = t.display;
        if (t.label)   out.label   = t.label;
        if (t.action)  out.action  = t.action;
        if (t.model)   out.model   = { id: t.model.id, name: t.model.name, hue: t.model.hue };
        if (t.tokens)  out.tokens  = t.tokens;
        if (t.elapsedMs) out.elapsedMs = t.elapsedMs;
        return out;
      });
  }

  async function deleteThread(id) {
    await localRemove([THREAD_KEY(id)]);
    const idx = await listThreads();
    await writeIndex(idx.filter(x => x.id !== id));
  }

  async function deleteAll() {
    const idx = await listThreads();
    await localRemove(idx.map(x => THREAD_KEY(x.id)));
    await writeIndex([]);
  }

  /** Filter index by query and/or pageUrl. */
  function filterIndex(idx, query, pageUrl) {
    let out = idx.slice();
    if (pageUrl) out = out.filter(t => t.pageUrl === pageUrl);
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.pageTitle || '').toLowerCase().includes(q) ||
        deriveDomain(t.pageUrl).includes(q)
      );
    }
    return out;
  }

  function relativeTime(ts) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    return new Date(ts).toLocaleDateString();
  }

  window.History = {
    listThreads, loadThread, saveThread, deleteThread, deleteAll,
    filterIndex, deriveDomain, relativeTime, ellipsis, uid,
  };
})();
