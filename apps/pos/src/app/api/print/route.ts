import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

export async function POST(req: NextRequest) {
  try {
    const { text, printerIp = '192.168.1.100' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided to print' }, { status: 400 });
    }

    const PRINTER_PORT = 9100;

    // Send to printer via TCP
    const printPromise = new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(3000); // 3 seconds timeout

      client.on('error', (err) => {
        console.error('[Print Pipeline] Printer connection error:', err.message);
        client.destroy();
        resolve({ success: false, error: err.message });
      });

      client.on('timeout', () => {
        console.error('[Print Pipeline] Printer connection timed out');
        client.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      client.connect(PRINTER_PORT, printerIp, () => {
        console.log(`[Print Pipeline] Connected to ${printerIp}:${PRINTER_PORT}`);

        // ESC/POS Initialization
        const init = Buffer.from([0x1B, 0x40]);
        // Set standard line spacing
        const lineSpacing = Buffer.from([0x1B, 0x33, 30]); 
        
        // The text content
        const textBuf = Buffer.from(text + '\n\n\n\n\n', 'utf-8');
        
        // Full Cut command
        const cut = Buffer.from([0x1D, 0x56, 0x41, 0x10]);

        const payload = Buffer.concat([init, lineSpacing, textBuf, cut]);

        client.write(payload, () => {
          console.log(`[Print Pipeline] Payload sent (${payload.length} bytes)`);
          client.end();
          resolve({ success: true });
        });
      });
    });

    const result = await printPromise;

    if (!(result as any).success) {
      // We return 200 with success: false so the frontend can handle the printer offline gracefully
      // without throwing a massive fetch error that disrupts the user flow.
      return NextResponse.json({ success: false, message: 'Printer offline or unreachable', details: (result as any).error });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[Print Pipeline] Internal error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
