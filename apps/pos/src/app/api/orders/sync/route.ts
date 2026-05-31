import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';
import { getRestaurantId } from '../../../../services/license.server';

const RESTAURANT_ID_FALLBACK = 'rsk-restaurant-001';

export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId() || RESTAURANT_ID_FALLBACK;
    const body = await req.json();
    const { tableId, items } = body;

    if (!tableId) {
      return NextResponse.json({ error: 'tableId is required' }, { status: 400 });
    }

    const activeItems = (items || []).filter((i: any) => !i.isVoided);
    const subtotal = activeItems.reduce((s: number, i: any) => s + i.price * i.qty, 0);

    // Fetch GST settings
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });
    const settings = restaurant?.settings ? JSON.parse(restaurant.settings) : {};
    const gstRate: number = typeof settings.gstRate === 'number' ? settings.gstRate : 0;
    const tax = Math.round(subtotal * gstRate) / 100;
    const total = subtotal + tax;

    const result = await prisma.$transaction(async (tx) => {
      // Find existing pending order for this table
      let order = await tx.order.findFirst({
        where: {
          tableId,
          status: 'PENDING',
          restaurantId,
        },
      });

      if (!order) {
        // Create new pending order
        order = await tx.order.create({
          data: {
            tableId,
            restaurantId,
            subtotal,
            tax,
            total,
            status: 'PENDING',
            items: {
              create: (items || []).map((i: any) => ({
                menuItem: i.name,
                qty: i.qty,
                price: i.price,
                isVoided: i.isVoided || false,
                voidReason: i.voidReason || null,
                voidedById: i.voidedBy || null,
              })),
            },
          },
        });
      } else {
        // Update existing order
        // 1. Delete all existing items of this order
        await tx.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        // 2. Recreate them matching the new state
        await tx.order.update({
          where: { id: order.id },
          data: {
            subtotal,
            tax,
            total,
            version: { increment: 1 },
            syncStatus: 'PENDING',
            items: {
              create: (items || []).map((i: any) => ({
                menuItem: i.name,
                qty: i.qty,
                price: i.price,
                isVoided: i.isVoided || false,
                voidReason: i.voidReason || null,
                voidedById: i.voidedBy || null,
              })),
            },
          },
        });
      }

      // Update table status based on whether there are active items left
      const hasActiveItems = activeItems.length > 0;
      await tx.table.update({
        where: { id: tableId },
        data: {
          status: hasActiveItems ? 'OCCUPIED' : 'VACANT',
          syncStatus: 'PENDING',
          version: { increment: 1 },
        },
      });

      return order;
    });

    return NextResponse.json({ success: true, orderId: result.id });
  } catch (e) {
    console.error('Order sync failed:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
