/**
 * Populate apps/api/public/uploads with the catalogue's photography.
 *
 * The 270 images ship with the repository, in prisma/seed-images. They are
 * SOURCE DATA — they arrived with the catalogue import and every product row
 * points at one — so they belong in version control, unlike the uploads
 * directory itself, which is where the client's own photographs land and is
 * therefore gitignored.
 *
 * That directory used to be filled by downloading from the source listing's
 * CDN at deploy time. It is not, any more, because the CDN answers a
 * datacenter IP with HTTP 444 after the first few requests: a production
 * deploy would get eight images and 262 failures, which is worse than useless
 * — the rows exist, so the site renders broken pictures rather than the
 * designed "photograph pending" plate.
 *
 *   npm run images:fetch              copy anything missing
 *   npm run images:fetch -- --force   recopy everything
 *   npm run images:fetch -- --remote  re-download from the source CDN
 *
 * Run it before `npm run db:seed`: the seed writes rows pointing at
 * /uploads/…, and a row whose file is absent shows the pending plate.
 */
import { writeFile, mkdir, access, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCTS } from './catalogue-data';

/** Run from the repo root, where the workspace scripts live. */
const UPLOADS = path.join(process.cwd(), 'apps', 'api', 'public', 'uploads');
const SEED_IMAGES = path.join(process.cwd(), 'prisma', 'seed-images');

const FORCE = process.argv.includes('--force');
const REMOTE = process.argv.includes('--remote');
const CONCURRENCY = 8;

// The source serves these only with a browser-shaped request, and increasingly
// not even then.
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

  const haveLocal = await exists(SEED_IMAGES);
  if (!haveLocal && !REMOTE) {
    console.error(
      `No prisma/seed-images directory at ${SEED_IMAGES}.\n` +
        'Run with --remote to download from the source CDN instead.'
    );
    process.exitCode = 1;
    return;
  }

  let copied = 0;
  let downloaded = 0;
  let skipped = 0;
  const failed: Job[] = [];

  const queue = [...jobs];
  async function worker() {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      const name = path.basename(job.file);
      const dest = path.join(UPLOADS, name);

      if (!FORCE && (await exists(dest))) {
        skipped += 1;
        continue;
      }

      // The repository's own copy first: no network, no rate limit, no
      // difference between a laptop and a deploy host.
      if (!REMOTE) {
        const src = path.join(SEED_IMAGES, name);
        if (await exists(src)) {
          await copyFile(src, dest);
          copied += 1;
          continue;
        }
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
        console.warn(`  failed ${name}: ${(e as Error).message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const parts = [
    `${copied} copied from prisma/seed-images`,
    downloaded > 0 ? `${downloaded} downloaded` : null,
    `${skipped} already present`,
    `${failed.length} failed`,
  ].filter(Boolean);
  console.log(`Images: ${parts.join(', ')} (${jobs.length} total).`);

  if (failed.length) {
    console.error(
      `\n${failed.length} image(s) could not be placed. The seed will still run, ` +
        'but those products will show the "photograph pending" plate.'
    );
    process.exitCode = 1;
  }
}

run();
