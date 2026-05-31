import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

export async function GET() {
  try {
    const restaurantId = getRestaurantId();
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    
    const settings = restaurant.settings ? JSON.parse(restaurant.settings) : {};
    return NextResponse.json({
      name: restaurant.name,
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      gstNo: restaurant.gstNo || '',
      ...settings,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const body = await req.json();
    const { name, address, phone, gstNo, printerIp, paperWidth, terminalId, shiftStart, gstRate } = body;

    const settings = JSON.stringify({ printerIp, paperWidth, terminalId, shiftStart, gstRate: gstRate ?? 0 });

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { name, address, phone, gstNo, settings, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, name: updated.name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
