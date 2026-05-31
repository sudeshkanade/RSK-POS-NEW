import { PrismaClient } from '../apps/pos/src/generated/prisma-client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.table.count();
  console.log('Table count:', count);
  const tables = await prisma.table.findMany();
  console.log('Tables:', tables);
  
  const categories = await prisma.category.findMany({ include: { items: true } });
  console.log('Categories & Items:', categories);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
