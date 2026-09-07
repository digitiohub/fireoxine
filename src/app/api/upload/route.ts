import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const productId = form.get('productId');
  const alt = String(form.get('alt') ?? '').trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 8 MB.` },
      { status: 400 }
    );
  }

  const spec = ALLOWED[file.type];
  if (!spec) {
    return NextResponse.json(
      { error: 'Use a JPEG, PNG, WebP or AVIF image.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesMagic(buffer, spec.magic)) {
    return NextResponse.json(
      { error: 'That file is not the image type it claims to be.' },
      { status: 400 }
    );
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
    return NextResponse.json({ url, imageId: image.id });
  }

  return NextResponse.json({ url });
}
