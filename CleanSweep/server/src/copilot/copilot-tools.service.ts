import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { PrismaService } from '../prisma.service';
import { SubscriptionService } from '../common/subscription.service';
import { AuditLogService } from '../common/audit-log.service';
import { PendingAction, TagCheckResult } from './copilot.types';
import { randomUUID } from 'crypto';

@Injectable()
export class CopilotToolsService {
  private readonly logger = new Logger(CopilotToolsService.name);

  // In-memory store for pending proposals: actionId -> PendingAction
  private readonly pendingActions = new Map<string, PendingAction>();

  constructor(
    private readonly awsService: AwsService,
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService,
    private readonly auditLog: AuditLogService,
  ) {
    // Periodic cleanup of expired actions every 5 minutes (unref so tests exit cleanly)
    const cleanupInterval = setInterval(() => this.cleanupExpiredActions(), 5 * 60 * 1000);
    if (cleanupInterval.unref) {
      cleanupInterval.unref();
    }
  }

  private cleanupExpiredActions() {
    const now = Date.now();
    for (const [id, action] of this.pendingActions.entries()) {
      if (new Date(action.expiresAt).getTime() <= now) {
        this.pendingActions.delete(id);
      }
    }
  }

  /**
   * Helper to resolve the targeted AWS accounts owned by the authenticated tenant
   */
  private async getTenantAccounts(userId: string, accountId?: string) {
    if (accountId) {
      const acc = await this.prisma.cloudAccount.findFirst({
        where: { id: accountId, userId },
      });
      return acc ? [acc] : [];
    }
    return this.prisma.cloudAccount.findMany({
      where: { userId },
    });
  }

  // -------------------------------------------------------------
  // Tool 1: getSavingsSummary
  // -------------------------------------------------------------
  async getSavingsSummary(
    userId: string,
    params: { accountId?: string; groupBy?: 'region' | 'type' } = {},
  ) {
    const accounts = await this.getTenantAccounts(userId, params.accountId);
    if (accounts.length === 0) {
      return {
        totalMonthlyWaste: 0,
        currency: 'USD',
        message: 'No connected cloud accounts found for this tenant.',
        breakdown: {},
      };
    }

    let totalWaste = 0;
    const byRegion: Record<string, number> = {};
    const byType: Record<string, number> = { EBS: 0, EC2: 0 };

    for (const acc of accounts) {
      try {
        const volumes = await this.awsService.scanForWaste(acc.id, userId);
        for (const vol of volumes) {
          totalWaste += vol.monthlyCost;
          byType.EBS = (byType.EBS || 0) + vol.monthlyCost;
          byRegion[vol.region] = (byRegion[vol.region] || 0) + vol.monthlyCost;
        }

        const idleInstances = await this.awsService.getIdleInstances(acc.id, userId);
        for (const inst of idleInstances) {
          totalWaste += inst.monthlyCost;
          byType.EC2 = (byType.EC2 || 0) + inst.monthlyCost;
          byRegion[inst.region] = (byRegion[inst.region] || 0) + inst.monthlyCost;
        }
      } catch (err) {
        this.logger.warn(`Failed scanning account ${acc.id} in savings summary: ${err.message}`);
      }
    }

    // Round values
    totalWaste = Math.round(totalWaste * 100) / 100;
    for (const k of Object.keys(byRegion)) byRegion[k] = Math.round(byRegion[k] * 100) / 100;
    for (const k of Object.keys(byType)) byType[k] = Math.round(byType[k] * 100) / 100;

    return {
      totalMonthlyWaste: totalWaste,
      currency: 'USD',
      accountsScanned: accounts.length,
      groupBy: params.groupBy || 'type',
      breakdown: params.groupBy === 'region' ? byRegion : byType,
      allGroupings: {
        byRegion,
        byType,
      },
    };
  }

