import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, PrismaService, EncryptionService, ConfigService],
})
export class AccountsModule {}
