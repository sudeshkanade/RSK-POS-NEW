const fs = require('fs');

const md = fs.readFileSync('c:/Users/Sudesh/Downloads/WhatsApp Image 2026-05-31 at 8.13.49 PM (1)_smallpdf.md', 'utf-8');

const lines = md.split('\n');
const menu = [];
let currentCategory = 'General';

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('|-') || line.includes('---')) continue;

  if (line.startsWith('|')) {
    const parts = line.split('|').slice(1, -1).map(p => p.replace(/\*\*/g, '').replace(/<br>/g, ' ').trim());
    
    // Check if it's a category header (all non-empty cells are identical)
    const nonEmpty = parts.filter(p => p);
    if (nonEmpty.length > 0 && nonEmpty.every(p => p === nonEmpty[0])) {
      currentCategory = nonEmpty[0];
      continue;
    }

    // Ignore header rows
    if (parts.join(' ').includes('BRAND NAME') || parts.join(' ').includes('STRONG BEER') || parts.join(' ').includes('WAFERS')) {
      continue;
    }

    if (['WHISKY', 'MML ALL BRANDS', 'RUM', 'BRANDY', 'GIN', 'VODAKA'].includes(currentCategory)) {
      if (parts[0]) {
        const name = parts[0];
        if (parts[1]) menu.push({ category: currentCategory, name: name + ' NIP', price: parseFloat(parts[1]) });
        if (parts[2]) menu.push({ category: currentCategory, name: name + ' 90ML PACK', price: parseFloat(parts[2]) });
        if (parts[3]) menu.push({ category: currentCategory, name: name + ' 90ML', price: parseFloat(parts[3]) });
        if (parts[4]) menu.push({ category: currentCategory, name: name + ' 60ML', price: parseFloat(parts[4]) });
        if (parts[5]) menu.push({ category: currentCategory, name: name + ' 30ML', price: parseFloat(parts[5]) });
      }
    } else if (currentCategory === '650ML BEER') {
      if (parts[0]) menu.push({ category: currentCategory, name: parts[0] + ' 650ML', price: parseFloat(parts[1]) });
      if (parts[2] && parts[2] !== 'MILD BEER') menu.push({ category: currentCategory, name: parts[2] + ' 650ML', price: parseFloat(parts[3]) });
    } else if (currentCategory === '500/330 ML BEER') {
      if (parts[0]) menu.push({ category: '330ML BEER', name: parts[0] + ' 330ML', price: parseFloat(parts[1]) });
      if (parts[2]) menu.push({ category: '500ML BEER', name: parts[2] + ' 500ML', price: parseFloat(parts[3] ? parts[3].split('/')[0].trim() : 0) });
    } else if (currentCategory === 'COLD DRINKS & SNACKS/ WATER' || currentCategory === 'COLD DRINKS &') {
      const cat = 'SNACKS & DRINKS';
      if (parts[0]) menu.push({ category: cat, name: parts[0], price: parseFloat(parts[1]) });
      if (parts[2]) menu.push({ category: cat, name: parts[2], price: parseFloat(parts[3] ? parts[3].split('/')[0].trim() : 0) });
    }
  }
}

// Write to seed data file
const code = `
export const NEW_MENU_ITEMS = ${JSON.stringify(menu.filter(m => m.name && m.price && !isNaN(m.price)), null, 2)};
`;
fs.writeFileSync('newMenuData.json', code);
console.log('Extracted ' + menu.length + ' items');
