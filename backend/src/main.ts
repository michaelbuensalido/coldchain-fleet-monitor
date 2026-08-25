import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

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
    console.log('Seeded default admin user: admin@coldchain.com / adminpassword');
  }

  // Ensure standard config profile exists
  let profile = await prisma.configProfile.findFirst({ where: { name: 'Pharma standard (2-8C)' } });
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
    { name: 'Truck-001', route: 'Route-SG01 (Changi Air Cargo)', lat: 1.3644, lng: 103.9915, temp: 4.2, status: 'online' },
    { name: 'Truck-002', route: 'Route-SG02 (Jurong Cold Logistics)', lat: 1.3105, lng: 103.7223, temp: 3.8, status: 'online' },
    { name: 'Truck-003', route: 'Route-SG03 (Woodlands Cargo North)', lat: 1.4428, lng: 103.7698, temp: 9.1, status: 'degraded' },
    { name: 'Truck-004', route: 'Route-SG04 (Tuas South Logistics)', lat: 1.3200, lng: 103.6420, temp: 4.5, status: 'online' },
    { name: 'Truck-005', route: 'Route-SG05 (Pasir Panjang Terminal)', lat: 1.2762, lng: 103.7915, temp: 5.1, status: 'online' },
    { name: 'Truck-006', route: 'Route-SG06 (Central Business Express)', lat: 1.2820, lng: 103.8580, temp: 4.0, status: 'online' },
    { name: 'Truck-007', route: 'Route-SG07 (Ang Mo Kio Industrial Link)', lat: 1.3750, lng: 103.8490, temp: 3.6, status: 'online' },
    { name: 'Truck-008', route: 'Route-SG08 (Tampines East Hub)', lat: 1.3530, lng: 103.9450, temp: 11.4, status: 'degraded' },
    { name: 'Truck-009', route: 'Route-SG09 (Clementi Freight Corridor)', lat: 1.3150, lng: 103.7650, temp: 4.8, status: 'online' },
    { name: 'Truck-010', route: 'Route-SG10 (Kranji Agricultural Line)', lat: 1.4250, lng: 103.7550, temp: 4.1, status: 'online' },
    { name: 'Truck-011', route: 'Route-SG11 (Seletar Aero Cargo)', lat: 1.4120, lng: 103.8680, temp: 3.9, status: 'online' },
    { name: 'Truck-012', route: 'Route-SG12 (Bedok East Logistics)', lat: 1.3240, lng: 103.9300, temp: -2.1, status: 'offline' },
    { name: 'Truck-013', route: 'Route-SG13 (Sengkang Regional Depot)', lat: 1.3900, lng: 103.8950, temp: 5.3, status: 'online' },
    { name: 'Truck-014', route: 'Route-SG14 (Bukit Batok West Link)', lat: 1.3480, lng: 103.7520, temp: 4.4, status: 'online' },
    { name: 'Truck-015', route: 'Route-SG15 (Loyang Supply Base)', lat: 1.3810, lng: 103.9780, temp: 4.7, status: 'online' },
    { name: 'Truck-016', route: 'Route-SG16 (Yishun Industrial Belt)', lat: 1.4300, lng: 103.8380, temp: 5.0, status: 'online' },
    { name: 'Truck-017', route: 'Route-SG17 (Kallang Logistics Zone)', lat: 1.3120, lng: 103.8650, temp: 4.3, status: 'online' },
    { name: 'Truck-018', route: 'Route-SG18 (Senoko Cold Supply)', lat: 1.4580, lng: 103.8080, temp: 6.2, status: 'pending' },
    { name: 'Truck-019', route: 'Route-SG19 (Boon Lay Freight Link)', lat: 1.3280, lng: 103.7050, temp: 4.9, status: 'online' },
    { name: 'Truck-020', route: 'Route-SG20 (Sungei Kadut Corridor)', lat: 1.4180, lng: 103.7480, temp: 3.7, status: 'online' },
  ];

  for (const t of SEED_TRUCKS) {
    let vehicle = await prisma.vehicle.findUnique({ where: { name: t.name } });
    if (!vehicle) {
      const apiKeyHash = createHash('sha256').update(`key-${t.name}`).digest('hex');
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

    console.log(`Positioned vehicle ${t.name} in Singapore: (${t.lat}, ${t.lng})`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