  // -------------------------------------------------------------
  // Tool 2: listZombieVolumes
  // -------------------------------------------------------------
  async listZombieVolumes(
    userId: string,
    params: { accountId?: string; region?: string; minSizeGb?: number } = {},
  ) {
    const accounts = await this.getTenantAccounts(userId, params.accountId);
    const results: any[] = [];

    for (const acc of accounts) {
      try {
        const volumes = await this.awsService.scanForWaste(acc.id, userId);
        for (const v of volumes) {
          if (params.region && v.region.toLowerCase() !== params.region.toLowerCase()) continue;
          if (params.minSizeGb && v.sizeGb < params.minSizeGb) continue;
          results.push({
            ...v,
            accountId: acc.id,
            accountName: acc.accountName,
          });
        }
      } catch (err) {
        this.logger.warn(`Error scanning zombie volumes for account ${acc.id}: ${err.message}`);
      }
    }

    return {
      totalFound: results.length,
      totalMonthlyCost: Math.round(results.reduce((s, x) => s + x.monthlyCost, 0) * 100) / 100,
      volumes: results,
    };
  }

  // -------------------------------------------------------------
  // Tool 3: listIdleInstances
  // -------------------------------------------------------------
  async listIdleInstances(
    userId: string,
    params: { accountId?: string; region?: string; maxCpuPercent?: number } = {},
  ) {
    const accounts = await this.getTenantAccounts(userId, params.accountId);
    const results: any[] = [];

    for (const acc of accounts) {
      try {
        const instances = await this.awsService.getIdleInstances(acc.id, userId);
        for (const inst of instances) {
          if (params.region && inst.region.toLowerCase() !== params.region.toLowerCase()) continue;
          if (
            params.maxCpuPercent !== undefined &&
            inst.avgCpuUtilization > params.maxCpuPercent
          )
            continue;

          results.push({
            ...inst,
            accountId: acc.id,
            accountName: acc.accountName,
          });
        }
      } catch (err) {
        this.logger.warn(`Error scanning idle instances for account ${acc.id}: ${err.message}`);
      }
    }

    return {
      totalFound: results.length,
      totalMonthlyCost: Math.round(results.reduce((s, x) => s + x.monthlyCost, 0) * 100) / 100,
      instances: results,
    };
  }

  // -------------------------------------------------------------
  // Tool 4: checkResourceTags
  // -------------------------------------------------------------
  async checkResourceTags(
    userId: string,
    params: { resourceId: string; region: string; accountId: string },
  ): Promise<TagCheckResult> {
    const { resourceId, region, accountId } = params;
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return {
        blocked: true,
        reason: `Account not found or access denied for tenant ${userId}`,
      };
    }

    const tags = await this.awsService.getResourceTags(accountId, region, resourceId, userId);

    // Protection rule: Block anything tagged 'production', 'prod', or 'protected'
    for (const [key, val] of Object.entries(tags)) {
      const k = key.toLowerCase();
      const v = String(val).toLowerCase();

      const isProtectedKey =
        k === 'protected' || k === 'production' || k === 'prod' || k === 'environment' || k === 'env';
      const isProtectedVal =
        v === 'production' || v === 'prod' || v === 'protected' || v === 'true';

      if ((isProtectedKey && isProtectedVal) || k === 'protected' && v === 'true') {
        return {
          blocked: true,
          reason: `Blocked by safety policy: resource is tagged '${key}: ${val}' (production/protected resources cannot be modified by Copilot).`,
          tags,
        };
      }
    }

