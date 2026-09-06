/* Langå screenplay tool — front end. No framework. Files are the truth:
   every view re-reads from the server, every edit writes straight back. */

const STATUSES = ['idea', 'discussed', 'drafted', 'locked'];
const STRANDS = ['NOW', 'THEN', 'LONDON'];
// scene heading (slugline) parts: the prefixes Fountain recognises, and the usual time-of-day tails
const SETTINGS = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'EST.'];
const TIMES = ['DAY', 'NIGHT', 'DAWN', 'DUSK', 'MORNING', 'AFTERNOON', 'EVENING', 'CONTINUOUS', 'LATER', 'MOMENTS LATER', 'SAME TIME'];
const TYPES = ['scenes', 'characters', 'locations', 'research'];
const LABEL = { scenes: 'Scenes', characters: 'Characters', locations: 'Locations', research: 'Research', framing: 'Framing', script: 'Script' };
const SINGULAR = { scenes: 'scene', characters: 'character', locations: 'location', research: 'research note' };

const $main = document.getElementById('main');
const $panel = document.getElementById('panel');
const $nav = document.getElementById('nav');
const $lightbox = document.getElementById('lightbox');
const $toast = document.getElementById('toast');

const db = { scenes: [], characters: [], locations: [], research: [], framing: null, images: [] };
const ui = { sceneMode: 'board', strand: 'ALL', filter: {}, activeFilter: {}, writing: null };
let current = null; // { type, file, data, raw?, error? }

// ---------------------------------------------------------------- utils

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function toast(msg, err = false) {
  $toast.textContent = msg;
  $toast.className = err ? 'err' : '';
  $toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { $toast.hidden = true; }, err ? 5000 : 1800);
}

async function api(method, url, body, raw = false) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = raw ? 'text/plain; charset=utf-8' : 'application/json';
    opts.body = raw ? body : JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const ct = r.headers.get('content-type') || '';
  const payload = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw new Error(payload && payload.error ? payload.error : `${r.status} ${r.statusText}`);
  return payload;
}

async function loadAll() {
  const [scenes, characters, locations, research, framing, images] = await Promise.all([
    api('GET', '/api/scenes'), api('GET', '/api/characters'), api('GET', '/api/locations'),
    api('GET', '/api/research'), api('GET', '/api/framing').catch(e => ({ error: e.message })), api('GET', '/api/images')
  ]);
  Object.assign(db, { scenes, characters, locations, research, framing, images });
}

const idOf = file => file.replace(/\.json$/, '');
const itemUrl = (type, file) => type === 'framing' ? '/api/framing' : `/api/${type}/${encodeURIComponent(file)}`;
const displayName = it => it.data ? (it.data.name || it.data.title || it.file) : it.file;
const nameOfIn = type => id => { const x = db[type].find(x => idOf(x.file) === id); return x && x.data ? displayName(x) : null; };
const charName = nameOfIn('characters');
const locName = nameOfIn('locations');

// "INT. HOTEL RANDERS - NIGHT" from a scene's setting, location and time; whatever parts are filled in
function sceneHeading(d) {
  const place = d.location ? (locName(d.location) || d.location).toUpperCase() : '';
  const head = [d.setting, place].filter(Boolean).join(' ');
  return d.time ? (head ? `${head} - ${d.time}` : d.time) : head;
}
// scenes have no numbers: the running order is the hidden 'order' field, set by dragging cards on the board
const orderOf = s => (s.data && Number(s.data.order)) || 0;
const bySceneOrder = (a, b) => orderOf(a) - orderOf(b);
const sceneName = id => { const s = db.scenes.find(x => idOf(x.file) === id); return s && s.data ? s.data.title : null; };

function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'untitled';
}

// ---------------------------------------------------------------- routing

