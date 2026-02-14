import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  providers: [AwsService, PrismaService, EncryptionService],
  exports: [AwsService],
})
export class AwsModule {}
