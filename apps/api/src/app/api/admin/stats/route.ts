import { db } from '@/lib/db';
import { forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import type { AdminStatsDto } from '@fireoxine/types';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const [
    products,
    activeProducts,
    categories,
    orders,
    pendingOrders,
    outOfStockVariants,
    productsWithoutImages,
    newEnquiries,
    newMessages,
    subscribers,
    revenue,
    recent,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    db.order.count(),
    db.order.count({ where: { status: 'PENDING' } }),
    db.productVariant.count({ where: { stock: 0 } }),
    db.product.count({ where: { images: { none: {} } } }),
    db.partnerEnquiry.count({ where: { status: 'NEW' } }),
    db.contactMessage.count({ where: { status: 'NEW' } }),
    db.newsletterSubscriber.count(),
    db.order.aggregate({
      _sum: { totalPaise: true },
      where: { status: { notIn: ['CANCELLED'] } },
    }),
    db.order.findMany({ orderBy: { placedAt: 'desc' }, take: 6, include: { items: true } }),
  ]);

  return ok<AdminStatsDto>({
    products,
    activeProducts,
    categories,
    orders,
    pendingOrders,
    outOfStockVariants,
    productsWithoutImages,
    newEnquiries,
    newMessages,
    subscribers,
    revenuePaise: revenue._sum.totalPaise ?? 0,
    recentOrders: recent.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      shipName: o.shipName,
      email: o.email,
      phone: o.phone,
      status: o.status,
      totalPaise: o.totalPaise,
      placedAt: o.placedAt.toISOString(),
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  });
}
