import axios from 'axios';
import { prisma } from '../db';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class SyncService {
  /**
   * Pushes all pending changes to the cloud server
   */
  async pushChanges() {
    try {
      const pendingOrders = await prisma.order.findMany({
        where: { syncStatus: 'PENDING' },
        include: { items: true },
      });

      const pendingTables = await prisma.table.findMany({
        where: { syncStatus: 'PENDING' },
      });

      const pendingInventory = await prisma.inventoryItem.findMany({
        where: { syncStatus: 'PENDING' },
      });

      if (pendingOrders.length === 0 && pendingTables.length === 0 && pendingInventory.length === 0) return;

      const response = await axios.post(`${API_URL}/sync/push`, {
        orders: pendingOrders,
        tables: pendingTables,
        inventory: pendingInventory,
      });

      if (response.status === 200) {
        // Mark as synced
        if (pendingOrders.length > 0) {
          await prisma.order.updateMany({
            where: { id: { in: pendingOrders.map(o => o.id) } },
            data: { syncStatus: 'SYNCED' },
          });
        }
        if (pendingTables.length > 0) {
          await prisma.table.updateMany({
            where: { id: { in: pendingTables.map(t => t.id) } },
            data: { syncStatus: 'SYNCED' },
          });
        }
        if (pendingInventory.length > 0) {
          await prisma.inventoryItem.updateMany({
            where: { id: { in: pendingInventory.map(i => i.id) } },
            data: { syncStatus: 'SYNCED' },
          });
        }
      }
    } catch (error) {
      console.error('Push failed:', error);
    }
  }

  /**
   * Pulls new changes from the cloud server
   */
  async pullChanges() {
    try {
      const metadata = await prisma.syncMetadata.findUnique({
        where: { id: 'singleton' },
      });

      const lastSync = metadata?.lastSync || new Date(0);

      const response = await axios.get(`${API_URL}/sync/pull`, {
        params: { lastSync: lastSync.toISOString() },
      });

      const { orders, tables, categories } = response.data;

      // Upsert pulled data
      if (orders) {
        for (const order of orders) {
          const { items, ...orderData } = order;
          await prisma.order.upsert({
            where: { id: order.id },
            update: { ...orderData, syncStatus: 'SYNCED' },
            create: { ...orderData, syncStatus: 'SYNCED' },
          });
          if (items) {
            for (const item of items) {
              await prisma.orderItem.upsert({
                where: { id: item.id },
                update: { ...item, syncStatus: 'SYNCED' },
                create: { ...item, syncStatus: 'SYNCED' },
              });
            }
          }
        }
      }

      if (tables) {
        for (const table of tables) {
          await prisma.table.upsert({
            where: { id: table.id },
            update: { ...table, syncStatus: 'SYNCED' },
            create: { ...table, syncStatus: 'SYNCED' },
          });
        }
      }

      if (categories) {
        for (const cat of categories) {
          await prisma.category.upsert({
            where: { id: cat.id },
            update: { ...cat, syncStatus: 'SYNCED' },
            create: { ...cat, syncStatus: 'SYNCED' },
          });
        }
      }

      // Update last sync time
      await prisma.syncMetadata.upsert({
        where: { id: 'singleton' },
        update: { lastSync: new Date() },
        create: { id: 'singleton', lastSync: new Date() },
      });
    } catch (error) {
      console.error('Pull failed:', error);
    }
  }

  /**
   * Main sync loop
   */
  private isSyncing = false;
  private isOnline = true;

  async checkConnectivity() {
    try {
      await axios.get(`${API_URL}/sync/pull?lastSync=${new Date().toISOString()}`);
      if (!this.isOnline) {
        console.log('Connectivity restored. Triggering immediate sync...');
        this.runSync();
      }
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      console.warn('POS is offline. Sync suspended.');
    }
  }

  async runSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      await this.pushChanges();
      await this.pullChanges();
    } finally {
      this.isSyncing = false;
    }
  }

  startSyncLoop() {
    // Heartbeat every 5 seconds for connectivity
    setInterval(() => this.checkConnectivity(), 5000);
    
    // Full sync every 30 seconds if online
    setInterval(() => {
      if (this.isOnline) this.runSync();
    }, 30000);
  }
}

export const syncService = new SyncService();
