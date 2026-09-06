// Langå screenplay tool — tiny Express server.
// Files are the truth. Every request reads from / writes to data/ directly.

const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const IMAGES = path.join(ROOT, 'images');
const TYPES = ['scenes', 'characters', 'locations', 'research'];
const PORT = process.env.PORT || 3210;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use('/images', express.static(IMAGES));
app.use(express.static(path.join(ROOT, 'public')));

// ---------- helpers ----------

function isType(t) { return TYPES.includes(t); }

function safeFile(name) {
  // one path segment, .json, no traversal
  if (typeof name !== 'string' || name.includes('/') || name.includes('\\') || name.includes('..')) return null;
  if (!name.endsWith('.json')) return null;
  return name;
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'untitled';
}

// scenes are not numbered; the file is named by slug and the running order lives in 'order' (set by dragging)
function sceneFileName(scene) {
  return `${slugify(scene.slug || scene.title)}.json`;
}

const bySceneOrder = (a, b) => (Number(a.data.order) || 0) - (Number(b.data.order) || 0);

async function atomicWrite(file, text) {
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, text, 'utf8');
  await fsp.rename(tmp, file);
}

function pretty(obj) { return JSON.stringify(obj, null, 2) + '\n'; }

async function readItem(type, file) {
  const p = path.join(DATA, type, file);
  const raw = await fsp.readFile(p, 'utf8');
  try {
    return { file, data: JSON.parse(raw) };
  } catch (e) {
    return { file, error: e.message, raw };
  }
}

async function listItems(type) {
  const dir = path.join(DATA, type);
  await fsp.mkdir(dir, { recursive: true });
  const names = (await fsp.readdir(dir)).filter(n => n.endsWith('.json')).sort();
  return Promise.all(names.map(n => readItem(type, n)));
}

function isRawBody(req) {
  return typeof req.body === 'string';
}

// ---------- framing ----------

const FRAMING_FILE = path.join(DATA, 'framing.json');

app.get('/api/framing', async (req, res) => {
  try {
    const raw = await fsp.readFile(FRAMING_FILE, 'utf8');
    try { res.json({ file: 'framing.json', data: JSON.parse(raw) }); }
    catch (e) { res.json({ file: 'framing.json', error: e.message, raw }); }
  } catch (e) {
    res.status(404).json({ error: 'framing.json not found' });
  }
});

