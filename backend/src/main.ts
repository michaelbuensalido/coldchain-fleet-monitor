import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://coldchain-frontend.mangoground-0325b43c.eastasia.azurecontainerapps.io',
      'http://localhost:5173', // Local Vite dev server
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);
  const redisClient = redis.getClient();

  // Seed default admin if none exists
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
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

  // Seed/Position 20 trucks in Singapore
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
    {
      name: 'Truck-006',
      route: 'Route-SG06 (Central Business Express)',
      lat: 1.282,
      lng: 103.858,
      temp: 4.0,
      status: 'online',
    },
    {
      name: 'Truck-007',
      route: 'Route-SG07 (Ang Mo Kio Industrial Link)',
      lat: 1.375,
      lng: 103.849,
      temp: 3.6,
      status: 'online',
    },
    {
      name: 'Truck-008',
      route: 'Route-SG08 (Tampines East Hub)',
      lat: 1.353,
      lng: 103.945,
      temp: 11.4,
      status: 'degraded',
    },
    {
      name: 'Truck-009',
      route: 'Route-SG09 (Clementi Freight Corridor)',
      lat: 1.315,
      lng: 103.765,
      temp: 4.8,
      status: 'online',
    },
    {
      name: 'Truck-010',
      route: 'Route-SG10 (Kranji Agricultural Line)',
      lat: 1.425,
      lng: 103.755,
      temp: 4.1,
      status: 'online',
    },
    {
      name: 'Truck-011',
      route: 'Route-SG11 (Seletar Aero Cargo)',
      lat: 1.412,
      lng: 103.868,
      temp: 3.9,
      status: 'online',
    },
    {
      name: 'Truck-012',
      route: 'Route-SG12 (Bedok East Logistics)',
      lat: 1.324,
      lng: 103.93,
      temp: -2.1,
      status: 'offline',
    },
    {
      name: 'Truck-013',
      route: 'Route-SG13 (Sengkang Regional Depot)',
      lat: 1.39,
      lng: 103.895,
      temp: 5.3,
      status: 'online',
    },
    {
      name: 'Truck-014',
      route: 'Route-SG14 (Bukit Batok West Link)',
      lat: 1.348,
      lng: 103.752,
      temp: 4.4,
      status: 'online',
    },
    {
      name: 'Truck-015',
      route: 'Route-SG15 (Loyang Supply Base)',
      lat: 1.381,
      lng: 103.978,
      temp: 4.7,
      status: 'online',
    },
    {
      name: 'Truck-016',
      route: 'Route-SG16 (Yishun Industrial Belt)',
      lat: 1.43,
      lng: 103.838,
      temp: 5.0,
      status: 'online',
    },
    {
      name: 'Truck-017',
      route: 'Route-SG17 (Kallang Logistics Zone)',
      lat: 1.312,
      lng: 103.865,
      temp: 4.3,
      status: 'online',
    },
    {
      name: 'Truck-018',
      route: 'Route-SG18 (Senoko Cold Supply)',
      lat: 1.458,
      lng: 103.808,
      temp: 6.2,
      status: 'pending',
    },
    {
      name: 'Truck-019',
      route: 'Route-SG19 (Boon Lay Freight Link)',
      lat: 1.328,
      lng: 103.705,
      temp: 4.9,
      status: 'online',
    },
    {
      name: 'Truck-020',
      route: 'Route-SG20 (Sungei Kadut Corridor)',
      lat: 1.418,
      lng: 103.748,
      temp: 3.7,
      status: 'online',
    },
  ];

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
