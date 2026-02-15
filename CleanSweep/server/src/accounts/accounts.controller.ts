import { Body, Controller, Get, Post, UseGuards, Delete, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateCloudAccountDto } from './dto/create-cloud-account.dto';
import { KindeAuthGuard } from '../auth/kinde-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('api/accounts')
@UseGuards(KindeAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(
    @Body() createCloudAccountDto: CreateCloudAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.create(createCloudAccountDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.findAll(user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.delete(id, user.id);
  }
}
