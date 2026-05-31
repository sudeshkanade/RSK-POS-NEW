import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

// GET /api/orders?tableId=xxx  — get active orders (optionally filtered by table)
export async function GET(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const tableId = req.nextUrl.searchParams.get('tableId');
    const status  = req.nextUrl.searchParams.get('status') || 'PENDING';

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status,
        ...(tableId ? { tableId } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/orders — create new order and deduct inventory
export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const body = await req.json();
    const { tableId, items, status, paymentMethod } = body;
    const settledById: string | null = body.settledBy || null;

    const activeItems = (items as any[]).filter(i => !i.isVoided);
    const subtotal = activeItems.reduce((s, i) => s + i.price * i.qty, 0);

    // Pull GST rate from restaurant settings (default 0 if not configured)
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });
    const settings = restaurant?.settings ? JSON.parse(restaurant.settings) : {};
    const gstRate: number = typeof settings.gstRate === 'number' ? settings.gstRate : 0;
    const tax = Math.round(subtotal * gstRate) / 100;
    const total = subtotal + tax;

    // Use a transaction to ensure atomic order creation and inventory deduction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          tableId,
          restaurantId,
          subtotal,
          tax,
          total,
          status: status || 'PENDING',
          paymentMethod: paymentMethod || null,
          settledById,
          items: {
            create: (items as any[]).map(i => ({
              menuItem: i.name,
              qty: i.qty,
              price: i.price,
              isVoided: i.isVoided || false,
              voidReason: i.voidReason || null,
              voidedById: i.voidedBy || null,
            })),
          },
        },
        include: { items: true },
      });

      // 1b. Mark other pending orders on this table as settled
      if (status === 'SETTLED') {
        await tx.order.updateMany({
          where: {
            tableId,
            status: 'PENDING',
            restaurantId,
          },
          data: {
            status: 'SETTLED',
          },
        });
      }

      // 2. Deduct inventory based on recipes (only on settlement)
      if (status === 'SETTLED') {
        for (const item of activeItems) {
          const menuItem = await tx.menuItem.findFirst({
            where: {
              name: item.name,  // OrderItems store item.name; the id field is a client-side timestamp, not the DB id
            },
            include: { recipes: true },
          });

          if (menuItem && menuItem.recipes.length > 0) {
            for (const recipe of menuItem.recipes) {
              await tx.inventoryItem.update({
                where: { id: recipe.inventoryItemId },
                data: {
                  stockLevel: { decrement: recipe.quantity * item.qty },
                  version: { increment: 1 },
                  syncStatus: 'PENDING',
                },
              });
            }
          }
        }
      }

      // 3. Update table status
      if (tableId) {
        const tableStatus = status === 'SETTLED' ? 'VACANT' : 'OCCUPIED';
        await tx.table.update({
          where: { id: tableId },
          data: { status: tableStatus, syncStatus: 'PENDING', version: { increment: 1 } },
        });
      }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error('Order creation failed:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
