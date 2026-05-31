const { PrismaClient } = require('../apps/pos/src/generated/prisma-client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:c:/Users/Sudesh/RSK New/apps/pos/prisma/pos.db'
    }
  }
});

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- Users ---');
    console.log(users);

    const tables = await prisma.table.findMany();
    console.log('--- Tables ---');
    console.log(tables);

    const categories = await prisma.category.findMany();
    console.log('--- Categories ---');
    console.log(categories.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
