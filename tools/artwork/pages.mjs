import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = 'tools/artwork/svg';
const out = 'tools/artwork/raster';
mkdirSync(out, { recursive: true });
const files = readdirSync(dir).filter((f) => f.endsWith('.svg'));
const list = [];
for (const f of files) {
  const svg = readFileSync(`${dir}/${f}`, 'utf8');
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const name = f.replace('.svg', '');
  writeFileSync(`${out}/${name}.html`, `<!doctype html><meta charset=utf8>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;padding:0;overflow:hidden}svg{display:block;width:${w}px;height:${h}px}</style>${svg}`);
  list.push({ name, w: +w, h: +h });
}
writeFileSync(`${out}/index.json`, JSON.stringify(list, null, 2));
console.log(`${list.length} raster pages`);
