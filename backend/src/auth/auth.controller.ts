import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.registerAdmin(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.loginAdmin(body.email, body.password);
  }
}
