import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../db';

// POST /api/auth/login — authenticate with username + password
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const usernameClean = username.trim().toLowerCase();

    // Try matching on the explicit username field first
    let user = await prisma.user.findFirst({
      where: { isActive: true, username: usernameClean },
      select: { id: true, name: true, role: true, restaurantId: true, pin: true },
    });

    // Fallback: match by name (case-insensitive, for existing users without a username set)
    if (!user) {
      const byName = await prisma.user.findMany({
        where: { isActive: true, username: null },
        select: { id: true, name: true, role: true, restaurantId: true, pin: true },
      });
      user = byName.find(u => u.name.toLowerCase() === usernameClean) ?? null;
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Compare password against the pin field (which stores the password)
    if (user.pin !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, restaurantId: user.restaurantId },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
