export interface DemoVolume {
  id: string;
  resourceId: string;
  resourceType: string;
  sizeGb: number;
  region: string;
  monthlyCost: number;
  tags: Record<string, string>;
  createdAt: string;
}

export interface DemoInstance {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  region: string;
  avgCpuUtilization: number;
  monthlyCost: number;
  tags: Record<string, string>;
}

export interface DemoAuditLog {
  id: string;
  action: string;
  resourceId: string;
  accountId: string;
  userId: string;
  details: any;
  createdAt: string;
  account?: { accountName: string };
}

// Initial default demo state
const INITIAL_VOLUMES: DemoVolume[] = [
  {
    id: 'vol-demo-1',
    resourceId: 'vol-08f32ade45',
    resourceType: 'EBS',
    sizeGb: 100,
    region: 'us-east-1',
    monthlyCost: 10.0,
    tags: { Environment: 'staging', Team: 'Backend', Project: 'API-Gateway' },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'vol-demo-2',
    resourceId: 'vol-019bb48c12',
    resourceType: 'EBS',
    sizeGb: 250,
    region: 'us-west-2',
    monthlyCost: 25.0,
    tags: { Environment: 'dev', CreatedBy: 'ci-runner', Automated: 'true' },
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    id: 'vol-demo-3',
    resourceId: 'vol-0c5a119ef0',
    resourceType: 'EBS',
    sizeGb: 490,
    region: 'eu-west-1',
    monthlyCost: 49.0,
    tags: { Environment: 'qa', Project: 'Legacy-Worker' },
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'vol-demo-4',
    resourceId: 'vol-0994fbc1a0',
    resourceType: 'EBS',
    sizeGb: 500,
    region: 'us-east-1',
    monthlyCost: 50.0,
    tags: { Environment: 'production', Protected: 'true', Tier: 'Primary-DB-Snapshot' },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const INITIAL_INSTANCES: DemoInstance[] = [
  {
    instanceId: 'i-0a91fbc7d9',
    instanceName: 'staging-batch-worker',
    instanceType: 'm5.xlarge',
    region: 'us-east-1',
    avgCpuUtilization: 1.4,
    monthlyCost: 140.0,
    tags: { Environment: 'staging', Role: 'Batch' },
  },
  {
    instanceId: 'i-03d89ac124',
    instanceName: 'dev-analytics-node',
    instanceType: 't3.large',
    region: 'eu-west-1',
    avgCpuUtilization: 2.1,
    monthlyCost: 60.0,
    tags: { Environment: 'dev', Owner: 'DataTeam' },
  },
  {
    instanceId: 'i-0771cc45e1',
    instanceName: 'prod-api-server',
    instanceType: 'c5.2xlarge',
    region: 'us-east-1',
    avgCpuUtilization: 3.2,
    monthlyCost: 248.0,
    tags: { Environment: 'production', Protected: 'true' },
  },
];

const INITIAL_LOGS: DemoAuditLog[] = [
  {
    id: 'log-1',
    action: 'START_INSTANCE',
    resourceId: 'i-0a91fbc7d9',
    accountId: 'acc-demo-2',
    userId: 'demo-user',
    details: { actor: 'user', reason: 'Scheduled run' },
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    account: { accountName: 'AWS Staging / Dev' },
  },
];

class DemoStore {
  private volumes: DemoVolume[] = [];
  private instances: DemoInstance[] = [];
  private auditLogs: DemoAuditLog[] = [];
  private pendingActions = new Map<string, any>();

  constructor() {
    this.reset();
  }

  reset() {
    this.volumes = JSON.parse(JSON.stringify(INITIAL_VOLUMES));
    this.instances = JSON.parse(JSON.stringify(INITIAL_INSTANCES));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_LOGS));
    this.pendingActions.clear();
  }

  isDemoMode(): boolean {
    // Default to true so user immediately explores demo without needing auth credentials
    const val = localStorage.getItem('cleansweep_demo_mode');
    return val !== 'false';
  }

  enterDemoMode() {
    localStorage.setItem('cleansweep_demo_mode', 'true');
    this.reset();
  }

  exitDemoMode() {
    localStorage.setItem('cleansweep_demo_mode', 'false');
    this.reset();
  }

  getAccounts() {
    return [
      {
        id: 'acc-demo-1',
        accountName: 'AWS Production (112233445566)',
        region: 'us-east-1',
        roleArn: 'arn:aws:iam::112233445566:role/CleanSweepCrossAccountRole',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'acc-demo-2',
        accountName: 'AWS Staging / Dev (998877665544)',
        region: 'us-west-2',
        roleArn: 'arn:aws:iam::998877665544:role/CleanSweepCrossAccountRole',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  getScanResults() {
    const totalSavings = Math.round(
      this.volumes.reduce((sum, v) => sum + v.monthlyCost, 0) * 100
    ) / 100;
    return {
      totalSavings,
      resourcesFound: this.volumes.length,
      results: this.volumes,
    };
  }

  getIdleInstances() {
    const totalMonthlyCost = Math.round(
      this.instances.reduce((sum, i) => sum + i.monthlyCost, 0) * 100
    ) / 100;
    return {
      resourcesFound: this.instances.length,
      totalMonthlyCost,
      instances: this.instances,
    };
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  deleteVolume(volumeId: string) {
    const vol = this.volumes.find((v) => v.resourceId === volumeId);
    this.volumes = this.volumes.filter((v) => v.resourceId !== volumeId);

    if (vol) {
      this.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: 'DELETE_EBS_VOLUME',
        resourceId: volumeId,
        accountId: 'acc-demo-2',
        userId: 'demo-user',
        details: { actor: 'user', region: vol.region },
        createdAt: new Date().toISOString(),
        account: { accountName: 'AWS Staging / Dev' },
      });
    }
  }

  stopInstance(instanceId: string) {
    const inst = this.instances.find((i) => i.instanceId === instanceId);
    this.instances = this.instances.filter((i) => i.instanceId !== instanceId);

    if (inst) {
      this.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: 'STOP_INSTANCE',
        resourceId: instanceId,
        accountId: 'acc-demo-2',
        userId: 'demo-user',
        details: { actor: 'user', region: inst.region },
        createdAt: new Date().toISOString(),
        account: { accountName: 'AWS Staging / Dev' },
      });
    }
  }

  // --- COPILOT AGENT DEMO EVALUATION ---

  evaluateCopilotChat(message: string): { reply: string; proposedActions: any[] } {
    const lower = message.toLowerCase();

    // 1. Savings Summary
    if (
      lower.includes('waste') ||
      lower.includes('saving') ||
      lower.includes('summary') ||
      lower.includes('total') ||
      lower.includes('burn')
    ) {
      const volWaste = this.volumes.reduce((s, v) => s + v.monthlyCost, 0);
      const ec2Waste = this.instances.reduce((s, i) => s + i.monthlyCost, 0);
      const total = Math.round((volWaste + ec2Waste) * 100) / 100;

      return {
        reply: `📊 **AWS Waste Summary (Live Demo Sandbox)**:\n\n• **Total Potential Monthly Savings:** **$${total}/mo** across 2 connected accounts.\n• **Orphaned EBS Volumes:** **$${volWaste}/mo** (${this.volumes.length} unattached disks)\n• **Idle EC2 Instances:** **$${ec2Waste}/mo** (${this.instances.length} low-CPU instances)\n\n*Top opportunity: You have ${this.volumes.filter(v => v.tags?.Environment !== 'production').length} unattached non-production volumes eligible for immediate deletion.*`,
        proposedActions: [],
      };
    }

    // 2. Propose Cleanup / Clean
    if (
      lower.includes('propose') ||
      lower.includes('clean') ||
      lower.includes('delete') ||
      lower.includes('remediate') ||
      lower.includes('fix')
    ) {
      // Find a safe volume (NOT production)
      const safeVolume = this.volumes.find((v) => {
        const env = String(v.tags?.Environment || '').toLowerCase();
        return env !== 'production' && !v.tags?.Protected;
      });

      if (!safeVolume) {
        return {
          reply: `🛡️ **Tag Safety Guard Active:** All remaining orphaned volumes are tagged \`Environment: production\` or \`Protected: true\`. CleanSweep Copilot is blocked from proposing changes to protected resources.`,
          proposedActions: [],
        };
      }

      const actionId = `action_demo_${Date.now()}`;
      const proposed = {
        id: actionId,
        userId: 'demo-user',
        accountId: 'acc-demo-2',
        actionType: 'DELETE_EBS',
        resourceId: safeVolume.resourceId,
        region: safeVolume.region,
        estimatedMonthlySavings: safeVolume.monthlyCost,
        reason: `Unattached EBS volume (${safeVolume.sizeGb} GB in ${safeVolume.region}) tagged Environment: ${safeVolume.tags.Environment}. Verified non-production.`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
        status: 'PENDING',
      };

      this.pendingActions.set(actionId, proposed);

      return {
        reply: `🧹 I verified your tags and found safe waste in your staging environment:\n\n• Volume \`${safeVolume.resourceId}\` is **safe** (tagged \`Environment: ${safeVolume.tags.Environment}\`).\n• Note: Volume \`vol-0994fbc1a0\` was **blocked** because it is tagged \`Environment: production\`.\n\nI have staged a proposal below. **Nothing has been deleted yet—please review and click Confirm to execute.**`,
        proposedActions: [proposed],
      };
    }

    // 3. List Orphaned EBS Volumes
    if (lower.includes('volume') || lower.includes('ebs') || lower.includes('zombie') || lower.includes('orphaned')) {
      let text = `📦 Found **${this.volumes.length} unattached EBS volumes**:\n`;
      for (const v of this.volumes) {
        const isProd = v.tags?.Environment === 'production';
        text += `\n• \`${v.resourceId}\` (${v.sizeGb} GB in ${v.region}) — **$${v.monthlyCost}/mo** [Env: ${v.tags?.Environment || 'N/A'}] ${isProd ? '🛡️ *(Protected)*' : '✅ *(Eligible)*'}`;
      }
      text += `\n\nWould you like me to propose a safe cleanup for the eligible volumes?`;
      return { reply: text, proposedActions: [] };
    }

    // 4. List Idle EC2 Instances
    if (lower.includes('instance') || lower.includes('ec2') || lower.includes('idle') || lower.includes('cpu')) {
      let text = `⚡ Found **${this.instances.length} idle EC2 instances** (avg CPU < 5%):\n`;
      for (const inst of this.instances) {
        const isProd = inst.tags?.Environment === 'production';
        text += `\n• \`${inst.instanceId}\` (*${inst.instanceName}*, ${inst.instanceType} in ${inst.region}, CPU: **${inst.avgCpuUtilization}%**) — **$${inst.monthlyCost}/mo** ${isProd ? '🛡️ *(Protected)*' : '✅ *(Eligible to Stop)*'}`;
      }
      return { reply: text, proposedActions: [] };
    }

    // 5. Default "I don't know" rule enforcement
    return {
      reply: "I don't know based on your AWS data. You can ask me:\n• 'What is my total monthly waste?'\n• 'List orphaned EBS volumes'\n• 'Are there any idle EC2 instances?'\n• 'Propose safe cleanups for unattached volumes'",
      proposedActions: [],
    };
  }

  confirmAction(actionId: string) {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      throw new Error('Action proposal not found or expired.');
    }

    if (action.actionType === 'DELETE_EBS') {
      this.volumes = this.volumes.filter((v) => v.resourceId !== action.resourceId);
    } else if (action.actionType === 'STOP_EC2') {
      this.instances = this.instances.filter((i) => i.instanceId !== action.resourceId);
    }

    // Record to Audit Log with actor: 'agent', approved_by: 'demo@cleansweep.io'
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: action.actionType,
      resourceId: action.resourceId,
      accountId: action.accountId,
      userId: 'demo-user',
      details: {
        actor: 'agent',
        approved_by: 'demo@cleansweep.io',
        actionId: action.id,
        estimatedMonthlySavings: action.estimatedMonthlySavings,
        reason: action.reason,
      },
      createdAt: new Date().toISOString(),
      account: { accountName: 'AWS Staging / Dev' },
    });

    action.status = 'EXECUTED';
    this.pendingActions.delete(actionId);

    return {
      success: true,
      message: `Successfully executed ${action.actionType} for ${action.resourceId}. Saved $${action.estimatedMonthlySavings}/month. Recorded in audit log (actor: agent).`,
      action,
    };
  }

  dismissAction(actionId: string) {
    this.pendingActions.delete(actionId);
  }

  getPendingActions() {
    return Array.from(this.pendingActions.values());
  }
}

export const demoStore = new DemoStore();
