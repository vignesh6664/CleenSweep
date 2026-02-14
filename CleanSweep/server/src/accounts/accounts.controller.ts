import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateCloudAccountDto } from './dto/create-cloud-account.dto';

@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createCloudAccountDto: CreateCloudAccountDto) {
    return this.accountsService.create(createCloudAccountDto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }
}
