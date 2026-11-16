/* Lab concept 2 - "try it on this page": a scripted Aside sidebar that opens on the landing page itself. */
(function () {
  const CAT = window.ASIDE_CATALOG || {};
  const PROV = [['claude', 'Claude', '#da7756'], ['openai', 'OpenAI', '#10a37f'], ['gemini', 'Gemini', '#4f86c6'],
    ['grok', 'Grok', '#8f897c'], ['groq', 'Groq', '#f55036'], ['ollama', 'Ollama', '#7e57c2']];
  let prov = PROV[0], busy = false;
  const modelName = id => (CAT[id] && CAT[id].defaultName) || '';
  const src = key => document.querySelector(`[data-i18n="${key}"]`);
  const QA = {
    sum: { q: 'Summarize this page', intro: "Here's the gist of this page:", items: [
      ['One sidebar, six providers.', 'Aside opens next to any page and lets you ask Claude, ChatGPT, Gemini, Grok, Groq or a local Ollama model about it.', 'hero.sub'],
      ['Your keys stay in your browser.', 'They are stored on your device, and requests go straight to the provider you chose.', 'privacy.body'],
      ['Free and open source.', 'You pay each provider directly, or use a free tier.', 'faq.a1']] },
    key: { q: 'What happens to my API key?', intro: '', items: [
      ['It never leaves your device.', 'Keys live in chrome.storage.local. They are not synced or uploaded, and there is no Aside server.', 'faq.a2']] },
    models: { q: 'Which models can I use?', intro: 'Each provider ships with a default:', items: () =>
      PROV.map(([id, name]) => [name + ':', modelName(id) + '.', null]).concat([['Or any other model id', 'the provider supports, typed in as a custom model.', 'models.note']]) },
  };

  const sb = document.createElement('aside');
  sb.className = 'try-sb'; sb.setAttribute('aria-label', 'Aside preview');
  sb.innerHTML = `
    <div class="try-head">
      <div class="try-brand"><svg viewBox="0 0 32 32"><path d="M16 3c2 5 5.5 8.5 10.5 10.5C21.5 15.5 18 19 16 24 14 19 10.5 15.5 5.5 13.5 10.5 11.5 14 8 16 3z" fill="#e08866"/><circle cx="16" cy="27.6" r="1.9" fill="#e08866"/></svg>Aside</div>
      <div class="try-prov"><button type="button" aria-haspopup="true"></button><div class="try-menu"></div></div>
      <button class="try-x" type="button" aria-label="Close">&times;</button>
    </div>
    <div class="try-body"><div class="try-empty"><h3>What's on your mind?</h3><p>Ask about this page. Answers here are scripted - it's a preview.</p></div></div>
    <div class="try-foot"><form><input placeholder="Ask anything about this page…" aria-label="Ask"><button aria-label="Send">&rarr;</button></form>
      <div class="try-note">Preview with scripted answers. No model is called.</div></div>`;
  document.body.append(sb);
  const body = sb.querySelector('.try-body'), empty = sb.querySelector('.try-empty');
  const provBtn = sb.querySelector('.try-prov > button'), menu = sb.querySelector('.try-menu');

  function paintProv() {
    provBtn.innerHTML = `<i style="--c:${prov[2]}"></i>${prov[1]} &#9662;`;
    menu.innerHTML = PROV.map(([id, name, c]) => `<button type="button" data-id="${id}"><i style="--c:${c}"></i>${name}<small>${modelName(id)}</small></button>`).join('');
  }
  paintProv();
  provBtn.addEventListener('click', () => menu.classList.toggle('on'));
  menu.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    prov = PROV.find(p => p[0] === b.dataset.id); menu.classList.remove('on'); paintProv();
  });

  for (const k of Object.keys(QA)) {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'try-chip'; chip.innerHTML = `<span>${QA[k].q}</span><span>&rarr;</span>`;
    chip.addEventListener('click', () => ask(k));
    empty.append(chip);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function stream(el, text) {
    for (let i = 1; i <= text.length; i += 2) { el.textContent = text.slice(0, i + 1); body.scrollTop = body.scrollHeight; await sleep(12); }
    el.textContent = text;
  }
  function mark(el) {
    if (!el) return;
    const d = el.closest('details'); if (d) d.open = true;
    el.classList.add('try-mark'); requestAnimationFrame(() => el.classList.add('on'));
  }
  async function ask(k, free) {
    if (busy) return; busy = true;
    empty.style.display = 'none';
    document.querySelectorAll('.try-mark').forEach(e => e.classList.remove('on'));
    const qa = QA[k];
    const u = document.createElement('div'); u.className = 'try-user'; u.innerHTML = '<span></span>'; u.firstChild.textContent = free || qa.q; body.append(u);
    const a = document.createElement('div'); a.className = 'try-ai';
    a.innerHTML = `<div class="try-ai-h"><i style="--c:${prov[2]}"></i><b>${prov[1]}</b> · ${modelName(prov[0])} · preview</div><div class="t"></div><ul></ul>`;
    body.append(a); body.scrollTop = body.scrollHeight;
    await sleep(450);
    if (!qa) {
      await stream(a.querySelector('.t'), 'This preview only knows the three questions below. Install Aside to ask anything, on any page.');
    } else {
      if (qa.intro) await stream(a.querySelector('.t'), qa.intro);
      const items = typeof qa.items === 'function' ? qa.items() : qa.items;
      let n = 0;
      for (const [head, text, key] of items) {
        const li = document.createElement('li'); li.innerHTML = '<strong></strong> <span></span>'; a.querySelector('ul').append(li);
        li.firstChild.textContent = head;
        await stream(li.lastChild, text);
        const el = key && src(key);
        if (el) {
          mark(el);
          const s = document.createElement('button'); s.type = 'button'; s.className = 'try-src'; s.textContent = String(++n); s.title = 'Show on the page';
          s.addEventListener('click', () => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          li.append(s);
          if (items.length === 1) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    const more = document.createElement('div'); more.className = 'try-more';
    for (const o of Object.keys(QA)) if (o !== k) { const b = document.createElement('button'); b.type = 'button'; b.textContent = QA[o].q; b.addEventListener('click', () => ask(o)); more.append(b); }
    a.append(more); body.scrollTop = body.scrollHeight;
    busy = false;
  }
  sb.querySelector('form').addEventListener('submit', e => {
    e.preventDefault(); const i = e.target.querySelector('input'); const v = i.value.trim(); if (!v) return; i.value = ''; ask(null, v);
  });

  const root = document.documentElement;
  const toggle = on => root.classList.toggle('try-open', on === undefined ? !root.classList.contains('try-open') : on);
  sb.querySelector('.try-x').addEventListener('click', () => toggle(false));
  addEventListener('keydown', e => {
    if (e.altKey && e.code === 'KeyA') { e.preventDefault(); toggle(); }
    else if (e.key === 'Escape') toggle(false);
  });
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'try-pill';
  pill.innerHTML = 'Try <b>Aside</b> on this page <kbd>Alt</kbd><kbd>A</kbd>';
  pill.addEventListener('click', () => toggle(true));
  document.body.append(pill);
  const cta = document.querySelector('.hero-cta');
  if (cta) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-primary'; b.textContent = 'Try it on this page';
    b.addEventListener('click', () => toggle(true)); cta.prepend(b);
  }
  window.__tryAside = { toggle, ask };
})();
