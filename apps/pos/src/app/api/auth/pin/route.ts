import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';

// POST /api/auth/pin — authenticate with 4-digit PIN
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { pin, isActive: true },
      select: { id: true, name: true, role: true, restaurantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
