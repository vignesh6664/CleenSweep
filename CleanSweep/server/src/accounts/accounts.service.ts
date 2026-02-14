import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCloudAccountDto } from './dto/create-cloud-account.dto';
import { EncryptionService } from '../common/encryption.service';
import { Provider } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createCloudAccountDto: CreateCloudAccountDto) {
    const encryptedSecretKey = this.encryptionService.encrypt(
      createCloudAccountDto.secretKey,
    );

    return this.prisma.cloudAccount.create({
      data: {
        ...createCloudAccountDto,
        secretKey: encryptedSecretKey,
        provider: createCloudAccountDto.provider as Provider,
      },
    });
  }

  async findAll() {
    return this.prisma.cloudAccount.findMany();
  }
}
