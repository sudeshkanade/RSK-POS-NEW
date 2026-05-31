import { NextResponse } from 'next/server';
import { prisma } from '../../../../db';
import { getRestaurantId } from '../../../../services/license.server';


export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const restaurantId = getRestaurantId();
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'SETTLED',
        createdAt: { gte: today },
      },
      include: { items: true },
    });

    // 1. Calculate live totals
    const liveRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const covers = orders.length; // Each order = one cover/party served
    const orderCount = orders.length;

    // 2. Hourly breakdown
    const hourlyMap: Record<number, number> = {};
    for (let i = 10; i <= 21; i++) hourlyMap[i] = 0; // 10 AM to 9 PM baseline
    
    orders.forEach(o => {
      const h = o.createdAt.getHours();
      if (hourlyMap[h] !== undefined) {
        hourlyMap[h] += o.subtotal;
      }
    });

    const hourly = Object.entries(hourlyMap).map(([h, rev]) => {
      const hour = parseInt(h);
      const label = hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`;
      return { h: label, rev };
    });

    // 3. Top Items
    const itemsMap: Record<string, { qty: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        if (!i.isVoided) {
          const key = i.menuItem; // 'menuItem' is the OrderItem field (not 'name')
          if (!itemsMap[key]) itemsMap[key] = { qty: 0, revenue: 0 };
          itemsMap[key].qty += i.qty;
          itemsMap[key].revenue += i.price * i.qty;
        }
      });
    });

    const topItems = Object.entries(itemsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      revenue: liveRevenue,
      covers,
      orderCount,
      hourly,
      topItems
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
