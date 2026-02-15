import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { KindeAuthGuard } from '../auth/kinde-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('api/scanner')
@UseGuards(KindeAuthGuard)
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Get('run/:accountId')
  async runScan(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scannerService.runScan(accountId, user.id);
  }

  @Get('idle-instances/:accountId')
  async getIdleInstances(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scannerService.getIdleInstances(accountId, user.id);
  }

  @Delete('ebs/:accountId/:region/:volumeId')
  async deleteEbsVolume(
    @Param('accountId') accountId: string,
    @Param('region') region: string,
    @Param('volumeId') volumeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scannerService.deleteVolume(accountId, region, volumeId, user.id);
  }
}
