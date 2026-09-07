'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getCart, getCartOwner } from '@/lib/cart';
import { makeOrderNumber } from '@/lib/utils';

export type CheckoutState = { error?: string };

/**
 * Thrown inside the checkout transaction when a variant sold out between the
 * pre-flight check and the write. Throwing rolls the whole transaction back,
 * so a losing race leaves no half-placed order behind.
 */
class SoldOutError extends Error {
  constructor(
    readonly productName: string,
    readonly variantLabel: string
  ) {
    super('sold out during checkout');
  }
}

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number.'),
  line1: z.string().trim().min(4, 'Enter the building and street.'),
  line2: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter the city.'),
  state: z.string().trim().min(2, 'Enter the state.'),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Enter a 6-digit PIN code.'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  saveAddress: z.string().optional(),
});

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const cart = await getCart();
  if (cart.items.length === 0) return { error: 'Your cart is empty.' };

  // Re-check stock at the moment of ordering, not at the moment of adding.
  // A cart can sit for days; the shelf does not wait for it.
  for (const item of cart.items) {
    if (item.variant.stock < item.quantity) {
      return {
        error: `${item.variant.product.name} (${item.variant.label}) only has ${item.variant.stock} left. Adjust your cart and try again.`,
      };
    }
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const d = parsed.data;

  let addressId: string | null = null;
  if (userId && d.saveAddress) {
    const address = await db.address.create({
      data: {
        userId,
        fullName: d.fullName,
        phone: d.phone,
        line1: d.line1,
        line2: d.line2 || null,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
      },
    });
    addressId = address.id;
  }

  const orderNumber = makeOrderNumber();

  // One transaction: the order, its lines, the stock decrement and the cart
  // clear either all happen or none do. A half-placed order is worse than a
  // failed one.
  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          email: d.email,
          phone: d.phone,
          addressId,
          shipName: d.fullName,
          shipLine1: d.line1,
          shipLine2: d.line2 || null,
          shipCity: d.city,
          shipState: d.state,
          shipPincode: d.pincode,
          notes: d.notes || null,
          subtotalPaise: cart.subtotalPaise,
          shippingPaise: cart.shippingPaise,
          totalPaise: cart.totalPaise,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantLabel: item.variant.label,
              sku: item.variant.sku,
              unitPricePaise: item.variant.pricePaise,
              quantity: item.quantity,
              lineTotalPaise: item.variant.pricePaise * item.quantity,
            })),
          },
        },
      });

      for (const item of cart.items) {
        // Conditional decrement, not a blind one. The pre-flight check above
        // reads stock outside the transaction, so two customers checking out
        // the last unit at the same moment can both pass it. Making the WHERE
        // clause carry the condition means the database, not the read, decides
        // who gets it — and the loser rolls back instead of driving stock
        // negative. (SQLite serialises writes and would hide this; Postgres,
        // which this ships on, would not.)
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new SoldOutError(item.variant.product.name, item.variant.label);
        }
      }

      const { userId: ownerId, sessionId } = await getCartOwner();
      await tx.cartItem.deleteMany({
        where: ownerId ? { userId: ownerId } : { sessionId: sessionId! },
      });

      return created;
    });
  } catch (error) {
    if (error instanceof SoldOutError) {
      return {
        error: `${error.productName} (${error.variantLabel}) sold out while you were checking out. Nothing has been charged or placed — adjust your cart and try again.`,
      };
    }
    throw error;
  }

  revalidatePath('/', 'layout');
  redirect(`/order/${order.orderNumber}`);
}
