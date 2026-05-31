const { PrismaClient } = require('./src/generated/prisma-client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('newMenuData.json', 'utf8'));
  const restaurantId = 'rsk-restaurant-001';

  // Group by category
  const cats = [...new Set(data.map(d => d.category))];

  for (let i = 0; i < cats.length; i++) {
    const cName = cats[i];
    let cat = await prisma.category.findFirst({
      where: { name: cName, restaurantId }
    });

    if (!cat) {
      cat = await prisma.category.create({
        data: { name: cName, restaurantId, sortOrder: i * 10 }
      });
      console.log('Created category: ' + cName);
    }

    const items = data.filter(d => d.category === cName);
    for (const item of items) {
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: cat.id }
      });

      if (existing) {
        if (existing.price !== item.price) {
          await prisma.menuItem.update({
            where: { id: existing.id },
            data: { price: item.price }
          });
          console.log('Updated price for ' + item.name + ' to ' + item.price);
        }
      } else {
        await prisma.menuItem.create({
          data: {
            name: item.name,
            price: item.price,
            categoryId: cat.id,
            isAvailable: true
          }
        });
        console.log('Inserted ' + item.name);
      }
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
