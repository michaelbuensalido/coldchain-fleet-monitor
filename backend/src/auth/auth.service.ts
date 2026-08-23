import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerAdmin(email: string, passwordPlain: string) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Admin with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const admin = await this.prisma.adminUser.create({
      data: {
        email,
        passwordHash,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }

  async loginAdmin(email: string, passwordPlain: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
