import axios from 'axios';

class SyncServiceClient {
  private isOnline = true;

  async checkConnectivity() {
    try {
      await axios.get('/api/sync');
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      console.warn('POS is offline. Sync suspended.');
    }
  }

  async runSync() {
    if (!this.isOnline) return;
    try {
      await axios.post('/api/sync');
      console.log('🔄 Sync complete');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  startSyncLoop() {
    // Check connectivity every 10s
    setInterval(() => this.checkConnectivity(), 10000);
    
    // Trigger sync every 30s
    setInterval(() => this.runSync(), 30000);
  }
}

export const syncService = new SyncServiceClient();
