import { Injectable } from '@nestjs/common';
import { EC2Client, DescribeVolumesCommand, DeleteVolumeCommand } from '@aws-sdk/client-ec2';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../common/encryption.service';

export interface OrphanedVolume {
  resourceId: string;
  sizeGb: number;
  region: string;
  monthlyCost: number;
}

@Injectable()
export class AwsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async scanForWaste(accountId: string): Promise<OrphanedVolume[]> {
    // Fetch CloudAccount from database
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    // Decrypt AWS credentials
    const decryptedSecretKey = this.encryptionService.decrypt(
      account.secretKey,
    );

    // Create EC2 client with decrypted credentials
    const ec2Client = new EC2Client({
      region: account.region,
      credentials: {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      },
    });

    // Execute DescribeVolumes command
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    // Filter for orphaned volumes (State === 'available')
    const orphanedVolumes: OrphanedVolume[] = [];

    if (response.Volumes) {
      for (const volume of response.Volumes) {
        if (volume.State === 'available') {
          const sizeGb = volume.Size || 0;
          const monthlyCost = sizeGb * 0.1; // $0.10 per GB per month

          orphanedVolumes.push({
            resourceId: volume.VolumeId || 'unknown',
            sizeGb,
            region: volume.AvailabilityZone || account.region,
            monthlyCost,
          });
        }
      }
    }

    return orphanedVolumes;
  }

  async deleteEbsVolume(accountId: string, region: string, volumeId: string): Promise<void> {
    // Fetch CloudAccount from database
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    // Decrypt AWS credentials
    const decryptedSecretKey = this.encryptionService.decrypt(
      account.secretKey,
    );

    // Create EC2 client with decrypted credentials for the specified region
    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      },
    });

    // Execute DeleteVolume command
    const command = new DeleteVolumeCommand({
      VolumeId: volumeId,
    });

    await ec2Client.send(command);
  }
}
