/**
 * Restore apps/api/public/uploads from the catalogue's recorded image sources.
 *
 * The API owns media as well as data — it is the app that serves /uploads —
 * and that directory is gitignored, because it is upload storage rather than
 * source. So a fresh clone seeds product rows whose image paths point at files
 * that are not there. This script re-downloads them from the sources recorded
 * alongside each product in catalogue-data.ts.
 *
 *   npm run images:fetch          download anything missing
 *   npm run images:fetch -- --force   re-download everything
 *
 * Run it before `npm run db:seed` on a machine that has not imported before.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCTS } from './catalogue-data';

// Run from the repo root, where the workspace scripts live.
const UPLOADS = path.join(process.cwd(), 'apps', 'api', 'public', 'uploads');
const FORCE = process.argv.includes('--force');
const CONCURRENCY = 8;

// The source serves these only with a browser-shaped request.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Referer: 'https://www.fireoxinesafetyindustries.in/',
};

type Job = { file: string; source: string };

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  await mkdir(UPLOADS, { recursive: true });

  const jobs: Job[] = [];
  for (const product of PRODUCTS) {
    product.images.forEach((file, i) => {
      const source = product.imageSources[i];
      if (source) jobs.push({ file, source });
    });
  }

  let downloaded = 0;
  let skipped = 0;
  const failed: Job[] = [];

  const queue = [...jobs];
  async function worker() {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      const dest = path.join(UPLOADS, path.basename(job.file));
      if (!FORCE && (await exists(dest))) {
        skipped += 1;
        continue;
      }
      try {
        const res = await fetch(job.source, { headers: HEADERS });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        // Anything this small is an error page, not a photograph.
        if (buf.byteLength < 1200) throw new Error(`only ${buf.byteLength} bytes`);
        await writeFile(dest, buf);
        downloaded += 1;
      } catch (e) {
        failed.push(job);
        console.warn(`  failed ${path.basename(job.file)}: ${(e as Error).message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(
    `Images: ${downloaded} downloaded, ${skipped} already present, ${failed.length} failed ` +
      `(${jobs.length} total).`
  );
  if (failed.length) process.exitCode = 1;
}

run();
