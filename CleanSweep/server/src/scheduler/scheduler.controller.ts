import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { AwsService } from '../aws/aws.service';
import { KindeAuthGuard } from '../auth/kinde-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('api/scheduler')
@UseGuards(KindeAuthGuard)
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly awsService: AwsService,
  ) {}

  @Get('instances/:accountId/:region')
  async listInstances(
    @Param('accountId') accountId: string,
    @Param('region') region: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.awsService.listInstances(accountId, region, user.id);
  }

  @Get('schedules/:accountId')
  async listSchedules(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schedulerService.listSchedules(accountId, user.id);
  }

  @Post('schedules')
  async createSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    data: {
      instanceId: string;
      accountId: string;
      region: string;
      stopTime: string;
      startTime: string;
      timezone: string;
    },
  ) {
    return this.schedulerService.createSchedule(data, user.id);
  }

  @Put('schedules/:id')
  async updateSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    data: {
      stopTime?: string;
      startTime?: string;
      timezone?: string;
      isEnabled?: boolean;
    },
  ) {
    return this.schedulerService.updateSchedule(id, data, user.id);
  }

  @Delete('schedules/:id')
  async deleteSchedule(@Param('id') id: string) {
    return this.schedulerService.deleteSchedule(id);
  }

  @Post('stop-instance/:accountId/:region/:instanceId')
  async stopInstance(
    @Param('accountId') accountId: string,
    @Param('region') region: string,
    @Param('instanceId') instanceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.awsService.stopInstance(accountId, region, instanceId, user.id);
    return {
      success: true,
      message: `Instance ${instanceId} is stopping`,
    };
  }
}
