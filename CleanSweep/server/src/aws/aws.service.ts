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
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { PrismaService } from '../prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditLogService } from '../common/audit-log.service';
import { CloudAccount } from '@prisma/client';


export interface OrphanedVolume {
  resourceId: string;
  sizeGb: number;
  region: string;
  monthlyCost: number;
  tags?: Record<string, string>;
}

export interface IdleInstance {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  region: string;
  avgCpuUtilization: number;
  monthlyCost: number;
  tags?: Record<string, string>;
}

@Injectable()
export class AwsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async getCredentials(account: CloudAccount) {
    if (account.roleArn && account.externalId) {
      // Use STS AssumeRole
      // SECURITY: Explicitly provide Master credentials from ENV for local dev
      const masterCredentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      };

      const stsClient = new STSClient({ 
        region: 'us-east-1',
        credentials: masterCredentials.accessKeyId ? masterCredentials : undefined
      });

      const command = new AssumeRoleCommand({
        RoleArn: account.roleArn,
        ExternalId: account.externalId,
        RoleSessionName: 'CleanSweepSession',
      });

      const response = await stsClient.send(command);

      if (!response.Credentials) {
        throw new Error('Failed to assume role: No credentials returned');
      }

      return {
        accessKeyId: response.Credentials.AccessKeyId!,
        secretAccessKey: response.Credentials.SecretAccessKey!,
        sessionToken: response.Credentials.SessionToken!,
      };
    } else if (account.accessKey && account.secretKey) {
      // Use legacy Access Keys
      const decryptedSecretKey = this.encryptionService.decrypt(account.secretKey);
      return {
        accessKeyId: account.accessKey,
        secretAccessKey: decryptedSecretKey,
      };
    } else {
      throw new Error('Account has no valid credentials (missing keys or role info)');
    }
  }

  async validateAccount(accountData: Partial<CloudAccount>): Promise<boolean> {
    try {
      let credentials;
      if (accountData.roleArn && accountData.externalId) {
        const masterCredentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        };

        const stsClient = new STSClient({ 
          region: 'us-east-1',
          credentials: masterCredentials.accessKeyId ? masterCredentials : undefined
        });

        const command = new AssumeRoleCommand({
          RoleArn: accountData.roleArn,
          ExternalId: accountData.externalId,
          RoleSessionName: 'CleanSweepValidation',
        });
        const response = await stsClient.send(command);
        credentials = {
          accessKeyId: response.Credentials?.AccessKeyId!,
          secretAccessKey: response.Credentials?.SecretAccessKey!,
          sessionToken: response.Credentials?.SessionToken!,
        };
      } else if (accountData.accessKey && accountData.secretKey) {
        // For validation, we might receive unencrypted secret key
        credentials = {
          accessKeyId: accountData.accessKey,
          secretAccessKey: accountData.secretKey,
        };
      } else {
        return false;
      }

      const ec2Client = new EC2Client({
        region: accountData.region || 'us-east-1',
        credentials,
      });

      await ec2Client.send(new DescribeVolumesCommand({ MaxResults: 5 }));
      return true;
    } catch (error) {
      console.error('Account validation failed:', error.message);
      return false;
    }
  }

  async scanForWaste(accountId: string, userId: string): Promise<OrphanedVolume[]> {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const credentials = await this.getCredentials(account);

    const regionsToScan = [
      'us-east-1',
      'us-west-2',
      'ap-south-1',
      'ap-south-2',
      'ap-southeast-1',
      'ap-southeast-2',
      'eu-west-1',
      'eu-central-1',
    ];

    const allOrphanedVolumes: OrphanedVolume[] = [];

    for (const region of regionsToScan) {
      try {
        const ec2Client = new EC2Client({
          region: region,
          credentials,
        });

        const command = new DescribeVolumesCommand({});
        const response = await ec2Client.send(command);

        if (response.Volumes) {
          for (const volume of response.Volumes) {
            if (volume.State === 'available') {
              const sizeGb = volume.Size || 0;
              const monthlyCost = sizeGb * 0.1;

              const tags = volume.Tags?.reduce((acc, tag) => {
                if (tag.Key) acc[tag.Key] = tag.Value || '';
                return acc;
              }, {} as Record<string, string>) || {};

              allOrphanedVolumes.push({
                resourceId: volume.VolumeId || 'unknown',
                sizeGb,
                region: region,
                monthlyCost,
                tags,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning region ${region}:`, error.message);
      }
    }

    return allOrphanedVolumes;
  }

  async deleteEbsVolume(accountId: string, region: string, volumeId: string, userId: string): Promise<void> {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw new Error(`Account not found`);

    const credentials = await this.getCredentials(account);

    const ec2Client = new EC2Client({ region, credentials });

    await ec2Client.send(new DeleteVolumeCommand({ VolumeId: volumeId }));
    
    // Log the action
    await this.auditLog.log({
      action: 'DELETE_EBS_VOLUME',
      resourceId: volumeId,
      accountId,
      userId,
      details: { region, timestamp: new Date() },
    });
  }

  async stopInstance(accountId: string, region: string, instanceId: string, userId: string): Promise<void> {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new Error(`Account not found`);

    const credentials = await this.getCredentials(account);
    const ec2Client = new EC2Client({ region, credentials });

    await ec2Client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
    
    // Log the action
    await this.auditLog.log({
      action: 'STOP_INSTANCE',
      resourceId: instanceId,
      accountId,
      userId,
      details: { region, timestamp: new Date() },
    });
  }

  async startInstance(accountId: string, region: string, instanceId: string, userId: string): Promise<void> {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new Error(`Account not found`);

    const credentials = await this.getCredentials(account);
    const ec2Client = new EC2Client({ region, credentials });

    await ec2Client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
    
    // Log the action
    await this.auditLog.log({
      action: 'START_INSTANCE',
      resourceId: instanceId,
      accountId,
      userId,
      details: { region, timestamp: new Date() },
    });
  }

  async listInstances(accountId: string, region: string, userId: string) {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new Error(`Account not found`);

    const credentials = await this.getCredentials(account);
    const ec2Client = new EC2Client({ region, credentials });

    const response = await ec2Client.send(new DescribeInstancesCommand({}));
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

  async getIdleInstances(accountId: string, userId: string): Promise<IdleInstance[]> {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new Error(`Account not found`);

    const credentials = await this.getCredentials(account);

    const regionsToScan = [
      'us-east-1',
      'us-west-2',
      'ap-south-1',
      'ap-south-2',
      'ap-southeast-1',
      'ap-southeast-2',
      'eu-west-1',
      'eu-central-1',
    ];

    const allIdleInstances: IdleInstance[] = [];

    for (const region of regionsToScan) {
      try {
        const ec2Client = new EC2Client({ region, credentials });
        const cloudWatchClient = new CloudWatchClient({ region, credentials });

        const describeCommand = new DescribeInstancesCommand({
          Filters: [{ Name: 'instance-state-name', Values: ['running'] }],
        });
        const instancesResponse = await ec2Client.send(describeCommand);

        if (instancesResponse.Reservations) {
          for (const reservation of instancesResponse.Reservations) {
            if (reservation.Instances) {
              for (const instance of reservation.Instances) {
                const instanceId = instance.InstanceId;
                if (!instanceId) continue;

                const endTime = new Date();
                const startTime = new Date();
                startTime.setDate(startTime.getDate() - 7);

                const metricsCommand = new GetMetricStatisticsCommand({
                  Namespace: 'AWS/EC2',
                  MetricName: 'CPUUtilization',
                  Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
                  StartTime: startTime,
                  EndTime: endTime,
                  Period: 3600,
                  Statistics: ['Average'],
                });

                const metricsResponse = await cloudWatchClient.send(metricsCommand);

                let avgCpu = 0;
                if (metricsResponse.Datapoints && metricsResponse.Datapoints.length > 0) {
                  const sum = metricsResponse.Datapoints.reduce((acc, dp) => acc + (dp.Average || 0), 0);
                  avgCpu = sum / metricsResponse.Datapoints.length;
                }

                if (avgCpu < 5) {
                  const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
                  const instanceName = nameTag?.Value || 'Unnamed';
                  const instanceType = instance.InstanceType || 't2.micro';
                  const monthlyCost = this.calculateInstanceMonthlyCost(instanceType);

                  const tags = instance.Tags?.reduce((acc, tag) => {
                    if (tag.Key) acc[tag.Key] = tag.Value || '';
                    return acc;
                  }, {} as Record<string, string>) || {};

                  allIdleInstances.push({
                    instanceId,
                    instanceName,
                    instanceType,
                    region,
                    avgCpuUtilization: Math.round(avgCpu * 100) / 100,
                    monthlyCost,
                    tags,
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning region ${region} for idle instances:`, error.message);
      }
    }
    return allIdleInstances;
  }

  async getResourceTags(
    accountId: string,
    region: string,
    resourceId: string,
    userId: string,
  ): Promise<Record<string, string>> {
    try {
      const account = await this.prisma.cloudAccount.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) return {};

      const credentials = await this.getCredentials(account);
      const ec2Client = new EC2Client({ region, credentials });

      if (resourceId.startsWith('vol-')) {
        const response = await ec2Client.send(
          new DescribeVolumesCommand({ VolumeIds: [resourceId] }),
        );
        const volume = response.Volumes?.[0];
        return (
          volume?.Tags?.reduce((acc, tag) => {
            if (tag.Key) acc[tag.Key] = tag.Value || '';
            return acc;
          }, {} as Record<string, string>) || {}
        );
      } else if (resourceId.startsWith('i-')) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [resourceId] }),
        );
        const instance = response.Reservations?.[0]?.Instances?.[0];
        return (
          instance?.Tags?.reduce((acc, tag) => {
            if (tag.Key) acc[tag.Key] = tag.Value || '';
            return acc;
          }, {} as Record<string, string>) || {}
        );
      }
      return {};
    } catch (error) {
      console.warn(`Could not fetch tags for ${resourceId}:`, error.message);
      return {};
    }
  }

  private calculateInstanceMonthlyCost(instanceType: string): number {
    const pricing: Record<string, number> = {
      't2.micro': 8.5, 't2.small': 17, 't2.medium': 34, 't2.large': 68,
      't3.micro': 7.5, 't3.small': 15, 't3.medium': 30, 't3.large': 60,
      'm5.large': 70, 'm5.xlarge': 140, 'm5.2xlarge': 280,
      'c5.large': 62, 'c5.xlarge': 124,
      'r5.large': 91, 'r5.xlarge': 182,
    };
    return pricing[instanceType] || 50;
  }
}
