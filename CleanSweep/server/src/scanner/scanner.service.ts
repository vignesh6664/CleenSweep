import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { PrismaService } from '../prisma.service';

export interface ScanSummary {
  totalSavings: number;
  resourcesFound: number;
  results: any[];
}

@Injectable()
export class ScannerService {
  constructor(
    private readonly awsService: AwsService,
    private readonly prisma: PrismaService,
  ) {}

  async runScan(accountId: string): Promise<ScanSummary> {
    try {
      // Call AWS service to scan for orphaned volumes
      const orphanedVolumes = await this.awsService.scanForWaste(accountId);

      // Save each result to database
      const savedResults: any[] = [];
      for (const volume of orphanedVolumes) {
        const scanResult = await this.prisma.scanResult.create({
          data: {
            resourceId: volume.resourceId,
            resourceType: 'EBS',
            sizeGb: volume.sizeGb,
            region: volume.region,
            monthlyCost: volume.monthlyCost,
            accountId: accountId,
          },
        });
        savedResults.push(scanResult);
      }

      // Calculate total potential savings
      const totalSavings = orphanedVolumes.reduce(
        (sum, vol) => sum + vol.monthlyCost,
        0,
      );

      return {
        totalSavings,
        resourcesFound: orphanedVolumes.length,
        results: savedResults,
      };
    } catch (error) {
      // Log error but return empty results instead of throwing
      console.error('Scanner error:', error.message);
      
      return {
        totalSavings: 0,
        resourcesFound: 0,
        results: [],
      };
    }
  }

  async deleteVolume(accountId: string, region: string, volumeId: string) {
    // Call AWS service to delete the volume
    await this.awsService.deleteEbsVolume(accountId, region, volumeId);

    // Delete the corresponding scan result from database
    await this.prisma.scanResult.deleteMany({
      where: {
        accountId,
        resourceId: volumeId,
      },
    });

    return {
      success: true,
      message: `Volume ${volumeId} deleted successfully`,
    };
  }

  async getIdleInstances(accountId: string) {
    try {
      // Call AWS service to get idle instances
      const idleInstances = await this.awsService.getIdleInstances(accountId);
      
      return {
        resourcesFound: idleInstances.length,
        totalMonthlyCost: idleInstances.reduce((sum, inst) => sum + inst.monthlyCost, 0),
        instances: idleInstances,
      };
    } catch (error) {
      console.error('Error fetching idle instances:', error.message);
      return {
        resourcesFound: 0,
        totalMonthlyCost: 0,
        instances: [],
      };
    }
  }
}
