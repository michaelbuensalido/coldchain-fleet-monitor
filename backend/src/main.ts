import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Seed default admin if none exists
  const prisma = app.get(PrismaService);
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
