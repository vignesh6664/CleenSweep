import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { CopilotToolsService } from './copilot-tools.service';
import { KindeAuthGuard } from '../auth/kinde-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CopilotChatDto } from './copilot.types';

@Controller('api/copilot')
@UseGuards(KindeAuthGuard)
export class CopilotController {
  constructor(
    private readonly copilotService: CopilotService,
    private readonly toolsService: CopilotToolsService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CopilotChatDto,
  ) {
    return this.copilotService.processChat(user.id, dto);
  }

  @Get('actions')
  async listPendingActions(@CurrentUser() user: AuthenticatedUser) {
    return this.toolsService.listPendingActions(user.id);
  }

  @Post('actions/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') actionId: string,
  ) {
    return this.toolsService.confirmAction(user.id, actionId);
  }

  @Post('actions/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') actionId: string,
  ) {
    return this.toolsService.dismissAction(user.id, actionId);
  }
}
