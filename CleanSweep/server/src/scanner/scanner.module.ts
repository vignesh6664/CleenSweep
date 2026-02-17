import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { AwsModule } from '../aws/aws.module';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AwsModule, AuthModule],
  controllers: [ScannerController],
  providers: [ScannerService, PrismaService],
})
export class ScannerModule {}
