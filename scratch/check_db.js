const { PrismaClient } = require('C:\\Users\\Sudesh\\RSK New\\packages\\database\\generated\\client');
const prisma = new PrismaClient();

async function check() {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: 'rsk-restaurant-001' }
    });
    if (restaurant) {
      console.log('✅ Restaurant found:', restaurant.name);
    } else {
      console.log('❌ Restaurant NOT found. Creating default...');
      await prisma.restaurant.create({
        data: {
          id: 'rsk-restaurant-001',
          name: 'RSK Solutions Demo',
          isActive: true
        }
      });
      console.log('✅ Default restaurant created.');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