function route() {
  const hash = location.hash.replace(/^#/, '') || 'scenes';
  const [view, ...rest] = hash.split('/');
  const sub = rest.join('/');
  for (const a of $nav.querySelectorAll('a')) a.classList.toggle('active', a.dataset.view === view);
  render(view, sub).catch(e => { $main.replaceChildren(el('div', { class: 'empty', text: e.message })); });
}
window.addEventListener('hashchange', route);

let renderSeq = 0;
async function render(view, sub) {
  const seq = ++renderSeq;
  await loadAll();
  if (seq !== renderSeq) return; // a newer navigation happened while loading (e.g. the 2nd click of a double-click)
  ui.writing = null;
  if (view === 'scenes' && sub.endsWith('/write')) { closePanel(); return renderWrite(sub.slice(0, -'/write'.length)); }
  if (view === 'scenes') renderScenes();
  else if (TYPES.includes(view)) renderList(view);
  else if (view === 'framing') renderFraming();
  else if (view === 'script') await renderScript();
  else $main.replaceChildren(el('div', { class: 'empty', text: 'Unknown view' }));

  if (sub && TYPES.includes(view)) openItem(view, sub);
  else if (view !== 'framing') closePanel();
}

function go(type, file) { location.hash = `${type}/${file}`; }

// ---------------------------------------------------------------- scenes

function filteredScenes() {
  return db.scenes.filter(s => ui.strand === 'ALL' || !s.data || s.data.strand === ui.strand);
}

function renderScenes() {
  const bar = el('div', { class: 'toolbar' },
    el('h1', { text: 'Scenes' }),
    el('div', { class: 'seg' },
      ...['board', 'timeline'].map(m => el('button', {
        class: ui.sceneMode === m ? 'on' : '', text: m[0].toUpperCase() + m.slice(1),
        onclick: () => { ui.sceneMode = m; renderScenes(); }
      }))),
    ...['ALL', ...STRANDS].map(s => el('button', {
      class: 'chip' + (ui.strand === s ? ' on' : ''), dataset: { strand: s }, text: s,
      onclick: () => { ui.strand = s; renderScenes(); }
    })),
    el('div', { class: 'spacer' }),
    el('span', { class: 'muted', text: `${db.scenes.length} scene${db.scenes.length === 1 ? '' : 's'}` }),
    el('button', { class: 'btn', text: '+ New scene', onclick: newScene })
  );
  const body = ui.sceneMode === 'board' ? renderBoard() : renderTimeline();
  $main.replaceChildren(bar, body);
}

function sceneCard(item, draggable) {
  if (!item.data) {
    return el('div', { class: 'card bad', onclick: () => go('scenes', item.file) },
      el('div', { class: 'head' }, el('span', { class: 'title', text: item.file })),
      el('div', { class: 'meta', text: 'malformed JSON: ' + item.error }));
  }
  const d = item.data;
  const cover = Array.isArray(d.images) && d.images[0] ? d.images[0].replace(/^\/+/, '') : null;
  const card = el('div', {
    class: 'card' + (current && current.file === item.file && current.type === 'scenes' ? ' selected' : '') + (cover ? ' has-img' : ''),
    style: cover ? `--cover:url("/${encodeURI(cover).replace(/"/g, '%22')}")` : null,
    draggable: draggable ? 'true' : null, dataset: { file: item.file }, title: 'click: details · double-click: write · drag: move between columns',
    // single click waits a beat so a double-click (write mode) isn't pre-empted by the panel opening and reflowing the board
    onclick: () => { clearTimeout(sceneCard._t); sceneCard._t = setTimeout(() => go('scenes', item.file), 220); },
    ondblclick: () => { clearTimeout(sceneCard._t); go('scenes', item.file + '/write'); }
  },
    el('div', { class: 'head' },
      el('span', { class: 'title', text: d.title || '(untitled)' }),
      el('span', { class: 'strand', dataset: { strand: d.strand }, text: d.strand || '?' })),
    el('div', { class: 'meta' },
      d.date && el('span', { text: d.date }),
      d.setting && el('span', { text: d.setting }),
      d.location && el('span', { text: locName(d.location) || d.location }),
      d.time && el('span', { text: d.time }),
      (d.characters || []).length ? el('span', { text: `${d.characters.length} cast` }) : null,
      d.script && d.script.trim() ? el('span', { text: 'script' }) : null),
    d.summary && el('div', { class: 'sum', text: d.summary })
  );
  if (draggable) {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.file);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  }
  return card;
}

function renderBoard() {
  const scenes = filteredScenes();
  const board = el('div', { class: 'board' });
  for (const status of STATUSES) {
    const items = scenes.filter(s => (s.data ? s.data.status : 'idea') === status)
      .sort(bySceneOrder);
    const col = el('div', { class: 'col', dataset: { status } },
      el('h2', {}, el('span', { text: status }), el('span', { text: items.length })),
      ...items.map(s => sceneCard(s, true)));
    // drop position: the first card whose midpoint is below the pointer gets the card dropped before it; none = end of column
    const cardsIn = () => [...col.querySelectorAll('.card:not(.dragging)')];
    const targetAt = y => cardsIn().find(c => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; }) || null;
    const clearMarks = () => { col.classList.remove('over', 'drop-end'); cardsIn().forEach(c => c.classList.remove('drop-before')); };
    col.addEventListener('dragover', e => {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('over');
      const t = targetAt(e.clientY);
      cardsIn().forEach(c => c.classList.toggle('drop-before', c === t));
      col.classList.toggle('drop-end', !t);
    });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) clearMarks(); });
    col.addEventListener('drop', e => {
      e.preventDefault();
      const file = e.dataTransfer.getData('text/plain');
      const visible = cardsIn(), t = targetAt(e.clientY);
      clearMarks();
      const before = t ? t.dataset.file : null;
      const after = !t && visible.length ? visible[visible.length - 1].dataset.file : null;
      moveScene(file, status, before, after);
    });
    board.append(col);
  }
  return board;
}

// put one scene into a status column at a position: before 'beforeFile', else after 'afterFile', else at the very end.
// The running order is global across columns, so the sequence is rebuilt and every changed 'order' is written.
async function moveScene(file, status, beforeFile, afterFile) {
  const item = db.scenes.find(s => s.file === file);
  if (!item || !item.data) return;
  const seq = db.scenes.filter(s => s.data).sort(bySceneOrder).map(s => s.file).filter(f => f !== file);
  let at = seq.length;
  if (beforeFile && seq.includes(beforeFile)) at = seq.indexOf(beforeFile);
  else if (afterFile && seq.includes(afterFile)) at = seq.indexOf(afterFile) + 1;
  seq.splice(at, 0, file);
  const moved = item.data.status !== status;
  try {
    if (moved) await api('PUT', itemUrl('scenes', file), { ...item.data, status });
    await api('POST', '/api/scenes/reorder', { files: seq });
    toast(moved ? `${item.data.title || file} → ${status}` : `moved ${item.data.title || file}`);
    await loadAll(); renderScenes();
    // re-open so the panel's copy of the scene picks up the new status / order rather than saving stale ones back
    if (current && current.type === 'scenes') openItem('scenes', current.file);
  } catch (err) { toast(err.message, true); }
}

function renderTimeline() {
  const scenes = filteredScenes().slice().sort((a, b) => {
    const da = a.data ? String(a.data.date || '') : '', dbb = b.data ? String(b.data.date || '') : '';
    if (da !== dbb) return da < dbb ? -1 : 1;
    return bySceneOrder(a, b);
  });
  if (!scenes.length) return el('div', { class: 'empty', text: 'No scenes in this strand yet.' });
  return el('div', { class: 'timeline' },
    ...scenes.map(s => el('div', { class: 'tl-row', dataset: { strand: s.data ? s.data.strand : '' } },
      el('div', { class: 'date', text: s.data ? (s.data.date || 'undated') : '?' }),
      sceneCard(s, false))));
}

