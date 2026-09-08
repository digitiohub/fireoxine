import type { Prisma } from '@prisma/client';
import type {
  CartDto,
  CartItemDto,
  CategoryDto,
  FireClassDto,
  HazardDto,
  Medium,
  OrderDto,
  ProductCardDto,
  ProductDetailDto,
  VariantDto,
} from '@fireoxine/types';

/**
 * The boundary between the database and the wire. Prisma types stop here:
 * every route returns a DTO from @fireoxine/types, so a schema change that
 * would break a client shows up as a type error in this file rather than as a
 * runtime surprise in the storefront.
 */

/** Everything a ProductCard needs, and nothing it does not. */
export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  medium: true,
  isIsiMarked: true,
  standardCode: true,
  safeOnLiveElectrical: true,
  images: {
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
    take: 1,
    select: { url: true, alt: true },
  },
  variants: {
    orderBy: { position: 'asc' },
    select: { id: true, label: true, pricePaise: true, mrpPaise: true, stock: true },
  },
  fireClasses: {
    orderBy: { fireClass: { position: 'asc' } },
    select: { covers: true, fireClass: { select: { code: true, label: true } } },
  },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function toProductCard(p: ProductCardRow): ProductCardDto {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    medium: p.medium as Medium,
    isIsiMarked: p.isIsiMarked,
    standardCode: p.standardCode,
    safeOnLiveElectrical: p.safeOnLiveElectrical,
    image: p.images[0] ?? null,
    variants: p.variants,
    fireClasses: p.fireClasses.map((fc) => ({
      code: fc.fireClass.code,
      label: fc.fireClass.label,
      covers: fc.covers,
    })),
  };
}

export const productDetailInclude = {
  category: true,
  images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }] },
  variants: { orderBy: { position: 'asc' } },
  fireClasses: {
    orderBy: { fireClass: { position: 'asc' } },
    include: { fireClass: true },
  },
  hazards: { orderBy: { rank: 'asc' }, include: { hazard: true } },
} satisfies Prisma.ProductInclude;

type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

export function toVariant(v: ProductDetailRow['variants'][number]): VariantDto {
  return {
    id: v.id,
    label: v.label,
    capacity: v.capacity,
    capacityUnit: v.capacityUnit,
    sku: v.sku,
    pricePaise: v.pricePaise,
    mrpPaise: v.mrpPaise,
    stock: v.stock,
    isDefault: v.isDefault,
  };
}

export function toProductDetail(p: ProductDetailRow): ProductDetailDto {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    medium: p.medium as Medium,
    isIsiMarked: p.isIsiMarked,
    standardCode: p.standardCode,
    safeOnLiveElectrical: p.safeOnLiveElectrical,
    image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt } : null,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      pricePaise: v.pricePaise,
      mrpPaise: v.mrpPaise,
      stock: v.stock,
    })),
    fireClasses: p.fireClasses.map((fc) => ({
      code: fc.fireClass.code,
      label: fc.fireClass.label,
      covers: fc.covers,
    })),
    shortDescription: p.shortDescription,
    description: p.description,
    electricalRatingKv: p.electricalRatingKv,
    warrantyNote: p.warrantyNote,
    refillMonths: p.refillMonths,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    allVariants: p.variants.map(toVariant),
    hazards: p.hazards.map((h) => ({
      name: h.hazard.name,
      slug: h.hazard.slug,
      summary: h.hazard.summary,
      pictogram: h.hazard.pictogram,
    })),
  };
}

export function toCategory(
  c: Prisma.CategoryGetPayload<object> & { _count?: { products: number } }
): CategoryDto {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count?.products,
  };
}

export function toHazard(
  h: Prisma.HazardGetPayload<object> & { _count?: { products: number } }
): HazardDto {
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    summary: h.summary,
    description: h.description,
    pictogram: h.pictogram,
    imageUrl: h.imageUrl,
    productCount: h._count?.products,
  };
}

export function toFireClass(f: Prisma.FireClassGetPayload<object>): FireClassDto {
  return {
    id: f.id,
    code: f.code,
    label: f.label,
    description: f.description,
    example: f.example,
    position: f.position,
  };
}

export const cartItemInclude = {
  variant: {
    include: {
      product: {
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }], take: 1 },
          category: true,
        },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

type CartItemRow = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;

export function toCartItem(i: CartItemRow): CartItemDto {
  const image = i.variant.product.images[0];
  return {
    id: i.id,
    quantity: i.quantity,
    variant: {
      id: i.variant.id,
      label: i.variant.label,
      pricePaise: i.variant.pricePaise,
      mrpPaise: i.variant.mrpPaise,
      stock: i.variant.stock,
      sku: i.variant.sku,
      product: {
        id: i.variant.product.id,
        name: i.variant.product.name,
        slug: i.variant.product.slug,
        image: image ? { url: image.url, alt: image.alt } : null,
        categoryName: i.variant.product.category.name,
      },
    },
  };
}

export function emptyCart(freeAbovePaise: number): CartDto {
  return {
    items: [],
    subtotalPaise: 0,
    shippingPaise: 0,
    totalPaise: 0,
    count: 0,
    freeAbovePaise,
  };
}

export const orderInclude = { items: true } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function toOrder(o: OrderRow): OrderDto {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    phone: o.phone,
    shipName: o.shipName,
    shipLine1: o.shipLine1,
    shipLine2: o.shipLine2,
    shipCity: o.shipCity,
    shipState: o.shipState,
    shipPincode: o.shipPincode,
    status: o.status,
    subtotalPaise: o.subtotalPaise,
    shippingPaise: o.shippingPaise,
    totalPaise: o.totalPaise,
    notes: o.notes,
    placedAt: o.placedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantLabel: i.variantLabel,
      sku: i.sku,
      unitPricePaise: i.unitPricePaise,
      quantity: i.quantity,
      lineTotalPaise: i.lineTotalPaise,
    })),
  };
}
