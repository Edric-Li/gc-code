import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务正常运行' })
  check() {
    return {
      status: 'ok',
      message: '🎉 GC Code Portal Backend is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping 测试' })
  @ApiResponse({ status: 200, description: 'Pong!' })
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