async function newScene() {
  // new scenes go to the end of the running order; drag the card to place it
  const order = db.scenes.filter(s => s.data).reduce((m, s) => Math.max(m, orderOf(s)), -1) + 1;
  const scene = {
    title: 'Untitled', slug: 'untitled', order, strand: ui.strand === 'ALL' ? 'THEN' : ui.strand,
    date: '', setting: '', location: '', time: '', characters: [], summary: '', purpose: '', open: [],
    status: 'idea', script: '', images: [], notes: '', sketch: ''
  };
  try {
    const r = await api('POST', '/api/scenes', scene);
    toast(`created ${r.file}`);
    await loadAll(); renderScenes(); go('scenes', r.file);
  } catch (e) { toast(e.message, true); }
}

// ---------------------------------------------------------------- characters / locations / research lists

function blankItem(type, name) {
  if (type === 'characters') return { name, active: true, age_1943: '', role: '', fate: '', known: [], invented: [], arc: '', relationships: [], images: [], notes: '', sketch: '' };
  if (type === 'locations') return { name, active: true, description: '', real: true, images: [], notes: '', sketch: '' };
  if (type === 'research') return { title: name, source: '', summary: '', scenes: [], characters: [], images: [], notes: '', sketch: '' };
}

const HAS_ACTIVE = { characters: true, locations: true };
const isActive = it => !!(it.data && it.data.active === true);

function listBody(type) {
  const q = (ui.filter[type] || '').toLowerCase();
  const mode = HAS_ACTIVE[type] ? (ui.activeFilter[type] || 'all') : 'all';
  const items = db[type]
    .filter(it => !q || JSON.stringify(it.data || it.file).toLowerCase().includes(q))
    .filter(it => mode === 'all' || !it.data || (mode === 'active') === isActive(it));
  const nActive = db[type].filter(isActive).length;
  const count = el('span', { class: 'muted', text: HAS_ACTIVE[type]
    ? `${items.length} shown · ${nActive} active of ${db[type].length}`
    : `${items.length}${q ? ` of ${db[type].length}` : ''}` });
  const list = items.length ? el('div', { class: 'list' }, ...items.map(it => {
    const sel = current && current.type === type && current.file === it.file ? ' selected' : '';
    if (!it.data) return el('div', { class: 'card bad' + sel, dataset: { file: it.file }, onclick: () => go(type, it.file) }, el('div', { class: 'title', text: it.file }), el('div', { class: 'meta', text: it.error }));
    const d = it.data;
    const act = HAS_ACTIVE[type] ? (isActive(it) ? ' active' : ' inactive') : '';
    const cover = Array.isArray(d.images) && d.images[0] ? d.images[0].replace(/^\/+/, '') : null;
    return el('div', {
      class: 'card' + sel + act + (cover ? ' has-img' : ''), dataset: { file: it.file }, onclick: () => go(type, it.file),
      style: cover ? `--cover:url("/${encodeURI(cover).replace(/"/g, '%22')}")` : null
    },
      el('div', { class: 'head' },
        HAS_ACTIVE[type] ? el('span', { class: 'dot', title: isActive(it) ? 'active: in the film' : 'inactive: on file only' }) : null,
        el('span', { class: 'title', text: displayName(it) }),
        d.age_1943 ? el('span', { class: 'num', text: d.age_1943 }) : null,
        type === 'locations' ? el('span', { class: 'num', text: d.real === false ? 'invented' : 'real' }) : null,
        type === 'research' && (d.scenes || []).length + (d.characters || []).length ? el('span', { class: 'num', text: `${(d.scenes || []).length}s ${(d.characters || []).length}c` }) : null),
      el('div', { class: 'role', text: d.role || d.source || d.description || '' }),
      d.fate ? el('div', { class: 'fate', text: d.fate }) : null);
  })) : el('div', { class: 'empty', text: q ? 'Nothing matches.' : `No ${type} yet.` });
  return { count, list };
}

function renderList(type) {
  // If the list is already on screen, redraw only the cards so the search box keeps focus.
  const existing = $main.querySelector(`.listwrap[data-type="${type}"]`);
  if (existing) {
    const { count, list } = listBody(type);
    existing.replaceChildren(list);
    const c = $main.querySelector('.toolbar .count'); if (c) c.replaceWith(Object.assign(count, { className: 'muted count' }));
    return;
  }

  const search = el('input', { type: 'search', class: 'search', placeholder: `filter ${type}…`, value: ui.filter[type] || '' });
  search.addEventListener('input', () => { ui.filter[type] = search.value; renderList(type); });

  // "+ New" turns into an inline name box; Enter creates the file from the name's slug.
  const newBox = el('span', { class: 'newbox' });
  const showNewBox = () => {
    const inp = el('input', { type: 'text', placeholder: `name of new ${SINGULAR[type]} — Enter to create` });
    inp.addEventListener('keydown', async e => {
      if (e.key === 'Escape') { newBox.replaceChildren(newBtn); return; }
      if (e.key !== 'Enter' || !inp.value.trim()) return;
      const name = inp.value.trim();
      const base = slugify(name);
      let slug = base, n = 2;
      while (db[type].some(it => idOf(it.file) === slug)) slug = `${base}_${n++}`;
      try {
        const r = await api('POST', `/api/${type}`, { ...blankItem(type, name), slug });
        toast(`created ${r.file}`);
        await loadAll(); renderList(type); go(type, r.file);
      } catch (err) { toast(err.message, true); }
    });
    newBox.replaceChildren(inp, el('button', { class: 'btn ghost small', text: 'cancel', onclick: () => newBox.replaceChildren(newBtn) }));
    inp.focus();
  };
  const newBtn = el('button', { class: 'btn', text: `+ New ${SINGULAR[type]}`, onclick: showNewBox });
  newBox.append(newBtn);

  const { count, list } = listBody(type);
  count.className = 'muted count';
  const activeChips = HAS_ACTIVE[type] ? ['all', 'active', 'inactive'].map(m => el('button', {
    class: 'chip' + ((ui.activeFilter[type] || 'all') === m ? ' on' : ''), dataset: { mode: m }, text: m,
    onclick: () => { ui.activeFilter[type] = m; for (const c of $main.querySelectorAll('.toolbar .chip')) c.classList.toggle('on', c.dataset.mode === m); renderList(type); }
  })) : [];
  $main.replaceChildren(
    el('div', { class: 'toolbar' }, el('h1', { text: LABEL[type] }), search, ...activeChips, el('div', { class: 'spacer' }), count, newBox),
    el('div', { class: 'listwrap', dataset: { type } }, list)
  );
}

