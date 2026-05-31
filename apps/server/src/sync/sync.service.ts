import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async handlePush(data: any, restaurantId: string) {
    const { orders, tables, inventory } = data;
    
    // 1. Process pushed orders
    if (orders) {
      for (const order of orders) {
        const { items, ...orderData } = order;
        const existing = await this.prisma.order.findUnique({ where: { id: order.id } });
        if (existing && existing.version >= order.version) continue;

        await this.prisma.order.upsert({
          where: { id: order.id },
          update: { ...orderData, restaurantId, version: order.version + 1, syncStatus: 'SYNCED' },
          create: { ...orderData, restaurantId, version: 1, syncStatus: 'SYNCED' },
        });

        if (items) {
          for (const item of items) {
             await this.prisma.orderItem.upsert({
               where: { id: item.id },
               update: { ...item, syncStatus: 'SYNCED' },
               create: { ...item, syncStatus: 'SYNCED' },
             });
          }
        }
      }
    }

    // 2. Process pushed tables
    if (tables) {
      for (const table of tables) {
        await this.prisma.table.upsert({
          where: { id: table.id },
          update: { ...table, restaurantId, syncStatus: 'SYNCED' },
          create: { ...table, restaurantId, syncStatus: 'SYNCED' },
        });
      }
    }

    // 3. Process pushed inventory
    if (inventory) {
      for (const item of inventory) {
        await this.prisma.inventoryItem.upsert({
          where: { id: item.id },
          update: { ...item, restaurantId, syncStatus: 'SYNCED' },
          create: { ...item, restaurantId, syncStatus: 'SYNCED' },
        });
      }
    }

    return { success: true };
  }

  async handlePull(lastSync: string, restaurantId: string) {
    const date = new Date(lastSync);

    const orders = await this.prisma.order.findMany({
      where: { updatedAt: { gt: date }, restaurantId },
      include: { items: true },
    });

    const tables = await this.prisma.table.findMany({
      where: { updatedAt: { gt: date }, restaurantId },
    });

    const categories = await this.prisma.category.findMany({
      where: { updatedAt: { gt: date }, restaurantId },
    });

    return { orders, tables, categories };
  }
}
