import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

const RESTAURANT_ID_FALLBACK = 'rsk-restaurant-001';

export async function GET(req: Request) {
  try {
    const restaurantId = getRestaurantId() || RESTAURANT_ID_FALLBACK;
    const url = new URL(req.url);
    const includeAll = url.searchParams.get('all') === 'true';
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: includeAll ? {} : { isAvailable: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, price: true, shortcutKey: true, description: true, isAvailable: true },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, price, categoryId, shortcutKey, description } = await req.json();
    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'name, price and categoryId are required' }, { status: 400 });
    }
    const item = await prisma.menuItem.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId,
        shortcutKey: shortcutKey || null,
        description: description || null,
        isAvailable: true,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
