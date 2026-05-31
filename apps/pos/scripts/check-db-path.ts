import fs from 'fs';
import path from 'path';

console.log('Current Working Directory (cwd):', process.cwd());
const possiblePaths = [
  path.resolve('./pos.db'),
  path.resolve('./prisma/pos.db'),
  path.resolve('../pos.db'),
  path.join(process.env.APPDATA || '', 'RestroOS', 'pos.db'),
];

possiblePaths.forEach(p => {
  console.log(`Path: ${p} - Exists: ${fs.existsSync(p)}`);
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    console.log(`  Size: ${stats.size} bytes`);
  }
});
