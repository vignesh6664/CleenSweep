import { Controller, Get, Param } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('api/scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Get('run/:accountId')
  async runScan(@Param('accountId') accountId: string) {
    return this.scannerService.runScan(accountId);
  }
}
