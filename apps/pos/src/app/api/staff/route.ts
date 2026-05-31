import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../db';
import { getRestaurantId } from '../../../services/license.server';

export async function GET() {
  try {
    const restaurantId = getRestaurantId();
    console.log('--- API /api/staff GET ---');
    console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);
    console.log('restaurantId:', restaurantId);
    const staff = await prisma.user.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, role: true, isActive: true, updatedAt: true, createdAt: true }
    });
    
    const formatted = staff.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      isActive: s.isActive,
      lastActive: s.updatedAt.getTime() !== s.createdAt.getTime()
        ? new Date(s.updatedAt).toLocaleDateString('en-IN')
        : 'Never',
    }));
    
    return NextResponse.json(formatted);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const restaurantId = getRestaurantId();
    const { name, role, username, password } = await req.json();
    if (!name || !role) return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });

    const user = await prisma.user.create({
      data: {
        name,
        role,
        username: username?.trim().toLowerCase() || name.trim().toLowerCase(),
        pin: password || null,
        isActive: true,
        restaurantId,
      },
      select: { id: true, name: true, role: true, isActive: true, updatedAt: true, createdAt: true }
    });

    return NextResponse.json({
      id: user.id, name: user.name, role: user.role,
      isActive: user.isActive, lastActive: 'Never',
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, isActive, name, role, username, password } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(name && { name }),
        ...(role && { role }),
        ...(username !== undefined && { username: username?.trim().toLowerCase() || null }),
        ...(password !== undefined && { pin: password || null }),
      },
      select: { id: true, name: true, role: true, isActive: true }
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