// ---------------------------------------------------------------- framing (single file, edited in the main pane)

function renderFraming() {
  closePanel();
  const f = db.framing;
  if (!f || (!f.data && !f.raw)) { $main.replaceChildren(el('div', { class: 'empty', text: f ? f.error : 'framing.json missing' })); return; }
  current = { type: 'framing', file: 'framing.json', data: f.data, raw: f.raw, error: f.error };
  const head = el('div', { class: 'toolbar' },
    el('h1', { text: 'Framing' }),
    el('span', { class: 'file muted', text: 'data/framing.json' }),
    el('div', { class: 'spacer' }),
    el('span', { class: 'saved', id: 'saved', text: '' }));
  if (f.error) { $main.replaceChildren(head, rawEditor()); return; }
  $main.replaceChildren(head, el('div', { class: 'pbody wide' },
    field('Narrator', textArea('narrator')),
    field('Listener', textArea('listener')),
    field('Strands', objListField('strands', [
      { key: 'id', label: 'id', width: '90px' }, { key: 'label', label: 'label', width: '1fr' }, { key: 'description', label: 'description', width: '2fr', multiline: true }
    ]), 'ids are what scenes use'),
    field('The weight', textArea('weight'), 'why the story matters'),
    field('Open questions', linesArea('open'), 'one per line'),
    field('Sketch', textArea('sketch', 'sketch'), 'half-formed ideas, no structure'),
    field('Notes', textArea('notes', 'tall'), 'Markdown'),
    field('Images', imagesField())
  ));
}

// ---------------------------------------------------------------- script

async function renderScript() {
  const text = await api('GET', '/api/script');
  const locked = db.scenes.filter(s => s.data && s.data.status === 'locked')
    .sort(bySceneOrder);
  $main.replaceChildren(
    el('div', { class: 'toolbar' }, el('h1', { text: 'Script' }),
      el('span', { class: 'muted', text: `${locked.length} locked scene${locked.length === 1 ? '' : 's'} · read-only · Fountain` }),
      el('div', { class: 'spacer' }),
      locked.length ? el('span', { class: 'muted', text: locked.map(s => s.data.title).join(' · ') }) : null),
    text.trim() ? el('pre', { class: 'script', text })
      : el('div', { class: 'empty', text: locked.length ? 'Locked scenes exist but none has Fountain in its Script field yet.' : 'No locked scenes yet. Lock a scene on the board and its Fountain appears here.' })
  );
}

// ---------------------------------------------------------------- panel / editor

function closePanel() { $panel.hidden = true; $panel.replaceChildren(); current = null; }

async function openItem(type, file) {
  let item;
  try { item = await api('GET', itemUrl(type, file)); }
  catch (e) { toast(e.message, true); return; }
  current = { type, file: item.file, data: item.data, raw: item.raw, error: item.error };
  $panel.hidden = false;
  $panel.replaceChildren(panelHead(), item.error ? rawEditor() : editorFor(type));
  $panel.scrollTop = 0;
  for (const c of $main.querySelectorAll('.card')) c.classList.toggle('selected', c.dataset.file === file);
}

function panelHead() {
  const del = el('button', { class: 'btn danger small', text: 'Delete' });
  del.addEventListener('click', () => {
    // two-step: the button becomes a confirm
    const confirmBtn = el('button', { class: 'btn danger small', text: `Really move ${current.file} to trash?`, onclick: deleteCurrent });
    const cancel = el('button', { class: 'btn ghost small', text: 'cancel', onclick: () => { confirmBtn.replaceWith(del); cancel.remove(); } });
    del.replaceWith(confirmBtn); confirmBtn.after(cancel);
  });
  return el('div', { class: 'phead' },
    el('span', { class: 'file', text: `data/${current.type}/${current.file}` }),
    el('span', { class: 'saved', id: 'saved', text: '' }),
    HAS_ACTIVE[current.type] && current.data ? activeToggle() : null,
    del,
    el('button', { class: 'btn ghost small', text: 'Close', onclick: () => { location.hash = current.type; } }));
}

function activeToggle() {
  // one click flips active/inactive and writes the file straight away
  const d = current.data;
  const btn = el('button', { class: 'btn small toggle' });
  const paint = () => {
    const on = d.active === true;
    btn.classList.toggle('on', on);
    btn.textContent = on ? '● Active' : '○ Inactive';
    btn.title = on ? 'In the film. Click to park it.' : 'On file only. Click to bring it into the film.';
  };
  btn.addEventListener('click', () => { d.active = d.active !== true; paint(); clearTimeout(saveTimer); saveNow(); });
  paint();
  return btn;
}

async function deleteCurrent() {
  const { type, file } = current;
  try {
    const r = await api('DELETE', itemUrl(type, file));
    toast(`moved to ${r.trashed}`);
    location.hash = type;
  } catch (e) { toast(e.message, true); }
}

function setSaved(state, msg) {
  const s = document.getElementById('saved'); if (!s) return;
  s.className = 'saved ' + state; s.textContent = msg;
}

