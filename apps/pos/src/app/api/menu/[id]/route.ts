import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { isAvailable, name, price, shortcutKey, description } = body;

    const updated = await prisma.menuItem.update({
      where: { id: resolvedParams.id },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(shortcutKey !== undefined && { shortcutKey: shortcutKey || null }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.menuItem.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
