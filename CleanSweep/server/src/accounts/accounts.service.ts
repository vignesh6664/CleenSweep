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

  async create(createCloudAccountDto: CreateCloudAccountDto, userId: string) {
    const { secretKey, ...rest } = createCloudAccountDto;
    
    let encryptedSecretKey: string | undefined = undefined;
    if (secretKey) {
      encryptedSecretKey = this.encryptionService.encrypt(secretKey);
    }

    return this.prisma.cloudAccount.create({
      data: {
        ...rest,
        secretKey: encryptedSecretKey,
        provider: rest.provider as Provider,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.cloudAccount.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.cloudAccount.findFirst({
      where: { id, userId },
    });
  }

  async delete(id: string, userId: string) {
    // Verify ownership before deleting
    const account = await this.findOne(id, userId);
    if (!account) {
      throw new Error('Account not found or access denied');
    }

    return this.prisma.cloudAccount.delete({
      where: { id },
    });
  }
}
