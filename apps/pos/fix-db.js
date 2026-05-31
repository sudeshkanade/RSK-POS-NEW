const { PrismaClient } = require('./src/generated/prisma-client');

async function fix() {
  const p = new PrismaClient();
  const badCat330 = await p.category.findFirst({ where: { name: '330ML BEER' } });
  const badCat500 = await p.category.findFirst({ where: { name: '500ML BEER' } });

  const snacksCat = await p.category.create({ data: { name: 'SNACKS & DRINKS', restaurantId: 'rsk-restaurant-001', sortOrder: 100 } });

  const toMove = [
    'BOIL SHENGDANA', 'NACHANA PAPAD', 'HALDIRAM', 'LOCAL SNACKS', 'MINERAL WATER', 'WAFERS',
    'BOOM', 'CHARGED', 'COLD-DRINKS', 'SODA', 'RED BULL', 'JIRA'
  ];

  const items = await p.menuItem.findMany({
    where: { categoryId: { in: [badCat330?.id, badCat500?.id].filter(Boolean) } }
  });

  for (const item of items) {
    if (toMove.some(t => item.name.includes(t))) {
      const cleanName = item.name.replace(' 330ML', '').replace(' 500ML', '');
      await p.menuItem.update({
        where: { id: item.id },
        data: { name: cleanName, categoryId: snacksCat.id }
      });
      console.log('Fixed: ' + cleanName);
    }
  }

  p.$disconnect();
}
fix();
