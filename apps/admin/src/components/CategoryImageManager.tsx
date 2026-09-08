'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { setCategoryImage } from '@/actions/admin';
import { mediaUrl } from '@/lib/utils';

export function CategoryImageManager({
  categoryId,
  name,
  imageUrl,
  productCount,
}: {
  categoryId: string;
  name: string;
  imageUrl: string | null;
  productCount: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const upload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error ?? 'Upload failed.');
      } else {
        const result = await setCategoryImage(categoryId, json.url);
        if (result.ok) {
          toast.success('Collection image set.');
          router.refresh();
        } else {
          toast.error(result.error ?? 'Could not save.');
        }
      }
    } catch {
      toast.error('Could not reach the server.');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex h-full flex-col border border-rule bg-ground-raised">
      <div className="relative aspect-[16/10] border-b border-rule bg-ground-sunk">
        {imageUrl ? (
          <Image src={mediaUrl(imageUrl)!} alt="" fill sizes="320px" className="object-cover" />
        ) : (
          <div className="fx-newsprint grid size-full place-items-center" aria-hidden="true">
            <span className="fx-display px-4 text-center text-xl leading-[0.9] text-ink/20">
              {name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="fx-display text-lg leading-tight">{name}</h3>
        <p className="fx-num mt-1 text-xs text-ink-faint">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || pending}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink disabled:text-ink-faint/50"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-3.5" aria-hidden="true" />
            )}
            {imageUrl ? 'Replace' : 'Upload'}
          </button>

          {imageUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await setCategoryImage(categoryId, null);
                  if (result.ok) {
                    toast.success('Image removed.');
                    router.refresh();
                  }
                })
              }
              className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-wedge"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
          className="sr-only"
          aria-label={`Upload artwork for ${name}`}
        />
      </div>
    </div>
  );
}
