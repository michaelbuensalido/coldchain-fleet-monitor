import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis.service';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private subClient: Redis;

  constructor(private redisService: RedisService) {
    // Instantiate a separate Redis client for subscription
    this.subClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized.');

    // Subscribe to Redis channels for cross-process real-time broadcast
    this.subClient.subscribe('vehicle:status', 'vehicle:telemetry', (err) => {
      if (err) {
        console.error('Failed to subscribe to Redis channels:', err.message);
      } else {
        console.log('Subscribed to vehicle:status and vehicle:telemetry Redis channels.');
      }
    });

    this.subClient.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        if (channel === 'vehicle:status') {
          this.server.emit('vehicle:status', data);
        } else if (channel === 'vehicle:telemetry') {
          this.server.emit('vehicle:telemetry', data);
        }
      } catch (err: any) {
        console.error('Error handling Redis subscription message:', err.message);
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WebSocket client disconnected: ${client.id}`);
  }
}
