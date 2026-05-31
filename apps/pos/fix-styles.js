const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

walkDir(path.join(__dirname, 'src', 'components'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace extremely heavy typography with more readable ones
  content = content.replace(/font-black italic uppercase tracking-tighter/g, 'font-bold uppercase tracking-tight');
  content = content.replace(/font-black italic/g, 'font-bold');
  content = content.replace(/italic tracking-tighter/g, 'tracking-tight');
  content = content.replace(/font-black/g, 'font-bold');
  
  // Fix massive rounded corners that cut off text
  content = content.replace(/rounded-\[3rem\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[40px\]/g, 'rounded-xl');

  // Fix buttons getting cut off
  content = content.replace(/w-32 h-32 blur-\[40px\]/g, 'w-24 h-24 blur-[30px]'); // reduce background blob size so it doesn't distract

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed styles in:', filePath);
  }
});
