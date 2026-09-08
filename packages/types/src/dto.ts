// ------------------------------------------------------------------ enums
// Mirrored from the Prisma schema by hand. They are a published API contract
// as much as a database detail, and web/admin must not import @prisma/client.

export const MEDIUMS = [
  'ABC_POWDER',
  'BC_POWDER',
  'CO2',
  'MECHANICAL_FOAM',
  'WATER',
  'WATER_MIST',
  'CLEAN_AGENT',
  'WET_CHEMICAL',
  'D_CLASS_POWDER',
  'NOT_APPLICABLE',
] as const;
export type Medium = (typeof MEDIUMS)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ENQUIRY_STATUSES = ['NEW', 'CONTACTED', 'CLOSED'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type Role = 'CUSTOMER' | 'ADMIN';
export type FaqGroup = 'GENERAL' | 'PARTNER';

// --------------------------------------------------------------- envelope

/**
 * Every route answers in this shape. A client that gets `ok: false` has an
 * `error` it can show a person, and never has to guess from a status code.
 */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; fieldErrors?: Record<string, string> };
export type ApiResult<T> = ApiOk<T> | ApiErr;

// -------------------------------------------------------------- catalogue

export type ImageDto = { url: string; alt: string };

export type FireClassRefDto = { code: string; label: string; covers: boolean };

export type VariantDto = {
  id: string;
  label: string;
  capacity: number;
  capacityUnit: string;
  sku: string;
  pricePaise: number;
  mrpPaise: number | null;
  stock: number;
  isDefault: boolean;
};

/** Everything a product card needs, and nothing it does not. */
export type ProductCardDto = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  medium: Medium;
  isIsiMarked: boolean;
  standardCode: string | null;
  safeOnLiveElectrical: boolean;
  image: ImageDto | null;
  variants: Pick<VariantDto, 'id' | 'label' | 'pricePaise' | 'mrpPaise' | 'stock'>[];
  fireClasses: FireClassRefDto[];
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
};

export type HazardDto = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string | null;
  pictogram: string;
  imageUrl: string | null;
  productCount?: number;
  /**
   * The union of every class the recommended units cover, so a hazard card
   * can answer "what does this room need?" without loading its products.
   */
  coveredClasses?: { code: string; label: string }[];
};

export type FireClassDto = {
  id: string;
  code: string;
  label: string;
  description: string;
  example: string;
  position: number;
};

export type ProductDetailDto = ProductCardDto & {
  shortDescription: string;
  description: string;
  electricalRatingKv: number | null;
  warrantyNote: string | null;
  refillMonths: number | null;
  isActive: boolean;
  isFeatured: boolean;
  category: Pick<CategoryDto, 'id' | 'name' | 'slug'>;
  images: ImageDto[];
  allVariants: VariantDto[];
  hazards: Pick<HazardDto, 'name' | 'slug' | 'summary' | 'pictogram'>[];
};

// ----------------------------------------------------------------- facets

export type FacetOption = { value: string; label: string; count: number };
export type FilterGroups = {
  fireClass: FacetOption[];
  medium: FacetOption[];
  category: FacetOption[];
};

export type ProductListDto = {
  products: ProductCardDto[];
  filters: FilterGroups;
  total: number;
};

// ------------------------------------------------------------------- cart

export type CartItemDto = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    label: string;
    pricePaise: number;
    mrpPaise: number | null;
    stock: number;
    sku: string;
    product: {
      id: string;
      name: string;
      slug: string;
      image: ImageDto | null;
      categoryName: string;
    };
  };
};

export type CartDto = {
  items: CartItemDto[];
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  count: number;
  freeAbovePaise: number;
};

// ----------------------------------------------------------------- orders

export type OrderItemDto = {
  id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  status: OrderStatus;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  notes: string | null;
  /** ISO 8601. JSON has no date type; clients parse it. */
  placedAt: string;
  items: OrderItemDto[];
};

export type PlaceOrderInput = {
  email: string;
  phone: string;
  shipName: string;
  shipLine1: string;
  shipLine2?: string;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  notes?: string;
};

// ------------------------------------------------------------------- auth

export type SessionUserDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthTokenDto = {
  token: string;
  user: SessionUserDto;
  /** Seconds until the token expires, for the cookie's max-age. */
  expiresIn: number;
};

// --------------------------------------------------------------- inbound

export type ContactInput = { name: string; email: string; subject: string; message: string };
export type PartnerInput = {
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  state: string;
  gstNumber?: string;
  monthlyVolume?: string;
  message?: string;
};

export type EnquiryDto = {
  id: string;
  status: EnquiryStatus;
  createdAt: string;
} & Record<string, unknown>;

// ------------------------------------------------------------------- cms

export type FaqDto = { id: string; question: string; answer: string; group: FaqGroup };
export type SettingsDto = Record<string, string>;
export type SettingRowDto = { key: string; value: string; label: string; group: string };

// ----------------------------------------------------------------- admin

export type AdminStatsDto = {
  products: number;
  activeProducts: number;
  categories: number;
  orders: number;
  pendingOrders: number;
  outOfStockVariants: number;
  productsWithoutImages: number;
  newEnquiries: number;
  newMessages: number;
  subscribers: number;
  /** Excludes cancelled orders. */
  revenuePaise: number;
  recentOrders: AdminOrderRowDto[];
};

export type AdminProductRowDto = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  medium: Medium;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string;
  image: ImageDto | null;
  imageCount: number;
  variantCount: number;
  stock: number;
  fromPricePaise: number | null;
};

export type AdminOrderRowDto = {
  id: string;
  orderNumber: string;
  shipName: string;
  email: string;
  phone: string;
  status: OrderStatus;
  totalPaise: number;
  placedAt: string;
  itemCount: number;
};
