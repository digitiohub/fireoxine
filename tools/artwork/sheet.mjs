import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = 'tools/artwork/svg';
const files = readdirSync(dir).filter((f) => f.startsWith('product-')).sort();
const cells = files.map((f) => `
  <figure><div class="s">${readFileSync(`${dir}/${f}`, 'utf8')}</div>
  <figcaption>${f.replace('product-', '').replace('.svg', '')}</figcaption></figure>`).join('');
writeFileSync('tools/artwork/sheet.html', `<!doctype html><meta charset=utf8>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700&display=swap" rel="stylesheet">
<style>
 body{background:#EDE6D6;margin:0;padding:14px;font:11px Archivo,system-ui}
 .g{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
 figure{margin:0}
 .s{aspect-ratio:1;overflow:hidden;border:1px solid #14120f33}
 .s svg{width:100%;height:100%;display:block}
 figcaption{padding:4px 0;font-weight:700}
</style><div class=g>${cells}</div>`);
console.log(`sheet: ${files.length} renders`);
