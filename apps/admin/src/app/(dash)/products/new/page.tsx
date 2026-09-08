import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { apiGetOr } from '@/lib/api';
import { ProductForm } from '@/components/ProductForm';
import type { FireClassDto } from '@fireoxine/types';

type Taxonomy = {
  categories: { id: string; name: string }[];
  hazards: { id: string; name: string }[];
  fireClasses: FireClassDto[];
};

export const metadata: Metadata = { title: 'New product · Admin' };

export default async function NewProductPage() {
  const { categories, hazards, fireClasses } = await apiGetOr<Taxonomy>(
    '/api/admin/taxonomy',
    { categories: [], hazards: [], fireClasses: [] }
  );

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Products
      </Link>

      <h1 className="fx-display mt-4 text-4xl">New product</h1>
      <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
        Create the product first, then add capacities and photographs on the next screen.
      </p>

      <div className="mt-10">
        <ProductForm
          values={{
            name: '',
            slug: '',
            sku: '',
            categoryId: '',
            shortDescription: '',
            description: '',
            medium: 'ABC_POWDER',
            standardCode: '',
            warrantyNote: '',
            refillMonths: '',
            electricalRatingKv: '',
            isIsiMarked: false,
            safeOnLiveElectrical: false,
            isFeatured: false,
            isActive: true,
            classStates: {},
            hazardIds: [],
          }}
          categories={categories}
          hazards={hazards}
          fireClasses={fireClasses}
        />
      </div>
    </div>
  );
}