    return {
      blocked: false,
      reason: 'Resource has no production or protected tags and is eligible for remediation.',
      tags,
    };
  }

  // -------------------------------------------------------------
  // Tool 5: proposeAction (Staging only; zero AWS write execution)
  // -------------------------------------------------------------
  async proposeAction(
    userId: string,
    data: {
      actionType: 'DELETE_EBS' | 'STOP_EC2';
      resourceId: string;
      region: string;
      accountId: string;
      estimatedMonthlySavings?: number;
      reason: string;
    },
  ) {
    // 1. Mandatory safety check: Verify tags before staging
    const tagCheck = await this.checkResourceTags(userId, {
      resourceId: data.resourceId,
      region: data.region,
      accountId: data.accountId,
    });

    if (tagCheck.blocked) {
      return {
        proposed: false,
        blocked: true,
        message: tagCheck.reason,
      };
    }

    // 2. Create pending action in in-memory map with 15-min TTL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const actionId = `action_${randomUUID()}`;

    const pendingAction: PendingAction = {
      id: actionId,
      userId,
      accountId: data.accountId,
      actionType: data.actionType,
      resourceId: data.resourceId,
      region: data.region,
      estimatedMonthlySavings: data.estimatedMonthlySavings || 0,
      reason: data.reason || 'Cloud waste remediation proposal by CleanSweep Copilot',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };

    this.pendingActions.set(actionId, pendingAction);

    this.logger.log(
      `[Copilot] Staged pending action ${actionId}: ${data.actionType} for ${data.resourceId} (Tenant: ${userId})`,
    );

    return {
      proposed: true,
      blocked: false,
      message: `Action staged for resource ${data.resourceId}. User confirmation is required before execution.`,
      action: pendingAction,
    };
  }

  // -------------------------------------------------------------
  // Action Confirmation & Execution (Triggered when user clicks Confirm)
  // -------------------------------------------------------------
  async confirmAction(userId: string, actionId: string) {
    const action = this.pendingActions.get(actionId);

    if (!action || action.userId !== userId) {
      throw new NotFoundException('Pending action not found or expired.');
    }

    if (action.status !== 'PENDING') {
      throw new BadRequestException(`Action is already ${action.status.toLowerCase()}.`);
    }

    if (new Date(action.expiresAt).getTime() <= Date.now()) {
      this.pendingActions.delete(actionId);
      throw new BadRequestException('This action proposal has expired. Please ask Copilot to re-scan.');
    }

    // 1. Re-check PRO gating
    const isPro = await this.subscription.isPro(userId);
    if (!isPro) {
      throw new ForbiddenException(
        'Upgrade to PRO to confirm and execute automated cleanups directly from CleanSweep Copilot.',
      );
    }

    // 2. Re-check resource tags before execution
    const tagCheck = await this.checkResourceTags(userId, {
      resourceId: action.resourceId,
      region: action.region,
      accountId: action.accountId,
    });

    if (tagCheck.blocked) {
      action.status = 'DISMISSED';
      throw new ForbiddenException(`Execution aborted: ${tagCheck.reason}`);
    }

    // 3. Execute the actual delete or stop command
    if (action.actionType === 'DELETE_EBS') {
      await this.awsService.deleteEbsVolume(
        action.accountId,
        action.region,
        action.resourceId,
        userId,
      );

      // Clean up scan results table if tracked
      await this.prisma.scanResult.deleteMany({
        where: {
          accountId: action.accountId,
          resourceId: action.resourceId,
        },
      });
    } else if (action.actionType === 'STOP_EC2') {
      await this.awsService.stopInstance(
        action.accountId,
        action.region,
        action.resourceId,
        userId,
      );
    }

    // 4. Record to Audit Log with actor: 'agent', approved_by: userId
    await this.auditLog.log({
      action: action.actionType,
      resourceId: action.resourceId,
      accountId: action.accountId,
      userId,
      details: {
        actor: 'agent',
        approved_by: userId,
        actionId: action.id,
        estimatedMonthlySavings: action.estimatedMonthlySavings,
        executedAt: new Date().toISOString(),
      },
    });

    // 5. Update in-memory state
    action.status = 'EXECUTED';

    return {
      success: true,
      message: `Successfully executed ${action.actionType} on ${action.resourceId}. Potential savings: $${action.estimatedMonthlySavings}/month.`,
      action,
    };
  }

  // -------------------------------------------------------------
  // Dismiss Action
  // -------------------------------------------------------------
  async dismissAction(userId: string, actionId: string) {
    const action = this.pendingActions.get(actionId);
    if (!action || action.userId !== userId) {
      throw new NotFoundException('Pending action not found.');
    }
    action.status = 'DISMISSED';
    this.pendingActions.delete(actionId);
    return { success: true, message: 'Action proposal dismissed.' };
  }

  // -------------------------------------------------------------
  // List Active Pending Actions for Tenant
  // -------------------------------------------------------------
  async listPendingActions(userId: string): Promise<PendingAction[]> {
    const now = Date.now();
    const actions: PendingAction[] = [];
    for (const action of this.pendingActions.values()) {
      if (
        action.userId === userId &&
        action.status === 'PENDING' &&
        new Date(action.expiresAt).getTime() > now
      ) {
        actions.push(action);
      }
    }
    return actions;
  }
}
