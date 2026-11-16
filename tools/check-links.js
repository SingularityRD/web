// Checks every page in the site folder: internal links and anchors resolve,
// ids are unique, JSON-LD parses, and every <canvas data-art> has a painting.
// Usage (from the repository root): node tools/check-links.js .
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const art = fs.readFileSync(path.join(root, 'art.js'), 'utf8');
const scenes = new Set([...art.matchAll(/^\s{4}'?([\w-]+)'?: function \(p, W, H/gm)].map(m => m[1]));
const ids = {}, bad = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  const list = [...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  ids[f] = new Set(list);
  const dup = list.filter((x, i) => list.indexOf(x) !== i);
  if (dup.length) bad.push(`${f}: duplicate ids ${[...new Set(dup)].join(', ')}`);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { bad.push(`${f}: JSON-LD ${e.message}`); }
  }
  for (const m of s.matchAll(/data-art="([^"]+)"/g)) if (!scenes.has(m[1])) bad.push(`${f}: no painting "${m[1]}"`);
}
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of s.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:|\/sitemap)/.test(h)) continue;
    const [file, hash] = h.split('#');
    const target = file === '' ? f : file;
    if (!fs.existsSync(path.join(root, target))) { if (!/\.(svg|png|css|ico|xml|txt|webmanifest)$/.test(target)) bad.push(`${f}: missing file ${h}`); continue; }
    if (hash && hash !== 'top' && ids[target] && !ids[target].has(hash)) bad.push(`${f}: missing anchor ${h}`);
  }
}
console.log(files.length, 'pages;', scenes.size, 'paintings');
console.log(bad.length ? bad.join('\n') : 'all links, anchors, ids and JSON-LD ok');
