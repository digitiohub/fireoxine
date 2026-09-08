'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, Trash2, Star, Loader2, ImagePlus } from 'lucide-react';
import { deleteProductImage, setPrimaryImage } from '@/actions/admin';
import { mediaUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Img = { id: string; url: string; alt: string; isPrimary: boolean };

/**
 * The screen the client will spend most of their time in. Product photography
 * does not exist at handover, so this is the tool that ends that state.
 *
 * Drag-and-drop plus a file picker, multiple files at once, per-file progress,
 * and honest per-file errors — an upload that silently drops the third of five
 * images is worse than one that refuses all five.
 */
export function ImageUploader({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: Img[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [pending, startTransition] = useTransition();

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(list.length);
    let succeeded = 0;

    for (const file of list) {
      const body = new FormData();
      body.append('file', file);
      body.append('productId', productId);
      body.append('alt', `${productName} — product photograph`);

      try {
        const response = await fetch('/api/upload', { method: 'POST', body });
        const json = await response.json();
        if (!response.ok) {
          toast.error(`${file.name}: ${json.error ?? 'Upload failed.'}`);
        } else {
          succeeded += 1;
        }
      } catch {
        toast.error(`${file.name}: could not reach the server.`);
      }
      setUploading((n) => n - 1);
    }

    if (succeeded > 0) {
      toast.success(`${succeeded} ${succeeded === 1 ? 'image' : 'images'} uploaded.`);
      router.refresh();
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (imageId: string) => {
    startTransition(async () => {
      const result = await deleteProductImage(imageId);
      if (result.ok) {
        toast.success(result.message ?? 'Removed.');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not remove.');
      }
    });
  };

  const makePrimary = (imageId: string) => {
    startTransition(async () => {
      const result = await setPrimaryImage(imageId);
      if (result.ok) {
        toast.success(result.message ?? 'Primary set.');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not set primary.');
      }
    });
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-wedge bg-wedge/[0.06]' : 'border-rule-strong bg-ground-raised'
        )}
      >
        {uploading > 0 ? (
          <>
            <Loader2 className="size-7 animate-spin text-wedge" aria-hidden="true" />
            <p className="fx-num mt-4 text-sm text-ink">
              Uploading {uploading} {uploading === 1 ? 'image' : 'images'}…
            </p>
          </>
        ) : (
          <>
            <ImagePlus className="size-7 text-ink-faint" aria-hidden="true" />
            <p className="fx-display mt-4 text-lg">Drop photographs here</p>
            <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-muted">
              JPEG, PNG, WebP or AVIF, up to 8 MB each. The first image you upload becomes the one
              shown on cards and listings.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="fx-wedge mt-6"
            >
              <Upload className="size-4" aria-hidden="true" />
              Choose files
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => e.target.files && void upload(e.target.files)}
          className="sr-only"
          aria-label="Choose product photographs"
        />
      </div>

      {images.length > 0 && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="border border-rule bg-ground-raised">
              <div className="relative aspect-square border-b border-rule">
                <Image
                  src={mediaUrl(image.url)!}
                  alt={image.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {image.isPrimary && (
                  <span className="fx-stencil absolute left-0 top-0 bg-wedge px-2 py-0.5 text-[0.55rem] text-wedge-ink">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <button
                  type="button"
                  onClick={() => makePrimary(image.id)}
                  disabled={image.isPrimary || pending}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
                >
                  <Star
                    className={cn('size-3.5', image.isPrimary && 'fill-current text-wedge')}
                    aria-hidden="true"
                  />
                  {image.isPrimary ? 'Primary' : 'Set primary'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(image.id)}
                  disabled={pending}
                  aria-label={`Delete image ${image.alt}`}
                  className="grid size-7 place-items-center text-ink-faint transition-colors hover:text-wedge"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
