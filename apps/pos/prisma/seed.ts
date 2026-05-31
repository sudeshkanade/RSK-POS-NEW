import { PrismaClient } from '../src/generated/prisma-client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RestroOS database...');

  // ── Restaurant ──────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'rsk-restaurant-001' },
    update: {},
    create: {
      id: 'rsk-restaurant-001',
      name: 'RSK Restaurant',
      address: '123 Main Street, Bengaluru 560001',
      phone: '+91 98765 43210',
      gstNo: '29XXXXX1234X1ZX',
    },
  });
  console.log(`✓ Restaurant: ${restaurant.name}`);

  // ── Users / Staff ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'user-admin-001' },
    update: { username: 'admin', pin: 'admin' },
    create: { id: 'user-admin-001', name: 'Admin', username: 'admin', pin: 'admin', role: 'ADMIN', restaurantId: restaurant.id },
  });
  await prisma.user.upsert({
    where: { id: 'user-staff-001' },
    update: { username: 'rahul', pin: 'rahul123' },
    create: { id: 'user-staff-001', name: 'Rahul', username: 'rahul', pin: 'rahul123', role: 'STAFF', restaurantId: restaurant.id },
  });
  await prisma.user.upsert({
    where: { id: 'user-staff-002' },
    update: { username: 'priya', pin: 'priya123' },
    create: { id: 'user-staff-002', name: 'Priya', username: 'priya', pin: 'priya123', role: 'STAFF', restaurantId: restaurant.id },
  });
  console.log('✓ Staff seeded — Admin: admin/admin | Rahul: rahul/rahul123 | Priya: priya/priya123');

  // ── Tables ───────────────────────────────────────────────────────────────
  const tableData = [
    { id: 'tbl-1', name: 'T1', section: 'Ground Floor', capacity: 4, posX: 30,  posY: 50  },
    { id: 'tbl-2', name: 'T2', section: 'Ground Floor', capacity: 2, posX: 200, posY: 50  },
    { id: 'tbl-3', name: 'T3', section: 'Ground Floor', capacity: 6, posX: 370, posY: 50  },
    { id: 'tbl-4', name: 'T4', section: 'Ground Floor', capacity: 4, posX: 30,  posY: 180 },
    { id: 'tbl-5', name: 'T5', section: 'First Floor',  capacity: 4, posX: 30,  posY: 50  },
    { id: 'tbl-6', name: 'T6', section: 'First Floor',  capacity: 4, posX: 200, posY: 50  },
    { id: 'tbl-7', name: 'T7', section: 'First Floor',  capacity: 8, posX: 370, posY: 50  },
    { id: 'tbl-8', name: 'T8', section: 'Outdoor',      capacity: 4, posX: 30,  posY: 50  },
    { id: 'tbl-9', name: 'T9', section: 'Outdoor',      capacity: 4, posX: 200, posY: 50  },
  ];

  for (const t of tableData) {
    await prisma.table.upsert({
      where: { id: t.id },
      update: { posX: t.posX, posY: t.posY },
      create: { ...t, restaurantId: restaurant.id },
    });
  }
  console.log(`✓ ${tableData.length} Tables across 3 sections`);

  // ── Menu Categories & Items ───────────────────────────────────────────────
  const categories = [
    {
      id: 'cat-burgers',
      name: 'Burgers',
      sortOrder: 1,
      items: [
        { id: 'mi-b1', name: 'Classic Burger',    price: 150, shortcutKey: 'B1' },
        { id: 'mi-b2', name: 'Cheese Burger',     price: 180, shortcutKey: 'B2' },
        { id: 'mi-b3', name: 'Chicken Zinger',    price: 220, shortcutKey: 'B3' },
        { id: 'mi-b4', name: 'Veggie Burger',     price: 130, shortcutKey: 'B4' },
      ],
    },
    {
      id: 'cat-sides',
      name: 'Sides',
      sortOrder: 2,
      items: [
        { id: 'mi-s1', name: 'Peri Peri Fries',  price: 120, shortcutKey: 'F1' },
        { id: 'mi-s2', name: 'Loaded Fries',      price: 160, shortcutKey: 'F2' },
        { id: 'mi-s3', name: 'Onion Rings',       price: 100, shortcutKey: 'F3' },
        { id: 'mi-s4', name: 'Coleslaw',          price: 60,  shortcutKey: 'F4' },
      ],
    },
    {
      id: 'cat-mains',
      name: 'Mains',
      sortOrder: 3,
      items: [
        { id: 'mi-m1', name: 'Chicken Wings',     price: 220, shortcutKey: 'W1' },
        { id: 'mi-m2', name: 'Veg Pizza',         price: 280, shortcutKey: 'P1' },
        { id: 'mi-m3', name: 'Chicken Pizza',     price: 320, shortcutKey: 'P2' },
        { id: 'mi-m4', name: 'Paneer Tikka',      price: 200, shortcutKey: 'T1' },
        { id: 'mi-m5', name: 'Fish & Chips',      price: 260, shortcutKey: 'M1' },
      ],
    },
    {
      id: 'cat-drinks',
      name: 'Drinks',
      sortOrder: 4,
      items: [
        { id: 'mi-d1', name: 'Coke 330ml',        price: 60,  shortcutKey: 'C1' },
        { id: 'mi-d2', name: 'Sprite 330ml',      price: 60,  shortcutKey: 'C2' },
        { id: 'mi-d3', name: 'Fresh Lime Soda',   price: 80,  shortcutKey: 'L1' },
        { id: 'mi-d4', name: 'Masala Chai',       price: 40,  shortcutKey: 'M2' },
        { id: 'mi-d5', name: 'Filter Coffee',     price: 50,  shortcutKey: 'M3' },
        { id: 'mi-d6', name: 'Mango Lassi',       price: 90,  shortcutKey: 'L2' },
      ],
    },
    {
      id: 'cat-desserts',
      name: 'Desserts',
      sortOrder: 5,
      items: [
        { id: 'mi-ds1', name: 'Chocolate Brownie', price: 120, shortcutKey: 'D1' },
        { id: 'mi-ds2', name: 'Ice Cream Scoop',   price: 80,  shortcutKey: 'D2' },
        { id: 'mi-ds3', name: 'Gulab Jamun',       price: 60,  shortcutKey: 'D3' },
      ],
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { sortOrder: cat.sortOrder },
      create: { id: cat.id, name: cat.name, sortOrder: cat.sortOrder, restaurantId: restaurant.id },
    });
    for (const item of cat.items) {
      await prisma.menuItem.upsert({
        where: { id: item.id },
        update: { price: item.price },
        create: { id: item.id, name: item.name, price: item.price, shortcutKey: item.shortcutKey, categoryId: cat.id },
      });
    }
    console.log(`✓ Category: ${cat.name} (${cat.items.length} items)`);
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inventory = [
    { id: 'inv-1', name: 'Chicken Breast',   unit: 'kg',   category: 'Protein',   stockLevel: 8.5,  minQty: 5,  costPerUnit: 280 },
    { id: 'inv-2', name: 'Burger Buns',      unit: 'pcs',  category: 'Bakery',    stockLevel: 120,  minQty: 40, costPerUnit: 8   },
    { id: 'inv-3', name: 'Peri Peri Sauce',  unit: 'L',    category: 'Condiment', stockLevel: 3.5,  minQty: 2,  costPerUnit: 240 },
    { id: 'inv-4', name: 'Mozzarella',       unit: 'kg',   category: 'Dairy',     stockLevel: 4.2,  minQty: 2,  costPerUnit: 450 },
    { id: 'inv-5', name: 'Coca-Cola 330ml',  unit: 'cans', category: 'Beverage',  stockLevel: 144,  minQty: 48, costPerUnit: 25  },
    { id: 'inv-6', name: 'Pizza Dough',      unit: 'kg',   category: 'Bakery',    stockLevel: 1.8,  minQty: 4,  costPerUnit: 60  },
    { id: 'inv-7', name: 'Cooking Oil',      unit: 'L',    category: 'Pantry',    stockLevel: 12,   minQty: 5,  costPerUnit: 130 },
    { id: 'inv-8', name: 'Chicken Wings',    unit: 'kg',   category: 'Protein',   stockLevel: 1.5,  minQty: 3,  costPerUnit: 320 },
    { id: 'inv-9', name: 'Paneer',           unit: 'kg',   category: 'Dairy',     stockLevel: 3,    minQty: 2,  costPerUnit: 380 },
    { id: 'inv-10', name: 'Potato',          unit: 'kg',   category: 'Vegetable', stockLevel: 15,   minQty: 8,  costPerUnit: 30  },
  ];

  for (const item of inventory) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: { stockLevel: item.stockLevel },
      create: { ...item, restaurantId: restaurant.id },
    });
  }
  console.log(`✓ ${inventory.length} Inventory items`);

  // ── Role Permissions ──────────────────────────────────────────────────────
  const defaultPermissions = [
    // ADMIN
    { role: 'ADMIN', permission: 'CAN_CREATE_ORDER' },
    { role: 'ADMIN', permission: 'CAN_PRINT_BILL' },
    { role: 'ADMIN', permission: 'CAN_SETTLE_PAYMENT' },
    { role: 'ADMIN', permission: 'CAN_VOID_ITEM' },
    { role: 'ADMIN', permission: 'CAN_APPLY_DISCOUNT' },
    { role: 'ADMIN', permission: 'CAN_OPEN_CASH_DRAWER' },
    { role: 'ADMIN', permission: 'CAN_VIEW_REPORTS' },
    { role: 'ADMIN', permission: 'CAN_EDIT_INVENTORY' },
    // MANAGER
    { role: 'MANAGER', permission: 'CAN_CREATE_ORDER' },
    { role: 'MANAGER', permission: 'CAN_PRINT_BILL' },
    { role: 'MANAGER', permission: 'CAN_SETTLE_PAYMENT' },
    { role: 'MANAGER', permission: 'CAN_VOID_ITEM' },
    { role: 'MANAGER', permission: 'CAN_APPLY_DISCOUNT' },
    { role: 'MANAGER', permission: 'CAN_OPEN_CASH_DRAWER' },
    // STAFF
    { role: 'STAFF', permission: 'CAN_CREATE_ORDER' },
  ];

  for (const perm of defaultPermissions) {
    const permId = `perm-${perm.role.toLowerCase()}-${perm.permission.toLowerCase()}`;
    await prisma.rolePermission.upsert({
      where: { role_permission_restaurantId: { role: perm.role, permission: perm.permission, restaurantId: restaurant.id } },
      update: {},
      create: {
        id: permId,
        role: perm.role,
        permission: perm.permission,
        restaurantId: restaurant.id,
      },
    });
  }
  console.log(`✓ ${defaultPermissions.length} Default role permissions seeded`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('   Restaurant ID : rsk-restaurant-001');
  console.log('   Admin login   : username=admin  password=admin');
  console.log('   Rahul login   : username=rahul  password=rahul123');
  console.log('   Priya login   : username=priya  password=priya123');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
