const sqlite3 = require('sqlite3').verbose();
import { PrismaClient } from '../src/generated/prisma-client';

const prisma = new PrismaClient();
const OLD_DB_PATH = 'C:\\Users\\Sudesh\\RSK Services\\backend\\pos.sqlite';

async function migrate() {
  console.log(`Connecting to old database at ${OLD_DB_PATH}...`);
  
  const oldDb = new sqlite3.Database(OLD_DB_PATH, sqlite3.OPEN_READONLY, (err: any) => {
    if (err) {
      console.error('Failed to open old database:', err.message);
      process.exit(1);
    }
  });

  const getRows = (query: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      oldDb.all(query, [], (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // 1. Get or create a default Restaurant to tie the records to
    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: 'RestroOS Migrated',
          address: 'Migrated from Old System'
        }
      });
      console.log(`Created default restaurant: ${restaurant.name} (${restaurant.id})`);
    } else {
      console.log(`Using existing restaurant: ${restaurant.name} (${restaurant.id})`);
    }

    const restId = restaurant.id;

    // 2. Migrate Categories
    console.log('Migrating categories...');
    const oldCategories = await getRows('SELECT * FROM categories');
    console.log(`Found ${oldCategories.length} categories.`);
    
    // Create a map to lookup category IDs in the new DB by name
    const categoryMap = new Map<string, string>();
    
    for (const oldCat of oldCategories) {
      const existing = await prisma.category.findFirst({
        where: { name: oldCat.name, restaurantId: restId }
      });
      if (existing) {
        categoryMap.set(oldCat.name, existing.id);
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: oldCat.name,
            sortOrder: oldCat.sort_order || 0,
            restaurantId: restId
          }
        });
        categoryMap.set(newCat.name, newCat.id);
      }
    }
    console.log('Categories migrated.');

    // 3. Migrate Menu Items
    console.log('Migrating menu items...');
    const oldMenuItems = await getRows('SELECT * FROM menu_items');
    console.log(`Found ${oldMenuItems.length} menu items.`);
    
    for (const oldItem of oldMenuItems) {
      // Find the corresponding new category ID
      const newCatId = categoryMap.get(oldItem.category);
      if (!newCatId) {
        console.warn(`Skipping item ${oldItem.name} because its category '${oldItem.category}' wasn't found.`);
        continue;
      }

      const existing = await prisma.menuItem.findFirst({
        where: { name: oldItem.name, categoryId: newCatId }
      });

      if (!existing) {
        await prisma.menuItem.create({
          data: {
            name: oldItem.name,
            price: oldItem.selling_price || 0,
            categoryId: newCatId,
            shortcutKey: oldItem.shortcut || null,
            isAvailable: oldItem.active === 1 ? true : false,
            description: oldItem.base_name ? `Base: ${oldItem.base_name}` : null
          }
        });
      }
    }
    console.log('Menu items migrated.');

    // 4. Migrate Inventory
    console.log('Migrating inventory...');
    const oldInventory = await getRows('SELECT * FROM inventory');
    console.log(`Found ${oldInventory.length} inventory items.`);
    
    for (const oldInv of oldInventory) {
      const existing = await prisma.inventoryItem.findFirst({
        where: { name: oldInv.name, restaurantId: restId }
      });

      if (!existing) {
        await prisma.inventoryItem.create({
          data: {
            name: oldInv.name,
            unit: oldInv.unit || 'unit',
            category: oldInv.category || 'General',
            stockLevel: oldInv.stock_quantity || 0,
            costPerUnit: oldInv.cost_price || 0,
            restaurantId: restId
          }
        });
      }
    }
    console.log('Inventory migrated.');

    console.log('Migration complete!');
    oldDb.close();
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    oldDb.close();
    process.exit(1);
  }
}

migrate();
