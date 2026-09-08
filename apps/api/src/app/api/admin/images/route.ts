import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

/**
 * Uploads land in the API's own public directory, because the API is the app
 * that owns media as well as data. Both clients render them from API_URL, so
 * there is exactly one copy of every file on disk.
 */
const MAX_BYTES = 8 * 1024 * 1024;

// Allow-list by both MIME type and magic bytes. A Content-Type header is
// supplied by the client and is not evidence of anything on its own.
const ALLOWED: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/avif': { ext: 'avif', magic: [[0x00, 0x00, 0x00]] },
};

function matchesMagic(buffer: Buffer, signatures: number[][]) {
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const form = await request.formData();
  const file = form.get('file');
  const productId = form.get('productId');
  const alt = String(form.get('alt') ?? '').trim();

  if (!(file instanceof File)) return err('No file received.');
  if (file.size > MAX_BYTES) {
    return err(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 8 MB.`);
  }

  const spec = ALLOWED[file.type];
  if (!spec) return err('Use a JPEG, PNG, WebP or AVIF image.');

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesMagic(buffer, spec.magic)) {
    return err('That file is not the image type it claims to be.');
  }

  // Filename is generated, never taken from the upload — an attacker-supplied
  // name is a path traversal waiting to happen.
  const name = `${crypto.randomBytes(16).toString('hex')}.${spec.ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  const url = `/uploads/${name}`;

  if (typeof productId === 'string' && productId) {
    const existing = await db.productImage.count({ where: { productId } });
    const image = await db.productImage.create({
      data: {
        productId,
        url,
        alt: alt || 'FireOxine product photograph',
        position: existing,
        // The first image uploaded for a product becomes its primary.
        isPrimary: existing === 0,
      },
    });
    return ok({ url, imageId: image.id }, { status: 201 });
  }

  return ok({ url, imageId: null }, { status: 201 });
}
