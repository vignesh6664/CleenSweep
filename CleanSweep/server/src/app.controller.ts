import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { KindeAuthGuard } from './auth/kinde-auth.guard';
import { CurrentUser, type AuthenticatedUser } from './auth/decorators/current-user.decorator';
import { SubscriptionService } from './common/subscription.service';
import { AuditLogService } from './common/audit-log.service';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly subscription: SubscriptionService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('me')
  @UseGuards(KindeAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const isPro = await this.subscription.isPro(user.id);
    return {
      ...user,
      subscriptionTier: isPro ? 'PRO' : 'FREE',
    };
  }

  @Post('upgrade')
  @UseGuards(KindeAuthGuard)
  async upgrade(@CurrentUser() user: AuthenticatedUser) {
    await this.subscription.setTier(user.id, 'PRO');
    return { success: true, message: 'Upgraded to PRO successfully' };
  }

  @Get('audit-logs')
  @UseGuards(KindeAuthGuard)
  async getAuditLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.auditLog.getLogs(user.id);
  }
}