let saveTimer = null;
function scheduleSave() {
  setSaved('dirty', 'unsaved…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 350);
}

async function saveNow() {
  if (!current || !current.data) return;
  const { type, file } = current;
  try {
    const r = await api('PUT', itemUrl(type, file), current.data);
    const renamed = r.file && r.file !== file;
    if (r.file) current.file = r.file;
    setSaved('', `saved ${new Date().toLocaleTimeString()}`);
    const head = $panel.querySelector('.phead .file'); if (head) head.textContent = `data/${type}/${current.file}`;
    if (renamed) history.replaceState(null, '', `#${type}/${current.file}`);
    await loadAll();
    // refresh the list behind the panel without touching the panel itself
    if (ui.writing) { const h = $main.querySelector('.write-head .file'); if (h) h.textContent = `data/scenes/${current.file}`; }
    else if (type === 'scenes') renderScenes();
    else if (TYPES.includes(type)) renderList(type);
  } catch (e) { setSaved('err', e.message); toast(e.message, true); }
}

async function saveRaw(text) {
  const { type, file } = current;
  try {
    const r = await api('PUT', itemUrl(type, file), text, true);
    toast(r.error ? 'saved, still malformed' : 'saved and valid');
    if (!r.error) { await loadAll(); route(); }
  } catch (e) { toast(e.message, true); }
}

function rawEditor() {
  const ta = el('textarea', { class: 'mono', style: 'min-height:60vh', text: current.raw || '' });
  return el('div', { class: 'pbody' },
    el('div', { class: 'raw-warn', text: 'This file is not valid JSON. Nothing has been changed. Fix it here and save, or edit it on disk.' }),
    el('div', { class: 'muted', style: 'margin-bottom:8px', text: current.error }),
    el('div', { class: 'field' }, ta),
    el('button', { class: 'btn', text: 'Save raw file', onclick: () => saveRaw(ta.value) }));
}

// ---- field helpers: each binds directly to current.data[key] and saves on change

function field(label, control, hint) {
  // label may be a string or an element (e.g. a label with a button in it)
  return el('div', { class: 'field' }, el('label', {}, label, hint ? el('small', { class: 'muted', text: hint }) : null), control);
}

function textInput(key, opts = {}) {
  const d = current.data;
  const inp = el('input', { type: opts.number ? 'number' : 'text', value: d[key] ?? '' });
  inp.addEventListener('input', () => { d[key] = opts.number ? (inp.value === '' ? '' : Number(inp.value)) : inp.value; scheduleSave(); });
  return inp;
}

function textArea(key, cls = '') {
  const d = current.data;
  const ta = el('textarea', { class: cls, text: d[key] ?? '' });
  ta.addEventListener('input', () => { d[key] = ta.value; scheduleSave(); });
  return ta;
}

function linesArea(key, cls = '') {
  const d = current.data;
  const ta = el('textarea', { class: cls, text: (Array.isArray(d[key]) ? d[key] : []).join('\n') });
  ta.addEventListener('input', () => { d[key] = ta.value.split('\n').map(s => s.trim()).filter(Boolean); scheduleSave(); });
  return ta;
}

function listInput(key, options, placeholder = '') {
  // free text with a dropdown of standard values (input + datalist)
  const d = current.data;
  const id = 'dl-' + key;
  const inp = el('input', { type: 'text', list: id, value: d[key] ?? '', placeholder, autocomplete: 'off' });
  inp.addEventListener('input', () => { d[key] = inp.value; scheduleSave(); });
  return el('div', {}, inp, el('datalist', { id }, ...options.map(v => el('option', { value: v }))));
}

function selectInput(key, options, allowEmpty = false) {
  const d = current.data;
  const sel = el('select', {},
    allowEmpty ? el('option', { value: '', text: '—' }) : null,
    ...options.map(o => el('option', { value: o.value, text: o.label, selected: d[key] === o.value || null })));
  if (!allowEmpty && !options.some(o => o.value === d[key])) {
    sel.prepend(el('option', { value: d[key] ?? '', text: `${d[key] ?? ''} (not a known value)`, selected: true }));
  }
  sel.addEventListener('change', () => { d[key] = sel.value; scheduleSave(); });
  return sel;
}

function boolSelect(key, yes, no) {
  const d = current.data;
  const sel = el('select', {},
    el('option', { value: 'true', text: yes, selected: d[key] !== false || null }),
    el('option', { value: 'false', text: no, selected: d[key] === false || null }));
  sel.addEventListener('change', () => { d[key] = sel.value === 'true'; scheduleSave(); });
  return sel;
}

function idListField(key, pool, nameOf, addLabel) {
  // chips of ids + a dropdown to add one
  const d = current.data;
  if (!Array.isArray(d[key])) d[key] = [];
  const wrap = el('div');
  const draw = () => {
    const inactive = id => { const p = pool.find(x => idOf(x.file) === id); return !!(p && p.data && 'active' in p.data && p.data.active !== true); };
    const chips = el('div', { class: 'chips' }, ...d[key].map(id => {
      const nm = nameOf(id);
      const cls = 'tag' + (nm ? '' : ' missing') + (inactive(id) ? ' inactive' : '');
      return el('span', { class: cls, title: nm ? (inactive(id) ? `${id} (inactive)` : id) : `${id}: no such file` }, nm || id,
        el('button', { text: '×', title: 'remove', onclick: () => { d[key] = d[key].filter(x => x !== id); scheduleSave(); draw(); } }));
    }));
    // active items first, then the rest marked (inactive)
    const cands = pool.filter(p => p.data && !d[key].includes(idOf(p.file)))
      .sort((a, b) => (inactive(idOf(a.file)) - inactive(idOf(b.file))) || (nameOf(idOf(a.file)) || '').localeCompare(nameOf(idOf(b.file)) || ''));
    const sel = el('select', {}, el('option', { value: '', text: addLabel }),
      ...cands.map(p => el('option', { value: idOf(p.file), text: (nameOf(idOf(p.file)) || p.file) + (inactive(idOf(p.file)) ? '  (inactive)' : '') })));
    sel.addEventListener('change', () => { if (sel.value) { d[key].push(sel.value); scheduleSave(); draw(); } });
    wrap.replaceChildren(chips, el('div', { class: 'addrow' }, sel));
  };
  draw();
  return wrap;
}

function objListField(key, cols, opts = {}) {
  // list of small objects, one row each. cols: [{key,label,width,multiline,options,nameOf}]
  const d = current.data;
  if (!Array.isArray(d[key])) d[key] = [];
  const wrap = el('div', { class: 'objlist' });
  const grid = cols.map(c => c.width || '1fr').join(' ') + ' 28px';
  const draw = () => {
    const rows = d[key].map((row, i) => {
      const cells = cols.map(c => {
        let inp;
        if (c.options) {
          const cur = row[c.key] ?? '';
          const known = c.options.some(o => o.value === cur);
          inp = el('select', {},
            el('option', { value: '', text: '—' }),
            !known && cur ? el('option', { value: cur, text: `${cur} (missing)`, selected: true }) : null,
            ...c.options.map(o => el('option', { value: o.value, text: o.label, selected: cur === o.value || null })));
          inp.addEventListener('change', () => { row[c.key] = inp.value; scheduleSave(); });
        } else if (c.multiline) {
          inp = el('textarea', { placeholder: c.label, text: row[c.key] ?? '', rows: 2 });
          inp.addEventListener('input', () => { row[c.key] = inp.value; scheduleSave(); });
        } else {
          inp = el('input', { type: 'text', placeholder: c.label, value: row[c.key] ?? '' });
          inp.addEventListener('input', () => { row[c.key] = inp.value; scheduleSave(); });
        }
        return inp;
      });
      return el('div', { class: 'objrow', style: `grid-template-columns:${grid}` }, ...cells,
        el('button', { class: 'rm', text: '×', title: 'remove', onclick: () => { d[key].splice(i, 1); scheduleSave(); draw(); } }));
    });
    const header = d[key].length ? el('div', { class: 'objrow head', style: `grid-template-columns:${grid}` }, ...cols.map(c => el('span', { text: c.label })), el('span')) : null;
    const add = el('button', { class: 'btn ghost small', text: `+ ${opts.addLabel || 'add'}`, onclick: () => {
      const blank = {}; for (const c of cols) blank[c.key] = c.key === 'source' && opts.defaultSource ? opts.defaultSource : '';
      d[key].push(blank); scheduleSave(); draw();
      const last = wrap.querySelectorAll('.objrow:not(.head)'); if (last.length) last[last.length - 1].querySelector('input,textarea,select').focus();
    } });
    wrap.replaceChildren(...[header, ...rows, add].filter(Boolean));
  };
  draw();
  return wrap;
}

async function uploadFiles(files) {
  // POST each file raw; the server stores it under images/<type>/<id>/ and returns the path
  const d = current.data;
  const { type, file } = current;
  const id = type === 'framing' ? 'framing' : idOf(file);
  let added = 0;
  for (const f of files) {
    if (!f.type.startsWith('image/') && !/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(f.name)) { toast(`${f.name}: not an image`, true); continue; }
    try {
      const q = new URLSearchParams({ type, id, name: f.name });
      const r = await fetch(`/api/upload?${q}`, { method: 'POST', headers: { 'Content-Type': f.type || 'application/octet-stream' }, body: f });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || r.statusText);
      d.images.push(payload.path); added++;
    } catch (e) { toast(`${f.name}: ${e.message}`, true); }
  }
  if (added) { toast(`${added} image${added === 1 ? '' : 's'} added`); scheduleSave(); await loadAll(); }
  return added;
}

