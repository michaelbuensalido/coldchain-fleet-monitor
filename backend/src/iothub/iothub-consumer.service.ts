import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventHubConsumerClient, Subscription, ReceivedEventData } from '@azure/event-hubs';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class IotHubConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IotHubConsumerService.name);
  private consumerClient: EventHubConsumerClient | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private prisma: PrismaService,
    private telemetryService: TelemetryService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async onModuleInit() {
    const connectionString =
      process.env.IOT_HUB_EVENT_HUB_CONNECTION_STRING ||
      process.env.EVENT_HUB_CONNECTION_STRING;
    const eventHubName = process.env.IOT_HUB_NAME || process.env.EVENT_HUB_NAME;

    if (!connectionString) {
      this.logger.warn(
        'IOT_HUB_EVENT_HUB_CONNECTION_STRING is missing. Event Hub consumer will remain idle.',
      );
      return;
    }

    try {
      const consumerGroup = EventHubConsumerClient.defaultConsumerGroupName;
      if (eventHubName) {
        this.consumerClient = new EventHubConsumerClient(
          consumerGroup,
          connectionString,
          eventHubName,
        );
      } else {
        this.consumerClient = new EventHubConsumerClient(
          consumerGroup,
          connectionString,
        );
      }

      this.logger.log('Subscribing to Azure IoT Hub Event Hub partitions...');

      this.subscription = this.consumerClient.subscribe({
        processEvents: async (events: ReceivedEventData[]) => {
          for (const event of events) {
            await this.handleIncomingEvent(event);
          }
        },
        processError: async (err: Error) => {
          this.logger.error(`Error processing Event Hub events: ${err.message}`);
        },
      });

      this.logger.log('Successfully subscribed to Azure IoT Hub Event Hub stream.');
    } catch (err: any) {
      this.logger.error(`Failed to initialize EventHubConsumerClient: ${err.message}`);
    }
  }

  private async handleIncomingEvent(event: ReceivedEventData) {
    try {
      let rawBody = event.body;
      if (typeof rawBody !== 'object' || rawBody === null) {
        rawBody = JSON.parse(rawBody.toString());
      }

      const { vehicleId, temperature, latitude, longitude, doorOpen, timestamp } = rawBody;

      if (!vehicleId) {
        this.logger.debug('Received event without vehicleId field.');
        return;
      }

      // Match vehicle record in PostgreSQL by name or id
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          OR: [{ id: vehicleId }, { name: vehicleId }],
        },
      });

      if (!vehicle) {
        this.logger.warn(`Vehicle with ID/Name '${vehicleId}' not found in DB.`);
        return;
      }

      // Ingest telemetry reading (DB persistence + Redis cache + Redis pub/sub)
      await this.telemetryService.ingestTelemetry(vehicle.id, {
        temperature: Number(temperature),
        latitude: Number(latitude),
        longitude: Number(longitude),
        doorOpen: Boolean(doorOpen),
      });

      const telemetryData = {
        vehicleId: vehicle.id,
        name: vehicle.name,
        temperature: Number(temperature),
        latitude: Number(latitude),
        longitude: Number(longitude),
        doorOpen: Boolean(doorOpen),
        timestamp: timestamp || new Date().toISOString(),
      };

      // Emit telemetry updates directly via Socket.io gateway to connected frontend clients
      if (this.realtimeGateway?.server) {
        this.realtimeGateway.server.emit('telemetry', telemetryData);
        this.realtimeGateway.server.emit('vehicle:telemetry', telemetryData);
      }
    } catch (err: any) {
      this.logger.error(`Failed to process incoming Event Hub payload: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.subscription) {
        await this.subscription.close();
        this.logger.log('Closed Event Hub subscription.');
      }
      if (this.consumerClient) {
        await this.consumerClient.close();
        this.logger.log('Closed EventHubConsumerClient.');
      }
    } catch (err: any) {
      this.logger.error(`Error closing Event Hub consumer client: ${err.message}`);
    }
  }
}
