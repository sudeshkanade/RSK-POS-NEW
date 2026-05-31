import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';

// PATCH /api/orders/[id] — update order status, add items, set payment method
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = { syncStatus: 'PENDING', version: { increment: 1 } };

    if (body.status        !== undefined) update.status        = body.status;
    if (body.paymentMethod !== undefined) update.paymentMethod = body.paymentMethod;
    if (body.closedAt      !== undefined) update.closedAt      = new Date(body.closedAt);

    // Note: totals (subtotal/tax/total) are computed at order creation time and are immutable.
    // Do NOT recalculate here, as that would use a different (potentially wrong) GST rate.

    const order = await prisma.order.update({
      where: { id },
      data: update,
      include: { items: true },
    });

    // Sync table status
    if (body.tableStatus && order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: body.tableStatus, syncStatus: 'PENDING', version: { increment: 1 } },
      });
    }

    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/orders/[id]/settle handled below via query param action
// GET /api/orders/[id] — get single order
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
