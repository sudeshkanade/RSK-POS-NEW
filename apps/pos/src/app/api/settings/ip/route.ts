import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    const networkInterfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (!interfaces) continue;
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          if (localIp.startsWith('192.168.')) {
            break;
          }
        }
      }
    }
    
    return NextResponse.json({ ip: localIp });
  } catch (e) {
    return NextResponse.json({ ip: '127.0.0.1', error: String(e) });
  }
}
