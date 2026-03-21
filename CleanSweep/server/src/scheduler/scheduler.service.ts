import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { AwsService } from '../aws/aws.service';
import { SubscriptionService } from '../common/subscription.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
    private readonly subscription: SubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledTasks() {
    this.logger.debug('Checking for scheduled tasks...');

    const now = new Date();
    const currentTimeUTC = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

    // Find all enabled schedules
    const schedules = await this.prisma.schedule.findMany({
      where: {
        isEnabled: true,
      },
      include: {
        account: true, // Include account to access userId
      },
    });

    for (const schedule of schedules) {
      try {
        // GTM: Skip automated tasks if user is not PRO
        const isPro = await this.subscription.isPro(schedule.account.userId);
        if (!isPro) {
          this.logger.warn(`Skipping schedule ${schedule.id} for FREE user ${schedule.account.userId}`);
          continue;
        }

        // Check if it's time to stop the instance
        if (schedule.stopTime === currentTimeUTC) {
          this.logger.log(
            `Stopping instance ${schedule.instanceId} in region ${schedule.region}`,
          );
          await this.awsService.stopInstance(
            schedule.accountId,
            schedule.region,
            schedule.instanceId,
            schedule.account.userId, // Use userId from the related cloud account
          );
          this.logger.log(
            `Successfully stopped instance ${schedule.instanceId}`,
          );
        }

        // Check if it's time to start the instance
        if (schedule.startTime === currentTimeUTC) {
          this.logger.log(
            `Starting instance ${schedule.instanceId} in region ${schedule.region}`,
          );
          await this.awsService.startInstance(
            schedule.accountId,
            schedule.region,
            schedule.instanceId,
            schedule.account.userId,
          );
          this.logger.log(
            `Successfully started instance ${schedule.instanceId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error processing schedule ${schedule.id}: ${error.message}`,
        );
      }
    }
  }

  async createSchedule(data: {
    instanceId: string;
    accountId: string;
    region: string;
    stopTime: string;
    startTime: string;
    timezone: string;
  }, userId: string) {
    // GTM: Check if user is PRO before allowing schedule creation
    const isPro = await this.subscription.isPro(userId);
    if (!isPro) {
      throw new ForbiddenException('Upgrade to PRO to use automated Power Scheduling');
    }

    return this.prisma.schedule.create({
      data,
    });
  }

  async updateSchedule(
    id: string,
    data: {
      stopTime?: string;
      startTime?: string;
      timezone?: string;
      isEnabled?: boolean;
    },
    userId: string,
  ) {
    const isPro = await this.subscription.isPro(userId);
    if (!isPro) {
      throw new ForbiddenException('Upgrade to PRO to use automated Power Scheduling');
    }

    return this.prisma.schedule.update({
      where: { id },
      data,
    });
  }

  async deleteSchedule(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async listSchedules(accountId: string, userId: string) {
    // Ensure the account belongs to the user
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });
    
    if (!account) {
      throw new Error('Account not found or access denied');
    }

    return this.prisma.schedule.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
