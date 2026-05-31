import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = { syncStatus: 'PENDING', version: { increment: 1 } };

    if (body.status   !== undefined) update.status   = body.status;
    if (body.posX     !== undefined) update.posX     = body.posX;
    if (body.posY     !== undefined) update.posY     = body.posY;
    if (body.section  !== undefined) update.section  = body.section;
    if (body.name     !== undefined) update.name     = body.name;
    if (body.capacity !== undefined) update.capacity = body.capacity;

    const table = await prisma.table.update({
      where: { id },
      data: update,
    });
    return NextResponse.json(table);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
