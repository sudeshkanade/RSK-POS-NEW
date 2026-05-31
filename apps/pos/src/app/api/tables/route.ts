import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

export async function GET() {
  try {
    const restaurantId = getRestaurantId();
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: [{ section: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(tables);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const body = await req.json();
    const table = await prisma.table.create({
      data: {
        name: body.name,
        section: body.section,
        capacity: body.capacity ?? 4,
        posX: body.posX ?? 50,
        posY: body.posY ?? 50,
        restaurantId,
      },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
