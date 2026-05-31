import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('Socket.io Gateway Initialized');
  }

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId;
    if (tenantId) {
      client.join(tenantId.toString());
      this.logger.log(`Client connected: ${client.id} to tenant: ${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('SYNC_EVENT')
  handleSyncEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const tenantId = client.handshake.query.tenantId;
    if (tenantId) {
      // Broadcast to all other terminals in the same restaurant
      client.to(tenantId.toString()).emit('SYNC_UPDATE', data);
      this.logger.log(`Broadcasted sync event for tenant ${tenantId}: ${data.type}`);
    }
  }

  @SubscribeMessage('KOT_ALERT')
  handleKOT(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const tenantId = client.handshake.query.tenantId;
    if (tenantId) {
      this.server.to(tenantId.toString()).emit('KOT_RECEIVED', data);
    }
  }
}
