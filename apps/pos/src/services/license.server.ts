import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

function getMachineId(): string {
  let identifiers: string[] = [];
  try {
    const uuid = execSync('wmic csproduct get uuid', { timeout: 1000, windowsHide: true }).toString().split('\n')[1]?.trim();
    if (uuid && uuid.length > 10) identifiers.push(uuid);
  } catch (e) {}

  try {
    const mb = execSync('wmic baseboard get serialnumber', { timeout: 1000, windowsHide: true }).toString().split('\n')[1]?.trim();
    if (mb && mb.length > 5 && mb !== 'To be filled by O.E.M.') identifiers.push(mb);
  } catch (e) {}

  try {
    const disk = execSync('wmic diskdrive get serialnumber', { timeout: 1000, windowsHide: true }).toString().split('\n')[1]?.trim();
    if (disk && disk.length > 5) identifiers.push(disk);
  } catch (e) {}

  if (identifiers.length > 0) {
    return crypto.createHash('sha256').update(identifiers.join('-')).digest('hex');
  }
  // Final resort fallback — deterministic from hostname, stable across restarts
  const hostname = os.hostname() + '-rsk-restroos';
  return 'FALLBACK-' + crypto.createHash('sha256').update(hostname).digest('hex').substring(0, 16);
}

const MACHINE_ID = getMachineId();
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const SECRET_SALT = 'rsk-restroos-salt-2026';

function getEncryptionKey() {
  return crypto.scryptSync(MACHINE_ID, SECRET_SALT, 32);
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

export function getRestaurantId(): string {
  if (fs.existsSync(LICENSE_FILE)) {
    try {
      const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
      const decrypted = decrypt(encrypted);
      const data = JSON.parse(decrypted);
      return data.restaurantId || 'rsk-restaurant-001';
    } catch (e) {}
  }
  return 'rsk-restaurant-001';
}
