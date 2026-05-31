import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

export async function GET(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    
    // 1. Fetch recent OrderItem voids & settlements
    const items = await prisma.orderItem.findMany({
      where: { order: { restaurantId } },
      include: {
        order: {
          select: { table: true, createdAt: true, status: true, settledById: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // 2. Fetch generic system and manager audit logs
    const genericLogs = await prisma.auditLog.findMany({
      where: { restaurantId },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Collect all unique user IDs to resolve names (excluding names resolved via genericLogs)
    const userIds = new Set<string>();
    items.forEach(item => {
      if (item.voidedById) userIds.add(item.voidedById);
      if (item.order.settledById) userIds.add(item.order.settledById);
    });
    genericLogs.forEach(log => {
      if (log.approvedById) userIds.add(log.approvedById);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    // Map OrderItems
    const mappedItems = items.map(item => ({
      rawDate: item.updatedAt,
      timestamp: item.updatedAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      action: item.isVoided ? 'ITEM VOID' : item.order.status === 'SETTLED' ? 'SETTLE' : 'ORDER',
      user: item.isVoided
        ? (userMap[item.voidedById || ''] || 'Unknown')
        : (userMap[item.order.settledById || ''] || 'System'),
      details: `${item.menuItem}${item.isVoided ? ` — ${item.voidReason}` : ''} @ ${item.order.table?.name || 'Walk-in'}`,
      color: item.isVoided ? 'rose' : item.order.status === 'SETTLED' ? 'emerald' : 'sky',
    }));

    // Map Generic Audit Logs
    const mappedGeneric = genericLogs.map(log => {
      const approvedByName = log.approvedById ? userMap[log.approvedById] : null;
      return {
        rawDate: log.createdAt,
        timestamp: log.createdAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        action: log.action,
        user: log.user.name + (approvedByName ? ` (Auth: ${approvedByName})` : ''),
        details: log.details,
        color: log.action.includes('VOID') || log.action.includes('DELETE') ? 'amber' : 'orange',
      };
    });

    // Combine and sort
    const combined = [...mappedItems, ...mappedGeneric]
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      .slice(0, 50)
      .map(({ rawDate, ...rest }) => rest);

    return NextResponse.json(combined);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const body = await req.json();
    const { action, details, userId, approvedById } = body;

    if (!action || !details || !userId) {
      return NextResponse.json({ error: 'Missing required fields: action, details, userId' }, { status: 400 });
    }

    const newLog = await prisma.auditLog.create({
      data: {
        action,
        details,
        userId,
        approvedById,
        restaurantId,
      },
    });

    return NextResponse.json(newLog);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
