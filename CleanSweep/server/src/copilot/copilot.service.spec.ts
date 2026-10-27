import { Test, TestingModule } from '@nestjs/testing';
import { CopilotToolsService } from './copilot-tools.service';
import { CopilotService } from './copilot.service';
import { AwsService } from '../aws/aws.service';
import { PrismaService } from '../prisma.service';
import { SubscriptionService } from '../common/subscription.service';
import { AuditLogService } from '../common/audit-log.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CleanSweep Copilot Tests', () => {
  let toolsService: CopilotToolsService;
  let copilotService: CopilotService;

  const mockAwsService = {
    scanForWaste: jest.fn(),
    getIdleInstances: jest.fn(),
    getResourceTags: jest.fn(),
    deleteEbsVolume: jest.fn(),
    stopInstance: jest.fn(),
  };

  const mockPrismaService = {
    cloudAccount: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    scanResult: {
      deleteMany: jest.fn(),
    },
  };

  const mockSubscriptionService = {
    isPro: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopilotToolsService,
        CopilotService,
        { provide: AwsService, useValue: mockAwsService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    toolsService = module.get<CopilotToolsService>(CopilotToolsService);
    copilotService = module.get<CopilotService>(CopilotService);
  });

  describe('Tool 1: getSavingsSummary', () => {
    it('aggregates waste and groups by region/type', async () => {
      mockPrismaService.cloudAccount.findMany.mockResolvedValue([
        { id: 'acc_1', userId: 'user_1', accountName: 'Dev Account' },
      ]);
      mockAwsService.scanForWaste.mockResolvedValue([
        { resourceId: 'vol-1', sizeGb: 100, region: 'us-east-1', monthlyCost: 10 },
      ]);
      mockAwsService.getIdleInstances.mockResolvedValue([
        { instanceId: 'i-1', region: 'us-east-1', avgCpuUtilization: 1.2, monthlyCost: 50 },
      ]);

      const result = await toolsService.getSavingsSummary('user_1', { groupBy: 'type' });
      expect(result.totalMonthlyWaste).toBe(60);
      expect(result.allGroupings.byType.EBS).toBe(10);
      expect(result.allGroupings.byType.EC2).toBe(50);
      expect(result.allGroupings.byRegion['us-east-1']).toBe(60);
    });
  });

  describe('Tool 2: listZombieVolumes', () => {
    it('filters orphaned volumes by region', async () => {
      mockPrismaService.cloudAccount.findMany.mockResolvedValue([
        { id: 'acc_1', userId: 'user_1', accountName: 'Dev Account' },
      ]);
      mockAwsService.scanForWaste.mockResolvedValue([
        { resourceId: 'vol-1', sizeGb: 50, region: 'us-east-1', monthlyCost: 5 },
        { resourceId: 'vol-2', sizeGb: 80, region: 'eu-west-1', monthlyCost: 8 },
      ]);

      const result = await toolsService.listZombieVolumes('user_1', { region: 'us-east-1' });
      expect(result.totalFound).toBe(1);
      expect(result.volumes[0].resourceId).toBe('vol-1');
    });
  });

  describe('Tool 3: listIdleInstances', () => {
    it('filters idle instances by maxCpuPercent', async () => {
      mockPrismaService.cloudAccount.findMany.mockResolvedValue([
        { id: 'acc_1', userId: 'user_1', accountName: 'Dev Account' },
      ]);
      mockAwsService.getIdleInstances.mockResolvedValue([
        { instanceId: 'i-low', region: 'us-east-1', avgCpuUtilization: 2.1, monthlyCost: 30 },
        { instanceId: 'i-med', region: 'us-east-1', avgCpuUtilization: 4.8, monthlyCost: 70 },
      ]);

      const result = await toolsService.listIdleInstances('user_1', { maxCpuPercent: 3 });
      expect(result.totalFound).toBe(1);
      expect(result.instances[0].instanceId).toBe('i-low');
    });
  });

  describe('Tool 4: checkResourceTags', () => {
    it('blocks resources tagged production or protected', async () => {
      mockPrismaService.cloudAccount.findFirst.mockResolvedValue({ id: 'acc_1', userId: 'user_1' });
      mockAwsService.getResourceTags.mockResolvedValue({
        Environment: 'production',
        Owner: 'FinOps',
      });

      const check = await toolsService.checkResourceTags('user_1', {
        resourceId: 'vol-prod',
        region: 'us-east-1',
        accountId: 'acc_1',
      });

      expect(check.blocked).toBe(true);
      expect(check.reason).toContain('production/protected');
    });

    it('allows resources tagged staging or development', async () => {
      mockPrismaService.cloudAccount.findFirst.mockResolvedValue({ id: 'acc_1', userId: 'user_1' });
      mockAwsService.getResourceTags.mockResolvedValue({
        Environment: 'staging',
        Project: 'Demo',
      });

      const check = await toolsService.checkResourceTags('user_1', {
        resourceId: 'vol-dev',
        region: 'us-east-1',
        accountId: 'acc_1',
      });

      expect(check.blocked).toBe(false);
    });
  });

  describe('Tool 5 & Confirmation Flow: proposeAction & confirmAction', () => {
    it('proposes action without executing; blocks if tagged production', async () => {
      mockPrismaService.cloudAccount.findFirst.mockResolvedValue({ id: 'acc_1', userId: 'user_1' });
      mockAwsService.getResourceTags.mockResolvedValue({
        Environment: 'production',
      });

      const proposal = await toolsService.proposeAction('user_1', {
        actionType: 'DELETE_EBS',
        resourceId: 'vol-prod',
        region: 'us-east-1',
        accountId: 'acc_1',
        estimatedMonthlySavings: 20,
        reason: 'Unused disk',
      });

      expect(proposal.proposed).toBe(false);
      expect(proposal.blocked).toBe(true);
      expect(mockAwsService.deleteEbsVolume).not.toHaveBeenCalled();
    });

    it('proposes action for safe resource and executes only upon confirmation by PRO user', async () => {
      mockPrismaService.cloudAccount.findFirst.mockResolvedValue({ id: 'acc_1', userId: 'user_1' });
      mockAwsService.getResourceTags.mockResolvedValue({
        Environment: 'dev',
      });

      const proposal = await toolsService.proposeAction('user_1', {
        actionType: 'DELETE_EBS',
        resourceId: 'vol-dev',
        region: 'us-east-1',
        accountId: 'acc_1',
        estimatedMonthlySavings: 25,
        reason: 'Unattached EBS disk',
      });

      expect(proposal.proposed).toBe(true);
      expect(proposal.action).toBeDefined();
      expect(mockAwsService.deleteEbsVolume).not.toHaveBeenCalled();

      // Free user attempts confirmation -> ForbiddenException
      mockSubscriptionService.isPro.mockResolvedValue(false);
      await expect(toolsService.confirmAction('user_1', proposal.action!.id)).rejects.toThrow(
        ForbiddenException,
      );

      // PRO user confirms -> Execution occurs + AuditLog with actor: 'agent', approved_by: userId
      mockSubscriptionService.isPro.mockResolvedValue(true);
      const confirmResult = await toolsService.confirmAction('user_1', proposal.action!.id);

      expect(confirmResult.success).toBe(true);
      expect(mockAwsService.deleteEbsVolume).toHaveBeenCalledWith('acc_1', 'us-east-1', 'vol-dev', 'user_1');
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE_EBS',
          resourceId: 'vol-dev',
          userId: 'user_1',
          details: expect.objectContaining({
            actor: 'agent',
            approved_by: 'user_1',
          }),
        }),
      );
    });
  });

  describe('Copilot "I don\'t know" & Fallback Guardrails', () => {
    it('returns "I don\'t know" when question is unrelated to cloud waste', async () => {
      const response = await copilotService.processChat('user_1', {
        message: 'What is the weather in Tokyo today?',
      });

      expect(response.reply).toContain("I don't know");
    });
  });
});
