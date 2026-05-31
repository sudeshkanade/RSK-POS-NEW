import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

export async function GET() {
  try {
    const restaurantId = getRestaurantId();
    const items = await prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(items.map(i => ({
      ...i,
      isLowStock: i.stockLevel < i.minQty,
    })));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const { name, unit, category, stockLevel, minQty, costPerUnit } = await req.json();
    if (!name || !unit) return NextResponse.json({ error: 'Name and unit are required' }, { status: 400 });

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        unit,
        category: category || 'General',
        stockLevel: stockLevel ?? 0,
        minQty: minQty ?? 10,
        costPerUnit: costPerUnit ?? 0,
        restaurantId,
      },
    });
    return NextResponse.json({ ...item, isLowStock: item.stockLevel < item.minQty }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, stockLevel } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { stockLevel, syncStatus: 'PENDING', version: { increment: 1 } },
    });
    return NextResponse.json({ ...item, isLowStock: item.stockLevel < item.minQty });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
