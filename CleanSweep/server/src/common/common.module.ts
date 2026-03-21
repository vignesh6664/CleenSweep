import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [EncryptionService, AuditLogService, SubscriptionService, PrismaService],
  exports: [EncryptionService, AuditLogService, SubscriptionService, PrismaService],
})
export class CommonModule {}
