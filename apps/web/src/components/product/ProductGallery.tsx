'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PendingImage } from '@/components/product/PendingImage';
import { cn, mediaUrl } from '@/lib/utils';
import type { ImageDto } from '@fireoxine/types';

/**
 * The API returns images without ids — a gallery only needs the url and the
 * alt text, and the url is already unique per product.
 */
type Img = ImageDto;

export function ProductGallery({
  images,
  sku,
  name,
}: {
  images: Img[];
  sku: string;
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square border border-rule">
        <PendingImage sku={sku} label={name} />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden border border-rule bg-ground-raised">
        <Image
          src={mediaUrl(current.url)!}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cn(
                  'relative size-20 shrink-0 overflow-hidden border transition-colors',
                  i === active ? 'border-ink' : 'border-rule hover:border-ink-muted'
                )}
              >
                <Image
                  src={mediaUrl(image.url)!}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