app.put('/api/framing', async (req, res) => {
  try {
    if (isRawBody(req)) {
      await atomicWrite(FRAMING_FILE, req.body);
      try { return res.json({ file: 'framing.json', data: JSON.parse(req.body) }); }
      catch (e) { return res.json({ file: 'framing.json', error: e.message, raw: req.body }); }
    }
    await atomicWrite(FRAMING_FILE, pretty(req.body));
    res.json({ file: 'framing.json', data: req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- images ----------

async function walk(dir, base) {
  let out = [];
  let entries = [];
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.posix.join(base, ent.name);
    if (ent.isDirectory()) out = out.concat(await walk(full, rel));
    else if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(ent.name)) out.push(rel);
  }
  return out;
}

app.get('/api/images', async (req, res) => {
  res.json(await walk(IMAGES, 'images'));
});

// Upload one image. Body is the raw file; ?type=characters&id=ole_hovedskov&name=photo.jpg
// Lands in images/<type>/<id>/<name> (framing: images/framing/<name>). Never overwrites.
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
app.post('/api/upload', express.raw({ type: () => true, limit: '50mb' }), async (req, res) => {
  const { type, id, name } = req.query;
  const seg = s => typeof s === 'string' && /^[A-Za-z0-9_\-]+$/.test(s);
  if (!(isType(type) || type === 'framing') || (type !== 'framing' && !seg(id))) return res.status(400).json({ error: 'bad type or id' });
  const base = String(name || 'image').split(/[\\/]/).pop().replace(/[^A-Za-z0-9._\-æøåÆØÅ]+/g, '_');
  if (!IMAGE_EXT.test(base)) return res.status(400).json({ error: 'not an image file name' });
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'empty upload' });
  try {
    const dir = type === 'framing' ? path.join(IMAGES, 'framing') : path.join(IMAGES, type, id);
    await fsp.mkdir(dir, { recursive: true });
    const ext = path.extname(base), stem = base.slice(0, -ext.length);
    let file = base, n = 2;
    while (fs.existsSync(path.join(dir, file))) file = `${stem}_${n++}${ext}`;
    await fsp.writeFile(path.join(dir, file), req.body);
    res.status(201).json({ path: path.relative(ROOT, path.join(dir, file)).split(path.sep).join('/') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- scene running order ----------

// body: { files: [...] } in the wanted order; each scene's 'order' becomes its index. Only changed files are written.
app.post('/api/scenes/reorder', async (req, res) => {
  const files = Array.isArray(req.body && req.body.files) ? req.body.files.map(safeFile) : null;
  if (!files || files.some(f => !f)) return res.status(400).json({ error: 'files: array of scene file names' });
  try {
    let changed = 0;
    for (const [i, file] of files.entries()) {
      const p = path.join(DATA, 'scenes', file);
      if (!fs.existsSync(p)) continue;
      const item = await readItem('scenes', file);
      if (!item.data || item.data.order === i) continue;
      await atomicWrite(p, pretty({ ...item.data, order: i }));
      changed++;
    }
    res.json({ ok: true, changed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- script (locked scenes, Fountain) ----------

app.get('/api/script', async (req, res) => {
  const items = await listItems('scenes');
  const locked = items
    .filter(i => i.data && i.data.status === 'locked')
    .sort(bySceneOrder);
  const parts = locked.map(i => (i.data.script || '').trim()).filter(Boolean);
  res.type('text/plain').send(parts.join('\n\n') + (parts.length ? '\n' : ''));
});

// ---------- generic collections ----------

app.get('/api/:type', async (req, res) => {
  const { type } = req.params;
  if (!isType(type)) return res.status(404).json({ error: 'unknown type' });
  try { res.json(await listItems(type)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/:type', async (req, res) => {
  const { type } = req.params;
  if (!isType(type)) return res.status(404).json({ error: 'unknown type' });
  const data = req.body || {};
  let file;
  if (type === 'scenes') file = sceneFileName(data);
  else {
    // slug only names the file for these types; it is not a field of the item
    file = slugify(data.slug || data.name || data.title) + '.json';
    delete data.slug;
  }
  const p = path.join(DATA, type, file);
  try {
    await fsp.mkdir(path.dirname(p), { recursive: true });
    if (fs.existsSync(p)) return res.status(409).json({ error: `${file} already exists` });
    await atomicWrite(p, pretty(data));
    res.status(201).json({ file, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/:type/:file', async (req, res) => {
  const { type } = req.params;
  const file = safeFile(req.params.file);
  if (!isType(type) || !file) return res.status(404).json({ error: 'not found' });
  try { res.json(await readItem(type, file)); }
  catch (e) { res.status(404).json({ error: 'not found' }); }
});

app.put('/api/:type/:file', async (req, res) => {
  const { type } = req.params;
  const file = safeFile(req.params.file);
  if (!isType(type) || !file) return res.status(404).json({ error: 'not found' });
  const p = path.join(DATA, type, file);
  try {
    if (isRawBody(req)) {
      // raw text save (used to repair malformed files)
      await atomicWrite(p, req.body);
      return res.json(await readItem(type, file));
    }
    const data = req.body;
    let target = file;
    if (type === 'scenes') {
      target = sceneFileName(data);
      if (target !== file) {
        const tp = path.join(DATA, type, target);
        if (fs.existsSync(tp)) return res.status(409).json({ error: `${target} already exists` });
      }
    }
    const tp = path.join(DATA, type, target);
    await atomicWrite(tp, pretty(data));
    if (target !== file) await fsp.unlink(p).catch(() => {});
    res.json({ file: target, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/:type/:file', async (req, res) => {
  // never hard-delete: move to data/_trash/<type>/<timestamp>_<file>
  const { type } = req.params;
  const file = safeFile(req.params.file);
  if (!isType(type) || !file) return res.status(404).json({ error: 'not found' });
  const p = path.join(DATA, type, file);
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
  try {
    const trashDir = path.join(DATA, '_trash', type);
    await fsp.mkdir(trashDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(trashDir, stamp + '_' + file);
    await fsp.rename(p, dest);
    res.json({ file, trashed: path.relative(ROOT, dest).split(path.sep).join('/') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- start ----------

app.listen(PORT, () => {
  console.log(`Langå screenplay tool: http://localhost:${PORT}`);
});