function imagesField(opts = {}) {
  // opts.hero: show images[0] large above the strip (the first image is the cover; ★ on a thumb makes it the cover)
  const d = current.data;
  if (!Array.isArray(d.images)) d.images = [];
  const wrap = el('div');
  const draw = () => {
    const hero = opts.hero && d.images.length
      ? el('div', { class: 'hero', title: d.images[0], onclick: () => showLightbox(d.images[0]) }, el('img', { src: '/' + d.images[0].replace(/^\/+/, ''), alt: d.images[0] }))
      : null;
    const strip = el('div', { class: 'strip' + (d.images.length ? '' : ' empty') },
      ...d.images.map((p, i) => el('div', { class: 'thumb' + (opts.hero && i === 0 ? ' cover' : ''), title: p, onclick: () => showLightbox(p) },
        el('img', { src: '/' + p.replace(/^\/+/, ''), alt: p, loading: 'lazy' }),
        el('span', { class: 'cap', text: p.split('/').pop() }),
        opts.hero && i > 0 ? el('button', { class: 'star', text: '★', title: 'make this the cover', onclick: e => { e.stopPropagation(); d.images.splice(i, 1); d.images.unshift(p); scheduleSave(); draw(); } }) : null,
        el('button', { class: 'rm', text: '×', title: 'remove from this item (file stays on disk)', onclick: e => { e.stopPropagation(); d.images = d.images.filter(x => x !== p); scheduleSave(); draw(); } }))),
      d.images.length ? null : el('span', { class: 'muted drophint', text: 'drop image files here' }));
    // drag files from the desktop straight onto the strip
    strip.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); strip.classList.add('over'); } });
    strip.addEventListener('dragleave', () => strip.classList.remove('over'));
    strip.addEventListener('drop', async e => {
      e.preventDefault(); strip.classList.remove('over');
      if (e.dataTransfer.files.length && await uploadFiles(e.dataTransfer.files)) draw();
    });

    const fileInp = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    fileInp.addEventListener('change', async () => { if (fileInp.files.length && await uploadFiles(fileInp.files)) draw(); });
    const upload = el('button', { class: 'btn small', text: 'Upload…', onclick: () => fileInp.click() });

    const sel = el('select', {}, el('option', { value: '', text: db.images.length ? 'or add an existing file from images/…' : 'images/ folder is empty' }),
      ...db.images.filter(p => !d.images.includes(p)).map(p => el('option', { value: p, text: p })));
    sel.addEventListener('change', () => { if (sel.value) { d.images.push(sel.value); scheduleSave(); draw(); } });
    const inp = el('input', { type: 'text', placeholder: 'or type a path: images/characters/inger/x.jpg' });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && inp.value.trim()) { d.images.push(inp.value.trim()); scheduleSave(); draw(); }
    });
    wrap.replaceChildren(...[hero, strip, el('div', { class: 'addrow' }, upload, fileInp, sel), el('div', { class: 'addrow', style: 'margin-top:6px' }, inp)].filter(Boolean));
  };
  draw();
  return wrap;
}

