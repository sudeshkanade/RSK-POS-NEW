import { PrismaClient } from '../src/generated/prisma-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting menu migration from previous RSK POS...');

  const seedsPath = path.resolve('C:\\Users\\Sudesh\\RSK Services\\backend\\seeds.json');
  if (!fs.existsSync(seedsPath)) {
    console.error(`❌ Seeds file not found at: ${seedsPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(seedsPath, 'utf-8');
  const oldSeeds = JSON.parse(fileContent);

  const restaurantId = 'rsk-restaurant-001';

  // 1. Update Restaurant details from old settings
  const oldSettings = oldSeeds.settings || {};
  const restaurant = await prisma.restaurant.upsert({
    where: { id: restaurantId },
    update: {
      name: oldSettings.hotel_name || 'RSK Solutions POS',
      address: oldSettings.hotel_address || '123 Test Block, City',
      phone: oldSettings.hotel_contact || '9270724809',
    },
    create: {
      id: restaurantId,
      name: oldSettings.hotel_name || 'RSK Solutions POS',
      address: oldSettings.hotel_address || '123 Test Block, City',
      phone: oldSettings.hotel_contact || '9270724809',
    },
  });
  console.log(`✓ Updated Restaurant configuration: ${restaurant.name}`);

  // 2. Load and Upsert Staff
  const oldStaff = oldSeeds.staff || [];
  for (let i = 0; i < oldStaff.length; i++) {
    const [username, pin] = oldStaff[i];
    const role = username.toLowerCase() === 'admin' ? 'ADMIN' : username.toLowerCase() === 'manager' ? 'MANAGER' : 'STAFF';
    await prisma.user.upsert({
      where: { id: `user-old-${i + 1}` },
      update: { pin: String(pin), role },
      create: {
        id: `user-old-${i + 1}`,
        name: username.toUpperCase(),
        pin: String(pin),
        role,
        restaurantId,
      },
    });
  }
  console.log(`✓ Migrated ${oldStaff.length} Staff records`);

  // 3. Load and Upsert Categories
  const uniqueCategories = new Set<string>();
  const oldMenuItems = oldSeeds.menu_items || [];
  oldMenuItems.forEach((item: any) => {
    if (item[3]) uniqueCategories.add(item[3]);
  });

  const categoryMap = new Map<string, string>();
  let catIndex = 1;
  for (const catName of Array.from(uniqueCategories)) {
    const catId = `cat-old-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    await prisma.category.upsert({
      where: { id: catId },
      update: { sortOrder: catIndex },
      create: {
        id: catId,
        name: catName,
        sortOrder: catIndex++,
        restaurantId,
      },
    });
    categoryMap.set(catName, catId);
  }
  console.log(`✓ Migrated ${uniqueCategories.size} unique categories`);

  // 4. Load and Upsert Inventory
  const oldInventory = oldSeeds.inventory || [];
  const inventoryIdMap = new Map<number, string>(); // index (1-based) -> new ID
  for (let i = 0; i < oldInventory.length; i++) {
    const [name, unit, stockQuantity, costPrice, category] = oldInventory[i];
    const invId = `inv-old-${i + 1}`;
    await prisma.inventoryItem.upsert({
      where: { id: invId },
      update: {
        stockLevel: parseFloat(stockQuantity),
        costPerUnit: parseFloat(costPrice),
      },
      create: {
        id: invId,
        name,
        unit,
        category: category || 'General',
        stockLevel: parseFloat(stockQuantity),
        minQty: 10,
        costPerUnit: parseFloat(costPrice),
        restaurantId,
      },
    });
    inventoryIdMap.set(i + 1, invId);
  }
  console.log(`✓ Migrated ${oldInventory.length} Inventory items`);

  // 5. Load and Upsert Menu Items
  const menuItemIdMap = new Map<number, string>(); // index (1-based) -> new ID
  for (let i = 0; i < oldMenuItems.length; i++) {
    const [name, base, pour, cat, targetPrice, liq, gst, sc] = oldMenuItems[i];
    const catId = categoryMap.get(cat);
    if (!catId) continue;

    const itemId = `mi-old-${i + 1}`;
    const description = pour ? `Volume/Pour: ${pour}` : `Category: ${cat}`;
    
    await prisma.menuItem.upsert({
      where: { id: itemId },
      update: {
        price: parseFloat(targetPrice),
        shortcutKey: sc ? String(sc) : null,
      },
      create: {
        id: itemId,
        name,
        description,
        price: parseFloat(targetPrice),
        shortcutKey: sc ? String(sc) : null,
        categoryId: catId,
      },
    });
    menuItemIdMap.set(i + 1, itemId);
  }
  console.log(`✓ Migrated ${oldMenuItems.length} Menu items`);

  // 6. Load and Upsert Recipes (Liquor stock reduction linkage)
  const oldRecipes = oldSeeds.recipes || [];
  let recipeCount = 0;
  for (const rec of oldRecipes) {
    const [menuItemIdx, inventoryIdx, quantityRequired] = rec;
    const menuItemId = menuItemIdMap.get(menuItemIdx);
    const inventoryItemId = inventoryIdMap.get(inventoryIdx);

    if (menuItemId && inventoryItemId) {
      // Find or create recipe link
      const recipeLink = await prisma.recipe.findFirst({
        where: { menuItemId, inventoryItemId },
      });

      if (!recipeLink) {
        await prisma.recipe.create({
          data: {
            menuItemId,
            inventoryItemId,
            quantity: parseFloat(quantityRequired),
          },
        });
      } else {
        await prisma.recipe.update({
          where: { id: recipeLink.id },
          data: { quantity: parseFloat(quantityRequired) },
        });
      }
      recipeCount++;
    }
  }
  console.log(`✓ Migrated ${recipeCount} recipe linkage records`);
  console.log('\n🎉 RSK Services Menu and Configurations migrated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
