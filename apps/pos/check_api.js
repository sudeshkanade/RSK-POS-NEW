const { getRestaurantId } = require('./src/services/license.server');
const { PrismaClient } = require('./src/generated/prisma-client');
const prisma = new PrismaClient();

async function main() {
  const rid = getRestaurantId();
  console.log('Resolved restaurantId:', rid);
  
  const staff = await prisma.user.findMany({
    where: { restaurantId: rid },
    select: { id: true, name: true, role: true, isActive: true }
  });
  console.log('Staff matching restaurantId:', staff);
  
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, isActive: true, restaurantId: true }
  });
  console.log('All Users in DB:', allUsers);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
