import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../../common/prisma.module';
import { LogModule } from '../logs/log.module';

@Module({
  imports: [PrismaModule, LogModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
