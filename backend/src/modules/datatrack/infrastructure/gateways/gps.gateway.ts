import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface GpsUpdateEvent {
  passengerId: string;
  deviceName?: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  satellites: number;
  estado: string;
  timestamp: string;
  tenantId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/gps',
})
export class GpsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GpsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('GPS WebSocket gateway initialized');
  }

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token — disconnecting`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ tenantId: string; sub: string }>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Isolate client to their tenant room
      client.join(`tenant:${payload.tenantId}`);
      (client as any).tenantId = payload.tenantId;
      this.logger.log(`Client ${client.id} connected — tenant room: ${payload.tenantId}`);
    } catch {
      this.logger.warn(`Client ${client.id} sent invalid token — disconnecting`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe-route')
  handleSubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ): void {
    const tenantId = (client as any).tenantId as string;
    client.join(`route:${tenantId}:${data.routeId}`);
    this.logger.debug(`Client ${client.id} subscribed to route ${data.routeId}`);
  }

  @SubscribeMessage('unsubscribe-route')
  handleUnsubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ): void {
    const tenantId = (client as any).tenantId as string;
    client.leave(`route:${tenantId}:${data.routeId}`);
  }

  /**
   * Broadcast GPS updates to all clients of a specific tenant.
   */
  broadcastGpsUpdate(tenantId: string, events: GpsUpdateEvent[]): void {
    if (events.length === 0) return;
    this.server.to(`tenant:${tenantId}`).emit('gps-update', events);
  }

  /**
   * Broadcast a single passenger update to the route room.
   */
  broadcastToRoute(tenantId: string, routeId: string, event: GpsUpdateEvent): void {
    this.server.to(`route:${tenantId}:${routeId}`).emit('gps-update', [event]);
  }
}
