import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { KindeAuthGuard } from './kinde-auth.guard';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [AuthService, KindeAuthGuard, PrismaService],
  exports: [AuthService, KindeAuthGuard],
})
export class AuthModule {}