function showLightbox(p) {
  $lightbox.querySelector('img').src = '/' + p.replace(/^\/+/, '');
  $lightbox.hidden = false;
}
$lightbox.addEventListener('click', () => { $lightbox.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $lightbox.hidden = true; });

// ---- editors per type

function editorFor(type) {
  if (type === 'scenes') return sceneEditor();
  if (type === 'characters') return characterEditor();
  if (type === 'locations') return locationEditor();
  if (type === 'research') return researchEditor();
  return el('div', { class: 'pbody', text: 'no editor for ' + type });
}

function usedBy(type, id) {
  // where else is this id referenced? shown read-only so deletes/renames are informed
  const refs = [];
  if (type === 'characters') {
    for (const s of db.scenes) if (s.data && (s.data.characters || []).includes(id)) refs.push(`scene ${sceneName(idOf(s.file))}`);
    for (const c of db.characters) if (c.data && (c.data.relationships || []).some(r => r.character === id)) refs.push(`${c.data.name} (relationship)`);
    for (const r of db.research) if (r.data && (r.data.characters || []).includes(id)) refs.push(`research: ${r.data.title}`);
  } else if (type === 'locations') {
    for (const s of db.scenes) if (s.data && s.data.location === id) refs.push(`scene ${sceneName(idOf(s.file))}`);
  } else if (type === 'scenes') {
    for (const r of db.research) if (r.data && (r.data.scenes || []).includes(id)) refs.push(`research: ${r.data.title}`);
  }
  if (!refs.length) return null;
  return el('div', { class: 'usedby muted' }, 'Referenced by: ', refs.join(' · '));
}

function sceneEditor() {
  return el('div', { class: 'pbody' },
    el('div', { class: 'row' },
      field('Title', textInput('title')),
      field('Slug', textInput('slug'), 'file name')),
    el('div', { class: 'row3' },
      field('Status', selectInput('status', STATUSES.map(s => ({ value: s, label: s })))),
      field('Strand', selectInput('strand', STRANDS.map(s => ({ value: s, label: s })))),
      field('Story date', textInput('date'), 'sortable: 1943-11-17')),
    el('div', { class: 'row3' },
      field('Setting', selectInput('setting', SETTINGS.map(s => ({ value: s, label: s })), true), 'INT./EXT.'),
      field('Location', selectInput('location', db.locations.filter(l => l.data)
        .sort((a, b) => (isActive(b) - isActive(a)) || a.data.name.localeCompare(b.data.name))
        .map(l => ({ value: idOf(l.file), label: l.data.name + (isActive(l) ? '' : '  (inactive)') })), true)),
      field('Time', listInput('time', TIMES, 'DAY / NIGHT / …'), 'or type your own')),
    field('Scene heading', headingPreview(), 'Fountain slugline, built from the three above'),
    field('Characters', idListField('characters', db.characters, charName, 'Add character…')),
    field('Summary', textArea('summary'), 'what happens'),
    field('Purpose', textArea('purpose')),
    field('Open questions', linesArea('open'), 'one per line'),
    field('Sketch', textArea('sketch', 'sketch'), 'half-formed ideas, no structure'),
    field('Notes', textArea('notes', 'tall'), 'Markdown'),
    field(el('span', {}, 'Script ', el('button', { class: 'btn ghost small', text: '⤢ Write full width', onclick: () => go('scenes', current.file + '/write') })),
      textArea('script', 'mono'), 'Fountain'),
    field('Images', imagesField()),
    usedBy('scenes', idOf(current.file))
  );
}

function headingPreview() {
  // read-only slugline that follows the setting / location / time controls as they change
  const out = el('div', { class: 'heading-preview' });
  const refresh = () => { const h = sceneHeading(current.data); out.textContent = h || '—'; out.classList.toggle('muted', !h); };
  refresh();
  // the controls are siblings rendered alongside this; hook the panel body once it is in the DOM
  queueMicrotask(() => { const body = out.closest('.pbody'); if (body) { body.addEventListener('input', refresh); body.addEventListener('change', refresh); } });
  return out;
}

// ---------------------------------------------------------------- writing mode: one scene's Fountain, front and centre

