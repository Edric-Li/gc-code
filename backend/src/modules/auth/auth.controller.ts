import { Controller, Post, Get, Body, UseGuards, Request, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Get('azure')
  async azureAuth(@Res() res: Response) {
    const { authUrl } = await this.authService.getAzureAuthUrl();
    return res.redirect(authUrl);
  }

  @Get('azure/callback')
  async azureCallback(@Query('code') code: string, @Res() res: Response, @Request() req) {
    try {
      console.log('Azure callback received, code:', code ? 'present' : 'missing');
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await this.authService.handleAzureCallback(code, ipAddress, userAgent);
      console.log('Azure authentication successful, user:', result.user.email);

      // 将 token 和用户信息作为查询参数重定向到前端
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5555';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      console.log('Redirecting to:', frontendUrl + '/auth/callback');

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Azure authentication error in controller:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5555';
      return res.redirect(`${frontendUrl}/login?error=azure_auth_failed`);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
