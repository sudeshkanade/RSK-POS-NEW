import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '../../../services/sync.service.server';

export async function POST(req: NextRequest) {
  try {
    await syncService.runSync();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Just a connectivity check
    return NextResponse.json({ online: true });
  } catch (e) {
    return NextResponse.json({ online: false });
  }
}
