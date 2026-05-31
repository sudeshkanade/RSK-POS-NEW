import { prisma } from '../src/db';

async function main() {
  try {
    console.log('Connecting to Prisma...');
    const users = await prisma.user.findMany();
    console.log('--- ALL USERS IN DB ---');
    console.log(users);
    
    const restaurants = await prisma.restaurant.findMany();
    console.log('--- ALL RESTAURANTS IN DB ---');
    console.log(restaurants);
  } catch (e) {
    console.error('Error running script:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