async function renderWrite(file) {
  let item;
  try { item = await api('GET', itemUrl('scenes', file)); }
  catch (e) { $main.replaceChildren(el('div', { class: 'empty', text: e.message })); return; }
  if (item.error) { location.hash = `scenes/${file}`; return; }
  current = { type: 'scenes', file: item.file, data: item.data };
  ui.writing = item.file;
  const d = current.data;

  const heading = sceneHeading(d);
  const ta = el('textarea', { class: 'write-pad', spellcheck: 'true', placeholder: (heading || 'INT. HOTEL RANDERS, DINING ROOM - NIGHT') + '\n\nFountain goes here. Scene headings in caps, character names in caps, dialogue underneath.', text: d.script || '' });
  const insertHeading = () => {
    // at the cursor, on its own line, with a blank line after; at the top if the script is empty
    if (!heading) { toast('set Setting / Location / Time in scene details first', true); return; }
    const s = ta.selectionStart, before = ta.value.slice(0, s);
    const lead = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    ta.setRangeText(lead + heading + '\n\n', s, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input')); ta.focus();
  };
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight + 4, window.innerHeight * 0.7) + 'px'; };
  ta.addEventListener('input', () => { d.script = ta.value; scheduleSave(); grow(); });
  ta.addEventListener('keydown', e => {
    // Tab inserts four spaces instead of leaving the editor
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart, en = ta.selectionEnd; ta.setRangeText('    ', s, en, 'end'); ta.dispatchEvent(new Event('input')); }
  });

  const status = selectInput('status', STATUSES.map(s => ({ value: s, label: s })));
  const words = el('span', { class: 'muted words' });
  const count = () => { const n = (ta.value.trim().match(/\S+/g) || []).length; words.textContent = `${n} word${n === 1 ? '' : 's'}`; };
  ta.addEventListener('input', count);

  const brief = el('details', { class: 'brief' },
    el('summary', {}, 'Brief', el('span', { class: 'muted', text: ' summary · purpose · open questions · cast' })),
    el('div', { class: 'brief-body' },
      d.summary ? el('p', {}, el('b', { text: 'Summary. ' }), d.summary) : null,
      d.purpose ? el('p', {}, el('b', { text: 'Purpose. ' }), d.purpose) : null,
      (d.open || []).length ? el('p', {}, el('b', { text: 'Open. ' }), d.open.join(' · ')) : null,
      (d.characters || []).length ? el('p', {}, el('b', { text: 'Cast. ' }), d.characters.map(id => charName(id) || id).join(', ')) : null,
      d.location || heading ? el('p', {}, el('b', { text: 'Where. ' }), heading || locName(d.location) || d.location) : null,
      d.notes ? el('p', { class: 'muted' }, el('b', { text: 'Notes. ' }), d.notes) : null));

  $main.replaceChildren(
    el('div', { class: 'toolbar write-head' },
      el('button', { class: 'btn ghost small', text: '← Board', onclick: () => { location.hash = 'scenes'; } }),
      el('button', { class: 'btn ghost small', text: 'Scene details', title: 'open the side panel', onclick: () => go('scenes', current.file) }),
      el('button', { class: 'btn ghost small', text: '+ Heading', title: heading ? `insert "${heading}" at the cursor` : 'set Setting / Location / Time in scene details first', onclick: insertHeading }),
      el('h1', {}, d.title || '(untitled)'),
      el('span', { class: 'strand', dataset: { strand: d.strand }, text: d.strand || '?' }),
      el('span', { class: 'file muted', text: `data/scenes/${current.file}` }),
      el('div', { class: 'spacer' }),
      words,
      el('span', { class: 'saved', id: 'saved', text: '' }),
      el('label', { class: 'inline-status' }, 'status ', status)),
    el('div', { class: 'write-wrap' }, brief, ta)
  );
  count(); grow(); ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

function characterEditor() {
  const others = db.characters.filter(c => c.data && c.file !== current.file)
    .map(c => ({ value: idOf(c.file), label: c.data.name })).sort((a, b) => a.label.localeCompare(b.label));
  return el('div', { class: 'pbody' },
    field('Images', imagesField({ hero: true }), 'first image is the cover'),
    el('div', { class: 'row3' },
      field('Age 1943', textInput('age_1943')),
      field('Name', textInput('name')),
      field('Id', el('input', { type: 'text', value: idOf(current.file), readonly: true, class: 'ro' }), 'file name, fixed')),
    el('div', { class: 'row' },
      field('Role', textInput('role'), 'one line'),
      field('Fate', textInput('fate'), '† / ★')),
    field('Known facts', objListField('known', [
      { key: 'fact', label: 'fact', width: '3fr', multiline: true }, { key: 'source', label: 'source', width: '1fr', multiline: true }
    ], { addLabel: 'known fact', defaultSource: '' }), 'each with a source'),
    field('Invented', linesArea('invented', 'tall'), 'one per line; can be thrown out'),
    field('Arc', textArea('arc', 'tall'), 'Markdown'),
    field('Relationships', objListField('relationships', [
      { key: 'character', label: 'character', width: '1fr', options: others }, { key: 'label', label: 'label', width: '1fr' }
    ], { addLabel: 'relationship' })),
    field('Sketch', textArea('sketch', 'sketch'), 'half-formed ideas, no structure'),
    field('Notes', textArea('notes', 'tall'), 'Markdown'),
    usedBy('characters', idOf(current.file))
  );
}

function locationEditor() {
  return el('div', { class: 'pbody' },
    field('Images', imagesField({ hero: true }), 'first image is the cover'),
    el('div', { class: 'row3' },
      field('Real?', boolSelect('real', 'real', 'invented')),
      field('Name', textInput('name')),
      field('Id', el('input', { type: 'text', value: idOf(current.file), readonly: true, class: 'ro' }), 'file name, fixed')),
    field('Description', textArea('description', 'tall'), 'Markdown'),
    field('Sketch', textArea('sketch', 'sketch'), 'half-formed ideas, no structure'),
    field('Notes', textArea('notes', 'tall'), 'Markdown'),
    usedBy('locations', idOf(current.file))
  );
}

function researchEditor() {
  return el('div', { class: 'pbody' },
    el('div', { class: 'row' },
      field('Title', textInput('title')),
      field('Id', el('input', { type: 'text', value: idOf(current.file), readonly: true, class: 'ro' }), 'file name, fixed')),
    field('Source', textArea('source'), 'where it comes from'),
    field('Summary', textArea('summary', 'tall'), 'Markdown'),
    field('Touches scenes', idListField('scenes', db.scenes, sceneName, 'Add scene…')),
    field('Touches characters', idListField('characters', db.characters, charName, 'Add character…')),
    field('Sketch', textArea('sketch', 'sketch'), 'half-formed ideas, no structure'),
    field('Notes', textArea('notes', 'tall'), 'Markdown'),
    field('Images', imagesField())
  );
}

// ---------------------------------------------------------------- go

route();
