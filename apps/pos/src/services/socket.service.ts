import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;

  connect(tenantId: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_URL, {
      query: { tenantId },
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('Real-time connection established');
    });

    this.socket.on('SYNC_UPDATE', (data) => {
      console.log('Real-time sync received:', data);
      // Trigger a local UI refresh or store update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SOCKET_SYNC', { detail: data }));
      }
    });

    this.socket.on('KOT_RECEIVED', (data) => {
      // Haptic feedback for new KOT
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      
      // Voice alert
      const utterance = new SpeechSynthesisUtterance(`New order for ${data.tableName}`);
      window.speechSynthesis.speak(utterance);
    });
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
