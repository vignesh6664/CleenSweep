import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { CopilotToolsService } from './copilot-tools.service';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AwsModule, AuthModule],
  controllers: [CopilotController],
  providers: [CopilotService, CopilotToolsService],
  exports: [CopilotService, CopilotToolsService],
})
export class CopilotModule {}
