/*
  Warnings:

  - You are about to drop the column `threshold` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `menuItem` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `name` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "shortcutKey" TEXT;

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "openingCash" REAL NOT NULL DEFAULT 0,
    "closingCash" REAL,
    "totalSales" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "name", "restaurantId", "syncStatus", "updatedAt", "version") SELECT "id", "name", "restaurantId", "syncStatus", "updatedAt", "version" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "stockLevel" REAL NOT NULL DEFAULT 0,
    "minQty" REAL NOT NULL DEFAULT 10,
    "costPerUnit" REAL NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("id", "name", "restaurantId", "stockLevel", "syncStatus", "unit", "updatedAt", "version") SELECT "id", "name", "restaurantId", "stockLevel", "syncStatus", "unit", "updatedAt", "version" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'DINE_IN',
    "notes" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "origin", "restaurantId", "status", "subtotal", "syncStatus", "tableId", "tax", "total", "updatedAt", "version") SELECT "createdAt", "id", "origin", "restaurantId", "status", "subtotal", "syncStatus", "tableId", "tax", "total", "updatedAt", "version" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "modifiers" TEXT,
    "isPrinted" BOOLEAN NOT NULL DEFAULT false,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "isPrinted", "modifiers", "orderId", "price", "qty", "syncStatus", "updatedAt", "version") SELECT "id", "isPrinted", "modifiers", "orderId", "price", "qty", "syncStatus", "updatedAt", "version" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "section" TEXT NOT NULL DEFAULT 'Ground Floor',
    "posX" REAL NOT NULL DEFAULT 50,
    "posY" REAL NOT NULL DEFAULT 50,
    "restaurantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Table" ("capacity", "id", "name", "restaurantId", "status", "syncStatus", "updatedAt", "version") SELECT "capacity", "id", "name", "restaurantId", "status", "syncStatus", "updatedAt", "version" FROM "Table";
DROP TABLE "Table";
ALTER TABLE "new_Table" RENAME TO "Table";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pin" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "restaurantId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "name", "pin", "restaurantId", "role", "syncStatus", "updatedAt", "version") SELECT "id", "name", "pin", "restaurantId", "role", "syncStatus", "updatedAt", "version" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
