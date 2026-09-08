/**
 * Bring a database up to the current catalogue, in one command.
 *
 *   npm run db:provision
 *
 * Written to be run from a deploy platform's container terminal, where there
 * is no local checkout to fall back on and a bare stack trace is not much help.
 * Each stage says what it is doing, and a failure says what to do about it.
 *
 * The three stages, in an order that matters:
 *
 *   1. migrate   the schema has to exist before anything is written
 *   2. images    the seed writes rows pointing at /uploads/…, so the files
 *                have to be in place first, or products render the
 *                "photograph pending" plate instead of a photograph
 *   3. seed      categories, products, variants, images, FAQs and settings
 *
 * SAFE TO RE-RUN, DESTRUCTIVE TO DATA. The seed deletes every row it manages
 * before inserting — products, categories, settings, orders and users
 * included. It is a first-run command, not an update. Once the client has
 * edited copy or taken an order, change things in the back office instead.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const ROOT = process.cwd();

/**
 * On a deploy platform the environment is already set, but on a laptop it
 * lives in .env — and Prisma's own CLI reads that file while this script would
 * not, which would have it report "DATABASE_URL is not set" a moment before
 * the migration connected successfully. Same file, same rules, no dependency.
 */
function loadDotEnv() {
  for (const file of ['.env', path.join('apps', 'api', '.env')]) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, 'utf8').split('\n')) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue; // real env always wins
      process.env[key] = raw.trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadDotEnv();

/** Resolve a CLI from node_modules/.bin, walking up from the working directory. */
function bin(name: string): string {
  let dir = ROOT;
  for (let i = 0; i < 5; i += 1) {
    const candidate = path.join(dir, 'node_modules', '.bin', name);
    if (existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  // Fall back to PATH; npm puts node_modules/.bin there for `npm run`.
  return name;
}

function stage(n: number, of: number, label: string) {
  console.log(`\n[${n}/${of}] ${label}`);
}

function run(cmd: string, args: string[]): boolean {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: process.env });
  return res.status === 0;
}

function fail(message: string, hint?: string): never {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`\n${hint}`);
  process.exit(1);
}

/**
 * Reach the database before doing anything, because "cannot connect" is by far
 * the commonest failure here and Prisma's P1001 does not say why. On a
 * container platform the answer is almost always that the app and the database
 * are on different Docker networks.
 */
async function checkDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    fail(
      'DATABASE_URL is not set.',
      'Set it on this service and redeploy. It is the internal connection URL\n' +
        'from the database resource — the one with the service name in it, not\n' +
        'localhost.'
    );
  }

  let host: string;
  let port: number;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    port = Number(parsed.port || 5432);
  } catch {
    fail(`DATABASE_URL is not a valid URL: ${url.replace(/:[^:@]*@/, ':***@')}`);
  }

  console.log(`    connecting to ${host}:${port} …`);

  const reachable = await new Promise<boolean>((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.on('connect', () => done(true));
    socket.on('error', () => done(false));
    socket.setTimeout(8000, () => done(false));
  });

  if (!reachable) {
    fail(
      `Cannot reach the database at ${host}:${port}.`,
      'The database is almost certainly on a different Docker network from this\n' +
        'container. Two ways to fix it:\n\n' +
        '  · In Coolify, enable "Connect to Predefined Network" on BOTH the\n' +
        '    database resource and this application, then redeploy. This one\n' +
        '    survives the database container being recreated.\n\n' +
        '  · Or, from a shell ON THE SERVER (not in this container — containers\n' +
        '    have no docker command):\n\n' +
        `        docker network connect <app-network> ${host}\n\n` +
        '    Find the network with: docker inspect <this-container> \\\n' +
        '      --format \'{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}\'\n\n' +
        'If the host does not resolve at all, check the database is running.'
    );
  }
  console.log('    reachable ✓');
}

async function main() {
  console.log('FireOxine — provisioning the catalogue.');

  stage(1, 4, 'Checking the database');
  await checkDatabase();

  stage(2, 4, 'Applying migrations');
  if (!run(bin('prisma'), ['migrate', 'deploy'])) {
    fail('Migrations failed.', 'The output above says why. Nothing has been seeded.');
  }

  stage(3, 4, 'Placing catalogue photography');
  if (!run(bin('tsx'), [path.join('prisma', 'fetch-catalogue-images.ts')])) {
    fail(
      'Some images could not be placed.',
      'The seed has NOT run. Products whose file is missing would render the\n' +
        '"photograph pending" plate rather than a photograph, so it is worth\n' +
        'fixing first. Re-run once resolved.'
    );
  }

  stage(4, 4, 'Seeding the catalogue');
  if (!run(bin('tsx'), [path.join('prisma', 'seed.ts')])) {
    fail('Seeding failed.', 'The output above says why.');
  }

  console.log(
    '\n✓ Done. Check the API with:\n' +
      '    curl -s http://localhost:3002/api/health\n' +
      '  and expect "products":132.\n\n' +
      '  Then sign in to the back office as admin@fireoxine.in / admin1234\n' +
      '  and CHANGE THAT PASSWORD.'
  );
}

main();
