import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { PrismaService } from '../prisma.service';
import { AwsService } from '../aws/aws.service';
import { EncryptionService } from '../common/encryption.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NestScheduleModule.forRoot(), AuthModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, PrismaService, AwsService, EncryptionService],
})
export class SchedulerModule {}
