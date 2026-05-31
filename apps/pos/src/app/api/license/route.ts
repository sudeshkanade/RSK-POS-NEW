import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Get a unique hardware ID using fast, reliable methods only
// Avoids slow wmic calls that could timeout (1-3 seconds each)
function getMachineId(): string {
  const parts: string[] = [];

  // 1. Machine hostname — always available, zero latency
  const hostname = os.hostname();
  if (hostname && hostname.length > 0) parts.push(hostname);

  // 2. Primary network interface MAC address — very fast
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      const net = nets[name];
      if (net) {
        for (const iface of net) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            parts.push(iface.mac);
            break;
          }
        }
      }
      if (parts.length >= 2) break;
    }
  } catch { /* ignore */ }

  // 3. Total memory as a stable hardware characteristic
  const mem = os.totalmem();
  if (mem > 0) parts.push(String(mem));

  if (parts.length > 0) {
    return crypto.createHash('sha256').update(parts.join('-')).digest('hex');
  }

  // Last resort — pure hostname fallback
  return 'FALLBACK-' + crypto.createHash('sha256').update(hostname + '-rsk-restroos').digest('hex').substring(0, 16);
}

// Cache the machine ID — compute it once per server process lifetime
const MACHINE_ID = getMachineId();
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const SECRET_SALT = 'rsk-restroos-salt-2026';

function getEncryptionKey() {
  return crypto.scryptSync(MACHINE_ID, SECRET_SALT, 32);
}

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const APPDATA_DIR = process.env.APPDATA || process.env.LOCALAPPDATA || path.join(process.cwd(), '.config');
const LICENSE_DIR = path.join(APPDATA_DIR, 'RestroOS');
const LICENSE_FILE = path.join(LICENSE_DIR, 'license.dat');

interface LicensePayload {
  installDate: number;
  key: string | null;
  restaurantId: string;
}

function getLicenseData(): LicensePayload {
  if (!fs.existsSync(LICENSE_DIR)) {
    fs.mkdirSync(LICENSE_DIR, { recursive: true });
  }

  if (fs.existsSync(LICENSE_FILE)) {
    try {
      const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted) as LicensePayload;
    } catch (e) {
      console.error('License decryption failed or corrupted file. Starting fresh trial.');
      // Delete corrupted file so a fresh trial is created
      try { fs.unlinkSync(LICENSE_FILE); } catch { /* ignore */ }
    }
  }

  // Create new trial
  const payload: LicensePayload = {
    installDate: Date.now(),
    key: null,
    restaurantId: 'rsk-restaurant-001',
  };
  try {
    fs.writeFileSync(LICENSE_FILE, encrypt(JSON.stringify(payload)));
  } catch (e) {
    console.error('Failed to write license file', e);
  }
  return payload;
}

function calculateLicenseStatus(data: LicensePayload) {
  if (data.key && data.key.startsWith('RSK-')) {
    return { status: 'ACTIVE', daysRemaining: 0, hardwareId: MACHINE_ID.substring(0, 8).toUpperCase(), restaurantId: data.restaurantId };
  }

  const elapsedMs = Date.now() - data.installDate;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remaining = 30 - elapsedDays;

  if (remaining <= 0) {
    return { status: 'EXPIRED', daysRemaining: 0, hardwareId: MACHINE_ID.substring(0, 8).toUpperCase(), restaurantId: data.restaurantId };
  }

  return { status: 'TRIAL', daysRemaining: remaining, hardwareId: MACHINE_ID.substring(0, 8).toUpperCase(), restaurantId: data.restaurantId };
}

export async function GET() {
  try {
    const data = getLicenseData();
    const result = calculateLicenseStatus(data);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, restaurantId } = await req.json();
    
    if (!key || !key.startsWith('RSK-') || key.length < 10) {
      return NextResponse.json({ error: 'Invalid Activation Key format' }, { status: 400 });
    }

    const data = getLicenseData();
    const result = calculateLicenseStatus(data);
    
    // Cryptographically validate that the activation key belongs to this machine's Hardware ID
    const expectedKey = 'RSK-' + crypto.createHash('sha256').update(result.hardwareId + '-rsk-secret-salt-2026').digest('hex').substring(0, 16).toUpperCase();
    
    if (key !== expectedKey) {
      return NextResponse.json({ error: 'Invalid Activation Key for this machine' }, { status: 400 });
    }

    data.key = key;
    if (restaurantId) data.restaurantId = restaurantId;

    fs.writeFileSync(LICENSE_FILE, encrypt(JSON.stringify(data)));

    return NextResponse.json({ success: true, ...calculateLicenseStatus(data) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
