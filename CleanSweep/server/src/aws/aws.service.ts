import { Injectable } from '@nestjs/common';
import { 
  EC2Client, 
  DescribeVolumesCommand, 
  DeleteVolumeCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../common/encryption.service';


export interface OrphanedVolume {
  resourceId: string;
  sizeGb: number;
  region: string;
  monthlyCost: number;
}

export interface IdleInstance {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  region: string;
  avgCpuUtilization: number;
  monthlyCost: number;
}

@Injectable()
export class AwsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async scanForWaste(accountId: string): Promise<OrphanedVolume[]> {
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

    // List of AWS regions to scan
    const regionsToScan = [
      'us-east-1',
      'us-west-2',
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'eu-west-1',
      'eu-central-1',
    ];

    const allOrphanedVolumes: OrphanedVolume[] = [];

    // Scan each region for orphaned volumes
    for (const region of regionsToScan) {
      try {
        const ec2Client = new EC2Client({
          region: region,
          credentials: {
            accessKeyId: account.accessKey,
            secretAccessKey: decryptedSecretKey,
          },
        });

        const command = new DescribeVolumesCommand({});
        const response = await ec2Client.send(command);

        if (response.Volumes) {
          for (const volume of response.Volumes) {
            if (volume.State === 'available') {
              const sizeGb = volume.Size || 0;
              const monthlyCost = sizeGb * 0.1; // $0.10 per GB per month

              allOrphanedVolumes.push({
                resourceId: volume.VolumeId || 'unknown',
                sizeGb,
                region: region,
                monthlyCost,
              });
            }
          }
        }
      } catch (error) {
        // Log error for this region but continue scanning other regions
        console.error(`Error scanning region ${region}:`, error.message);
      }
    }

    return allOrphanedVolumes;
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

  async stopInstance(accountId: string, region: string, instanceId: string): Promise<void> {
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const decryptedSecretKey = this.encryptionService.decrypt(account.secretKey);

    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      },
    });

    const command = new StopInstancesCommand({
      InstanceIds: [instanceId],
    });

    await ec2Client.send(command);
  }

  async startInstance(accountId: string, region: string, instanceId: string): Promise<void> {
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const decryptedSecretKey = this.encryptionService.decrypt(account.secretKey);

    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      },
    });

    const command = new StartInstancesCommand({
      InstanceIds: [instanceId],
    });

    await ec2Client.send(command);
  }

  async listInstances(accountId: string, region: string) {
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const decryptedSecretKey = this.encryptionService.decrypt(account.secretKey);

    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      },
    });

    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    const instances: any[] = [];

    if (response.Reservations) {
      for (const reservation of response.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            instances.push({
              instanceId: instance.InstanceId,
              instanceType: instance.InstanceType,
              state: instance.State?.Name,
              launchTime: instance.LaunchTime,
              availabilityZone: instance.Placement?.AvailabilityZone,
              tags: instance.Tags?.reduce((acc, tag) => {
                if (tag.Key) acc[tag.Key] = tag.Value || '';
                return acc;
              }, {} as Record<string, string>),
            });
          }
        }
      }
    }

    return instances;
  }

  async getIdleInstances(accountId: string): Promise<IdleInstance[]> {
    const account = await this.prisma.cloudAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const decryptedSecretKey = this.encryptionService.decrypt(
      account.secretKey,
    );

    // List of AWS regions to scan (same as volume scanner)
    const regionsToScan = [
      'us-east-1',
      'us-west-2',
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'eu-west-1',
      'eu-central-1',
    ];

    const allIdleInstances: IdleInstance[] = [];

    // Scan each region for idle instances
    for (const region of regionsToScan) {
      try {
        const ec2Client = new EC2Client({
          region: region,
          credentials: {
            accessKeyId: account.accessKey,
            secretAccessKey: decryptedSecretKey,
          },
        });

        const cloudWatchClient = new CloudWatchClient({
          region: region,
          credentials: {
            accessKeyId: account.accessKey,
            secretAccessKey: decryptedSecretKey,
          },
        });

        // Get all running instances in this region
        const describeCommand = new DescribeInstancesCommand({
          Filters: [
            {
              Name: 'instance-state-name',
              Values: ['running'],
            },
          ],
        });
        const instancesResponse = await ec2Client.send(describeCommand);

        if (instancesResponse.Reservations) {
          for (const reservation of instancesResponse.Reservations) {
            if (reservation.Instances) {
              for (const instance of reservation.Instances) {
                const instanceId = instance.InstanceId;
                if (!instanceId) continue;

                // Get CPU metrics for the last 7 days
                const endTime = new Date();
                const startTime = new Date();
                startTime.setDate(startTime.getDate() - 7);

                const metricsCommand = new GetMetricStatisticsCommand({
                  Namespace: 'AWS/EC2',
                  MetricName: 'CPUUtilization',
                  Dimensions: [
                    {
                      Name: 'InstanceId',
                      Value: instanceId,
                    },
                  ],
                  StartTime: startTime,
                  EndTime: endTime,
                  Period: 3600, // 1 hour periods
                  Statistics: ['Average'],
                });

                const metricsResponse = await cloudWatchClient.send(
                  metricsCommand,
                );

                // Calculate average CPU utilization
                let avgCpu = 0;
                if (
                  metricsResponse.Datapoints &&
                  metricsResponse.Datapoints.length > 0
                ) {
                  const sum = metricsResponse.Datapoints.reduce(
                    (acc, dp) => acc + (dp.Average || 0),
                    0,
                  );
                  avgCpu = sum / metricsResponse.Datapoints.length;
                }

                // Only include instances with avg CPU < 5%
                if (avgCpu < 5) {
                  // Get instance name from tags
                  const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
                  const instanceName = nameTag?.Value || 'Unnamed';

                  // Calculate monthly cost (simplified pricing)
                  const instanceType = instance.InstanceType || 't2.micro';
                  const monthlyCost = this.calculateInstanceMonthlyCost(
                    instanceType,
                  );

                  allIdleInstances.push({
                    instanceId,
                    instanceName,
                    instanceType,
                    region,
                    avgCpuUtilization: Math.round(avgCpu * 100) / 100,
                    monthlyCost,
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        // Log error for this region but continue scanning other regions
        console.error(
          `Error scanning region ${region} for idle instances:`,
          error.message,
        );
      }
    }

    return allIdleInstances;
  }

  // Helper method to calculate approximate monthly cost based on instance type
  private calculateInstanceMonthlyCost(instanceType: string): number {
    // Simplified pricing (approximate on-demand pricing per month)
    const pricing: Record<string, number> = {
      't2.micro': 8.5,
      't2.small': 17,
      't2.medium': 34,
      't2.large': 68,
      't3.micro': 7.5,
      't3.small': 15,
      't3.medium': 30,
      't3.large': 60,
      'm5.large': 70,
      'm5.xlarge': 140,
      'm5.2xlarge': 280,
      'c5.large': 62,
      'c5.xlarge': 124,
      'r5.large': 91,
      'r5.xlarge': 182,
    };

    return pricing[instanceType] || 50; // Default to $50 if type not found
  }
}
