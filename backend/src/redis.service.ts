import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null, // Stop endless reconnect loops when down
    });

    this.client.on('error', (err) => {
      // Suppress unhandled error crashes
      this.logger.debug(`Suppressed Redis connection error: ${err.message}`);
    });
  }

  isReady(): boolean {
    return !!this.client && this.client.status === 'ready';
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // Ignore disconnect errors on shutdown
    }
  }
}
