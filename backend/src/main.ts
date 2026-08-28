import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith('.azurecontainerapps.io')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);
  const redisClient = redis.getClient();

  // Seed default admin if missing
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: 'admin@coldchain.com' },
  });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('adminpassword', salt);
    await prisma.adminUser.create({
      data: {
        email: 'admin@coldchain.com',
        passwordHash,
        role: 'admin',
      },
    });
    console.log(
      'Seeded default admin user: admin@coldchain.com / adminpassword',
    );
  }

  // Ensure standard config profile exists
  let profile = await prisma.configProfile.findFirst({
    where: { name: 'Pharma standard (2-8C)' },
  });
  if (!profile) {
    profile = await prisma.configProfile.create({
      data: {
        name: 'Pharma standard (2-8C)',
        tempMin: 2.0,
        tempMax: 8.0,
        heartbeatIntervalSecs: 10,
      },
    });
  }

  // Seed/Position 5 trucks in Singapore (Truck-001 to Truck-005)
  const SEED_TRUCKS = [
    {
      name: 'Truck-001',
      route: 'Route-SG01 (Changi Air Cargo)',
      lat: 1.3644,
      lng: 103.9915,
      temp: 4.2,
      status: 'online',
    },
    {
      name: 'Truck-002',
      route: 'Route-SG02 (Jurong Cold Logistics)',
      lat: 1.3105,
      lng: 103.7223,
      temp: 3.8,
      status: 'online',
    },
    {
      name: 'Truck-003',
      route: 'Route-SG03 (Woodlands Cargo North)',
      lat: 1.4428,
      lng: 103.7698,
      temp: 9.1,
      status: 'degraded',
    },
    {
      name: 'Truck-004',
      route: 'Route-SG04 (Tuas South Logistics)',
      lat: 1.32,
      lng: 103.642,
      temp: 4.5,
      status: 'online',
    },
    {
      name: 'Truck-005',
      route: 'Route-SG05 (Pasir Panjang Terminal)',
      lat: 1.2762,
      lng: 103.7915,
      temp: 5.1,
      status: 'online',
    },
  ];

  // Remove any extra vehicles outside of Truck-001 to Truck-005
  const allowedNames = SEED_TRUCKS.map((t) => t.name);
  const extraVehicles = await prisma.vehicle.findMany({
    where: { name: { notIn: allowedNames } },
  });
  for (const extra of extraVehicles) {
    await prisma.telemetryReading.deleteMany({ where: { vehicleId: extra.id } });
    await prisma.alert.deleteMany({ where: { vehicleId: extra.id } });
    await prisma.statusEvent.deleteMany({ where: { vehicleId: extra.id } });
    await prisma.vehicle.delete({ where: { id: extra.id } });
    console.log(`Cleaned up extra vehicle: ${extra.name}`);
  }

  for (const t of SEED_TRUCKS) {
    let vehicle = await prisma.vehicle.findUnique({ where: { name: t.name } });
    if (!vehicle) {
      const apiKeyHash = createHash('sha256')
        .update(`key-${t.name}`)
        .digest('hex');
      vehicle = await prisma.vehicle.create({
        data: {
          name: t.name,
          apiKeyHash,
          currentRoute: t.route,
          status: t.status,
          configProfileId: profile.id,
        },
      });
    } else {
      vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          currentRoute: t.route,
        },
      });
    }

    await prisma.telemetryReading.create({
      data: {
        vehicleId: vehicle.id,
        temperature: t.temp,
        latitude: t.lat,
        longitude: t.lng,
        doorOpen: false,
      },
    });

    try {
      const now = Date.now().toString();
      await redisClient.set(`vehicle:${vehicle.id}:lastSeen`, now);
      await redisClient.set(
        `vehicle:${vehicle.id}:latest`,
        JSON.stringify({
          temperature: t.temp,
          latitude: t.lat,
          longitude: t.lng,
          doorOpen: false,
          timestamp: now,
        }),
      );
    } catch (e) {
      console.warn(
        `Redis caching skipped for ${t.name}:`,
        (e as Error).message,
      );
    }

    console.log(
      `Positioned vehicle ${t.name} in Singapore: (${t.lat}, ${t.lng})`,
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
