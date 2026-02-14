import { Controller, Get, Param, Delete } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('api/scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Get('run/:accountId')
  async runScan(@Param('accountId') accountId: string) {
    return this.scannerService.runScan(accountId);
  }

  @Delete('ebs/:accountId/:region/:volumeId')
  async deleteEbsVolume(
    @Param('accountId') accountId: string,
    @Param('region') region: string,
    @Param('volumeId') volumeId: string,
  ) {
    return this.scannerService.deleteVolume(accountId, region, volumeId);
  }
}
