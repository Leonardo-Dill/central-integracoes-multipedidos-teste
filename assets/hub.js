/* =====================================================================
   Hub de integrações Multipedidos: comportamento compartilhado
   - acordeões (abrir e fechar com animação)
   - busca dentro da página e busca geral na página inicial
   - links internos ("veja o item 7.3") e links diretos (#q7-6)
   - imagens ampliadas (lightbox)
   Sem JS, as páginas continuam funcionando com HTML puro.
   ===================================================================== */
(function(){
  const doc = document;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = reduce ? 'auto' : 'smooth';
  const bodyOf = acc => acc.querySelector(':scope > .acc-body');

  /* ---------------- acordeões ---------------- */
  function setOpen(acc, open){
    const body = bodyOf(acc);
    if (acc.classList.contains('open') === open) return;
    if (reduce){ acc.classList.toggle('open', open); acc.open = open; body.style.height = open ? 'auto' : '0'; if (!open) collapseChildren(acc); return; }
    if (open){
      acc.classList.add('open'); acc.open = true;
      body.style.height = '0px';
      const h = body.scrollHeight;
      requestAnimationFrame(()=>{ body.style.height = h + 'px'; });
      body.addEventListener('transitionend', function te(e){ if (e.target !== body) return; if (acc.classList.contains('open')) body.style.height = 'auto'; body.removeEventListener('transitionend', te); });
    } else {
      body.style.height = body.scrollHeight + 'px';
      requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ body.style.height = '0px'; }); });
      acc.classList.remove('open');
      body.addEventListener('transitionend', function te(e){ if (e.target !== body) return; if (!acc.classList.contains('open')) acc.open = false; collapseChildren(acc); body.removeEventListener('transitionend', te); });
    }
  }
  function collapseChildren(acc){
    acc.querySelectorAll('.acc.open').forEach(c=>{ c.classList.remove('open'); c.open = false; bodyOf(c).style.height = '0px'; });
  }
  function openNow(acc){ acc.classList.add('open'); acc.open = true; bodyOf(acc).style.height = 'auto'; }
  function openPath(el){
    const chain = [];
    for (let n = el; n; n = n.parentElement) if (n.classList && n.classList.contains('acc')) chain.unshift(n);
    chain.forEach(openNow);
  }

  /* as seções vêm abertas no HTML (para funcionar sem JS); com JS começam fechadas */
  doc.querySelectorAll('.acc[open]').forEach(a=>{ if (!a.classList.contains('open')) a.open = false; });

  doc.querySelectorAll('.acc > .acc-head').forEach(head=>{
    head.addEventListener('click', e=>{
      e.preventDefault();
      const acc = head.parentElement;
      const opening = !acc.classList.contains('open');
      setOpen(acc, opening);
      if (opening){
        setTimeout(()=>{
          const r = head.getBoundingClientRect();
          if (r.top < 0 || r.top > window.innerHeight * 0.6) head.scrollIntoView({behavior: smooth, block: 'start'});
        }, reduce ? 0 : 320);
      }
    });
  });
  /* se o navegador abrir um item sozinho (ex.: "buscar na página"), sincroniza */
  doc.querySelectorAll('details.acc').forEach(d=>{
    d.addEventListener('toggle', ()=>{ if (d.open && !d.classList.contains('open')) openPath(d); });
  });

  const collapseBtn = doc.getElementById('collapseAll');
  if (collapseBtn) collapseBtn.addEventListener('click', e=>{
    e.preventDefault();
    clearMarks();
    doc.querySelectorAll('.section.open').forEach(s=>setOpen(s, false));
    window.scrollTo({top: 0, behavior: smooth});
  });

  /* ---------------- texto e destaque ---------------- */
  function norm(s){
    let out = '';
    for (let i = 0; i < s.length; i++){
      const c = s.charAt(i);
      const b = c.normalize('NFD').charAt(0).toLowerCase();
      out += (b.length === 1 ? b : c);
    }
    return out;
  }
  const CLS = {a:'[aáàâãäª]', e:'[eéèêë]', i:'[iíìîï]', o:'[oóòôõöº]', u:'[uúùûü]', c:'[cç]', n:'[nñ]'};
  function wordsRe(words){
    const parts = words.map(w => w.split('').map(ch => CLS[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(''));
    parts.sort((a, b) => b.length - a.length);
    return new RegExp('(' + parts.join('|') + ')', 'gi');
  }
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function highlightHTML(text, re){
    if (!re) return esc(text);
    re.lastIndex = 0;
    let out = '', last = 0, m;
    while ((m = re.exec(text))){
      if (!m[0].length){ re.lastIndex++; continue; }
      out += esc(text.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }
  function markIn(el, words){
    if (!words || !words.length) return;
    const re = wordsRe(words);
    const roots = [el.querySelector(':scope > .acc-head .acc-title'), bodyOf(el)].filter(Boolean);
    roots.forEach(root=>{
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.nodeValue.trim() && !n.parentElement.closest('mark')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const t = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(t)) return;
        re.lastIndex = 0;
        const frag = doc.createDocumentFragment();
        let last = 0, m;
        while ((m = re.exec(t))){
          if (!m[0].length){ re.lastIndex++; continue; }
          if (m.index > last) frag.appendChild(doc.createTextNode(t.slice(last, m.index)));
          const mk = doc.createElement('mark'); mk.className = 'hit'; mk.textContent = m[0];
          frag.appendChild(mk);
          last = m.index + m[0].length;
        }
        if (last < t.length) frag.appendChild(doc.createTextNode(t.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }
  function clearMarks(){
    const parents = new Set();
    doc.querySelectorAll('mark.hit').forEach(m=>{ parents.add(m.parentNode); m.replaceWith(doc.createTextNode(m.textContent)); });
    parents.forEach(p=>p.normalize());
  }
  const queryWords = raw => norm(raw.trim()).replace(/\s+/g, ' ').split(' ').filter(w => w.length > 1 || /\d/.test(w));

  /* ---------------- ir até um item ---------------- */
  function goTo(id, words, focus){
    const el = doc.getElementById(id);
    if (!el) return;
    clearMarks();
    openPath(el.classList.contains('acc') ? el : el.parentElement);
    markIn(el, words);
    el.scrollIntoView({behavior: smooth, block: 'start'});
    if (el.classList.contains('acc') && !el.classList.contains('section')){
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      setTimeout(()=>el.classList.remove('flash'), 1800);
    }
    if (focus){ const h = el.querySelector(':scope > .acc-head'); if (h) h.focus({preventScroll: true}); }
  }

  /* ---------------- índice de busca ---------------- */
  /* texto de um item sem repetir o texto dos subitens que estão dentro dele */
  function itemText(details){
    const root = bodyOf(details);
    if (!root) return '';
    const w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let out = '', lastBlock = null;
    while (w.nextNode()){
      const n = w.currentNode;
      if (n.parentElement.closest('details.acc') !== details) continue;
      const blk = n.parentElement.closest('p,li,td,th,div,ol,ul,figcaption,.note > strong,.stat > span');
      if (blk !== lastBlock && out && !/\s$/.test(out)) out += ' ';
      lastBlock = blk;
      out += n.nodeValue;
    }
    return out.replace(/\s+/g, ' ').trim();
  }
  function buildItems(root, page){
    return Array.from(root.querySelectorAll('details.acc[id]:not(.section):not(.az)')).map((d, i)=>{
      const head = d.querySelector(':scope > .acc-head');
      const title = (head.querySelector('.acc-title') || head).textContent.trim();
      const numEl = head.querySelector('.num');
      const num = numEl ? numEl.textContent.trim() : '';
      const sec = d.closest('.section');
      const secTitle = sec ? sec.querySelector(':scope > .acc-head .acc-title').textContent.replace(/^\d+\s*·\s*/, '').trim() : '';
      const body = itemText(d);
      return { id: d.id, i, num: /^\d/.test(num) ? num : '', title, section: secTitle, body, page,
               nTitle: norm(title), nBody: norm(body), nKeys: norm(d.dataset.k || '') };
    });
  }
  function search(items, raw){
    const q = norm(raw.trim()).replace(/\s+/g, ' ');
    const numQ = q.replace(/^(item|pergunta|passo)\s*/, '');
    if (/^\d+(\.\d+)?$/.test(numQ)){
      const hit = items.filter(it => it.num === numQ || it.num.startsWith(numQ + '.'));
      if (hit.length) return { list: hit, words: [] };
    }
    const words = queryWords(raw);
    if (!words.length) return { list: [], words };
    const found = [];
    items.forEach(it=>{
      const hay = it.nTitle + ' ' + it.nKeys + ' ' + it.nBody;
      if (!words.every(w => hay.includes(w))) return;
      let score = 0;
      if (it.nTitle.includes(q)) score += 60;
      if (it.nKeys.includes(q)) score += 25;
      if (it.nBody.includes(q)) score += 8;
      words.forEach(w=>{
        if (it.nTitle.includes(w)) score += 15;
        if (it.nKeys.includes(w)) score += 8;
        let c = 0, p = it.nBody.indexOf(w);
        while (p !== -1 && c < 5){ c++; p = it.nBody.indexOf(w, p + w.length); }
        score += c * 2;
      });
      found.push({ it, score });
    });
    found.sort((a, b) => b.score - a.score || a.it.i - b.it.i);
    return { list: found.map(f => f.it), words };
  }
  function snippet(it, words){
    const q = words.join(' ');
    let idx = q ? it.nBody.indexOf(q) : -1;
    if (idx === -1) for (const w of words){ idx = it.nBody.indexOf(w); if (idx !== -1) break; }
    const b = it.body;
    if (idx === -1) return b.length > 150 ? b.slice(0, b.lastIndexOf(' ', 150)) + '…' : b;
    let start = Math.max(0, idx - 55), end = Math.min(b.length, idx + 110);
    if (start > 0){ const s = b.indexOf(' ', start); start = (s !== -1 && s < idx) ? s + 1 : start; }
    if (end < b.length){ const e = b.lastIndexOf(' ', end); end = e > idx ? e : end; }
    return (start > 0 ? '…' : '') + b.slice(start, end) + (end < b.length ? '…' : '');
  }

  /* ---------------- interface da busca ---------------- */
  const input = doc.getElementById('q');
  const isHub = doc.body.hasAttribute('data-hub');
  let current = { list: [], words: [] };
  const MAX = 8;

  if (input){
    const form = input.closest('form');
    const clearBtn = doc.getElementById('clearQ');
    const results = doc.getElementById('results');
    const status = doc.getElementById('res-status');
    const list = doc.getElementById('res-list');
    let items = null, loading = null, timer = null;

    /* busca da página: itens desta página; busca do hub: itens de todas as integrações */
    function getItems(){
      if (items) return Promise.resolve(items);
      if (!isHub){ items = buildItems(doc, null); return Promise.resolve(items); }
      if (!loading){
        const cards = Array.from(doc.querySelectorAll('a.card[href]'));
        loading = Promise.all(cards.map(c=>{
          const page = { href: c.getAttribute('href'), name: c.dataset.name || c.querySelector('h2').textContent.trim() };
          return fetch(page.href).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(html => buildItems(new DOMParser().parseFromString(html, 'text/html'), page));
        })).then(all => (items = [].concat(...all)));
      }
      return loading;
    }
    const linkFor = (it, raw) => it.page ? it.page.href + '?q=' + encodeURIComponent(raw.trim()) + '#' + it.id : '#' + it.id;

    function render(){
      const raw = input.value;
      clearBtn.hidden = !raw;
      const q = norm(raw.trim());
      if (q.length < 2 && !/^\d$/.test(q)){ results.hidden = true; list.innerHTML = ''; status.textContent = ''; current = { list: [], words: [] }; return; }
      results.hidden = false;
      if (!items){ status.textContent = 'Carregando as integrações…'; list.innerHTML = ''; }
      getItems().then(all=>{
        if (input.value !== raw) return;
        current = search(all, raw);
        const n = current.list.length;
        if (!n){
          list.innerHTML = '';
          status.textContent = 'Nenhum resultado para “' + raw.trim() + '”. Tente outra palavra.';
          return;
        }
        status.textContent = n === 1 ? '1 resultado' : n + ' resultados';
        const re = current.words.length ? wordsRe(current.words) : null;
        list.innerHTML = current.list.slice(0, MAX).map(it=>{
          const where = (it.page ? '<span class="res-page">' + esc(it.page.name) + '</span>' : '') + esc(it.section);
          return '<li><a class="res" href="' + esc(linkFor(it, raw)) + '" data-id="' + it.id + '"><span class="res-num">' + esc(it.num) +
            '</span><span class="res-text"><span class="res-title">' + highlightHTML(it.title, re) + '</span><span class="res-sec">' + where +
            '</span><span class="res-snip">' + highlightHTML(snippet(it, current.words), re) + '</span></span></a></li>';
        }).join('') + (n > MAX ? '<li><p class="res-more">Mostrando ' + MAX + ' de ' + n + '. Digite mais uma palavra para refinar.</p></li>' : '');
      }).catch(()=>{
        list.innerHTML = '';
        status.textContent = 'A busca geral funciona com o hub publicado. Abra uma integração pelos cards abaixo.';
      });
    }
    function choose(a){
      if (isHub){ location.href = a.getAttribute('href'); return; }
      results.hidden = true; input.blur();
      goTo(a.dataset.id, current.words, true);
    }

    input.addEventListener('input', ()=>{ clearTimeout(timer); timer = setTimeout(render, 90); });
    input.addEventListener('focus', ()=>{ if (isHub) getItems().catch(()=>{}); if (input.value.trim()) render(); });
    clearBtn.addEventListener('click', ()=>{ input.value = ''; render(); clearMarks(); input.focus(); });
    form.addEventListener('submit', e=>{
      e.preventDefault();
      getItems().then(all=>{ current = search(all, input.value); const a = list.querySelector('.res'); if (a) choose(a); else render(); }).catch(render);
    });
    input.addEventListener('keydown', e=>{
      if (e.key === 'ArrowDown'){ const a = list.querySelector('.res'); if (a){ e.preventDefault(); a.focus(); } }
      else if (e.key === 'Escape'){ input.value = ''; render(); }
    });
    list.addEventListener('keydown', e=>{
      const links = Array.from(list.querySelectorAll('.res'));
      const i = links.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown' && i < links.length - 1){ e.preventDefault(); links[i + 1].focus(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); (i > 0 ? links[i - 1] : input).focus(); }
      else if (e.key === 'Escape'){ e.preventDefault(); input.focus(); }
    });
    list.addEventListener('click', e=>{
      const a = e.target.closest('a.res');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      choose(a);
    });

    /* botão flutuante para voltar à busca */
    const finder = doc.getElementById('busca');
    const toSearch = doc.getElementById('toSearch');
    if (finder && toSearch && 'IntersectionObserver' in window){
      new IntersectionObserver(entries=>{ toSearch.hidden = entries[0].isIntersecting; }).observe(finder);
    }
  }

  /* ---------------- links internos (#item) ---------------- */
  doc.addEventListener('click', e=>{
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id || !doc.getElementById(id)) return;
    e.preventDefault();
    if (id === 'busca'){ goTo('busca'); if (input) setTimeout(()=>input.focus({preventScroll: true}), reduce ? 0 : 350); return; }
    goTo(id, null, false);
  });

  /* ---------------- imagens ampliadas ---------------- */
  const zooms = doc.querySelectorAll('figure a.zoom');
  if (zooms.length){
    const lb = doc.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Imagem ampliada');
    lb.innerHTML = '<button class="close" type="button" aria-label="Fechar">×</button><img alt="">';
    doc.body.appendChild(lb);
    const lbImg = lb.querySelector('img');
    let lastFocus = null;
    zooms.forEach(z=>z.addEventListener('click', e=>{
      e.preventDefault();
      const img = z.querySelector('img');
      lbImg.src = z.getAttribute('href'); lbImg.alt = img ? img.alt : '';
      lastFocus = z; lb.classList.add('show'); lb.querySelector('.close').focus();
    }));
    const closeLb = ()=>{ lb.classList.remove('show'); if (lastFocus) lastFocus.focus(); };
    lb.addEventListener('click', closeLb);
    doc.addEventListener('keydown', e=>{ if (e.key === 'Escape' && lb.classList.contains('show')) closeLb(); });
  }

  /* ---------------- chegou por um link direto (#item ou ?q=termo#item) ---------------- */
  if (location.hash){
    const id = decodeURIComponent(location.hash.slice(1));
    if (doc.getElementById(id)){
      const q = new URLSearchParams(location.search).get('q');
      setTimeout(()=>goTo(id, q ? queryWords(q) : null), 0);
    }
  }
})();
