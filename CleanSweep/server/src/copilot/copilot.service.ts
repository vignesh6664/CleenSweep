import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { CopilotToolsService } from './copilot-tools.service';
import { CopilotChatDto, CopilotChatResponse, PendingAction } from './copilot.types';

interface TenantQuota {
  requestTimestamps: number[];
  tokensToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private genAI: GoogleGenAI | null = null;
  private readonly geminiModel: string;

  // Rate Limiting & Token Cap state: userId -> TenantQuota
  private readonly tenantQuotas = new Map<string, TenantQuota>();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly DAILY_TOKEN_CAP = 25000;

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: CopilotToolsService,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    this.geminiModel =
      this.configService.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';

    if (apiKey) {
      try {
        this.genAI = new GoogleGenAI({ apiKey });
        this.logger.log(`Initialized Gemini client with model ${this.geminiModel}`);
      } catch (err) {
        this.logger.error(`Failed to initialize GoogleGenAI: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Live LLM calls will fall back to smart local tool resolution.',
      );
    }
  }

  // -------------------------------------------------------------
  // Per-tenant Rate Limiting & Token Cap Enforcement
  // -------------------------------------------------------------
  private checkAndEnforceTenantQuota(userId: string): TenantQuota {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    let quota = this.tenantQuotas.get(userId);
    if (!quota) {
      quota = { requestTimestamps: [], tokensToday: 0, lastResetDate: todayStr };
      this.tenantQuotas.set(userId, quota);
    }

    // Reset daily tokens if new day
    if (quota.lastResetDate !== todayStr) {
      quota.tokensToday = 0;
      quota.lastResetDate = todayStr;
      quota.requestTimestamps = [];
    }

    // Slide window: filter out requests older than 60 seconds
    quota.requestTimestamps = quota.requestTimestamps.filter((t) => now - t < 60000);

    if (quota.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new HttpException(
        `Tenant rate limit exceeded: Max ${this.MAX_REQUESTS_PER_MINUTE} requests per minute. Please try again shortly.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (quota.tokensToday >= this.DAILY_TOKEN_CAP) {
      throw new HttpException(
        `Daily token cap reached for your tenant (${this.DAILY_TOKEN_CAP} tokens/day). Resets at midnight UTC.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Record this request
    quota.requestTimestamps.push(now);
    return quota;
  }

  // -------------------------------------------------------------
  // Tool Declarations for Gemini
  // -------------------------------------------------------------
  private getToolDeclarations(): FunctionDeclaration[] {
    return [
      {
        name: 'getSavingsSummary',
        description: 'Get total monthly AWS waste, grouped by region or resource type.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            accountId: {
              type: Type.STRING,
              description: 'Optional AWS account ID to filter by.',
            },
            groupBy: {
              type: Type.STRING,
              enum: ['region', 'type'],
              description: 'Group savings breakdown by "region" or "type".',
            },
          },
        },
      },
      {
        name: 'listZombieVolumes',
        description: 'List orphaned/unattached EBS volumes costing money.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            accountId: { type: Type.STRING, description: 'Optional AWS account ID' },
            region: { type: Type.STRING, description: 'Optional AWS region (e.g. us-east-1)' },
            minSizeGb: { type: Type.NUMBER, description: 'Minimum volume size in GB' },
          },
        },
      },
      {
        name: 'listIdleInstances',
        description: 'List running EC2 instances with low CPU utilization over the past 7 days.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            accountId: { type: Type.STRING, description: 'Optional AWS account ID' },
            region: { type: Type.STRING, description: 'Optional AWS region (e.g. us-east-1)' },
            maxCpuPercent: {
              type: Type.NUMBER,
              description: 'Maximum average CPU utilization threshold percentage (default 5)',
            },
          },
        },
      },
      {
        name: 'checkResourceTags',
        description:
          'Inspect resource tags. Automatically blocks any resource tagged production or protected.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            resourceId: {
              type: Type.STRING,
              description: 'The AWS resource ID (e.g., vol-12345 or i-0abcdef)',
            },
            region: { type: Type.STRING, description: 'The AWS region of the resource' },
            accountId: { type: Type.STRING, description: 'The CleanSweep account ID' },
          },
          required: ['resourceId', 'region', 'accountId'],
        },
      },
      {
        name: 'proposeAction',
        description:
          'Proposes a safe cleanup action (DELETE_EBS or STOP_EC2). Checks tags first; stages a pending proposal. Nothing executes until the user explicitly confirms.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            actionType: {
              type: Type.STRING,
              enum: ['DELETE_EBS', 'STOP_EC2'],
              description: 'The remediation action type',
            },
            resourceId: { type: Type.STRING, description: 'AWS Resource ID' },
            region: { type: Type.STRING, description: 'AWS Region' },
            accountId: { type: Type.STRING, description: 'CleanSweep Account ID' },
            estimatedMonthlySavings: {
              type: Type.NUMBER,
              description: 'Estimated monthly dollar savings',
            },
            reason: { type: Type.STRING, description: 'Clear explanation for why this is proposed' },
          },
          required: ['actionType', 'resourceId', 'region', 'accountId', 'reason'],
        },
      },
    ];
  }

  // -------------------------------------------------------------
  // Main Chat Processing
  // -------------------------------------------------------------
  async processChat(userId: string, dto: CopilotChatDto): Promise<CopilotChatResponse> {
    const quota = this.checkAndEnforceTenantQuota(userId);
    const { message, accountId } = dto;
    const stagedActions: PendingAction[] = [];

    // Fallback if no Gemini API Key is configured
    if (!this.genAI) {
      return this.handleLocalFallback(userId, message, accountId);
    }

    const systemInstruction = `
You are CleanSweep Copilot, an enterprise FinOps assistant that identifies AWS cloud waste and proposes safe cleanups.
You strictly adhere to these rules:
1. ONLY answer using facts obtained from your available tools: getSavingsSummary, listZombieVolumes, listIdleInstances, checkResourceTags, proposeAction.
2. If the user's request cannot be answered by the tools, or is outside the scope of AWS cloud waste / FinOps (e.g., questions about weather, code writing, generic jokes, non-AWS queries), you MUST explicitly reply: "I don't know based on your AWS data." Never guess or fabricate answers.
3. Before proposing any action using proposeAction, you must verify the resource is safe. checkResourceTags will block anything tagged 'production' or 'protected'. If blocked, DO NOT propose the action and explain the protection reason.
4. When calling proposeAction, inform the user that the action is staged safely as a proposal and will NOT execute until they click "Confirm" in the UI.
5. Keep your explanations concise, professional, and explicitly cite estimated monthly dollar amounts ($/month).
`;

    const functionDeclarations = this.getToolDeclarations();

    try {
      let contents: any[] = [{ role: 'user', parts: [{ text: message }] }];
      let finalReply = '';
      let totalTokensUsed = 0;

      // Tool-calling loop (max 5 iterations)
      for (let step = 0; step < 5; step++) {
        const response = await this.genAI.models.generateContent({
          model: this.geminiModel,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations }],
            temperature: 0.2,
          },
        });

        // Record token usage
        const tokens = response.usageMetadata?.totalTokenCount || 200;
        totalTokensUsed += tokens;
        quota.tokensToday += tokens;

        const candidate = response.candidates?.[0];
        const content = candidate?.content;
        const functionCalls = content?.parts?.filter((p: any) => p.functionCall);

        if (!functionCalls || functionCalls.length === 0) {
          // Model returned text response
          finalReply =
            content?.parts?.map((p: any) => p.text || '').join('').trim() ||
            "I don't know based on your AWS data.";
          break;
        }

        // Add model's tool calls to contents history
        contents.push(content);

        // Execute function calls
        const toolResponseParts: any[] = [];
        for (const callPart of functionCalls) {
          const call = (callPart as any).functionCall;
          if (!call || !call.name) continue;

          const fnName = String(call.name);
          const args = (call.args || {}) as Record<string, any>;
          let toolResult: any;

          this.logger.log(`[Copilot] Executing tool: ${fnName} with args: ${JSON.stringify(args)}`);

          switch (fnName) {
            case 'getSavingsSummary':
              toolResult = await this.toolsService.getSavingsSummary(userId, {
                accountId: (args.accountId as string) || accountId,
                groupBy: args.groupBy as 'region' | 'type' | undefined,
              });
              break;

            case 'listZombieVolumes':
              toolResult = await this.toolsService.listZombieVolumes(userId, {
                accountId: (args.accountId as string) || accountId,
                region: args.region as string | undefined,
                minSizeGb: typeof args.minSizeGb === 'number' ? args.minSizeGb : undefined,
              });
              break;

            case 'listIdleInstances':
              toolResult = await this.toolsService.listIdleInstances(userId, {
                accountId: (args.accountId as string) || accountId,
                region: args.region as string | undefined,
                maxCpuPercent: typeof args.maxCpuPercent === 'number' ? args.maxCpuPercent : undefined,
              });
              break;

            case 'checkResourceTags':
              toolResult = await this.toolsService.checkResourceTags(userId, {
                resourceId: String(args.resourceId || ''),
                region: String(args.region || ''),
                accountId: String((args.accountId as string) || accountId || ''),
              });
              break;

            case 'proposeAction':
              toolResult = await this.toolsService.proposeAction(userId, {
                actionType: args.actionType as 'DELETE_EBS' | 'STOP_EC2',
                resourceId: String(args.resourceId || ''),
                region: String(args.region || ''),
                accountId: String((args.accountId as string) || accountId || ''),
                estimatedMonthlySavings: typeof args.estimatedMonthlySavings === 'number' ? args.estimatedMonthlySavings : 0,
                reason: String(args.reason || ''),
              });
              if (toolResult.proposed && toolResult.action) {
                stagedActions.push(toolResult.action);
              }
              break;

            default:
              toolResult = { error: `Unknown tool: ${fnName}` };
          }

          toolResponseParts.push({
            functionResponse: {
              name: fnName,
              response: { output: toolResult },
            },
          });
        }

        // Append tool responses
        contents.push({ role: 'tool', parts: toolResponseParts });
      }

      return {
        reply: finalReply || "I don't know based on your AWS data.",
        proposedActions: stagedActions,
        tokenUsage: {
          totalTokens: totalTokensUsed,
          dailyUsed: quota.tokensToday,
          dailyCap: this.DAILY_TOKEN_CAP,
        },
      };
    } catch (error) {
      this.logger.error(`Error in Copilot LLM loop: ${error.message}`);
      // Fallback gracefully if API quota or key fails
      return this.handleLocalFallback(userId, message, accountId);
    }
  }

  // -------------------------------------------------------------
  // Smart local tool resolution when Gemini key is not provided
  // -------------------------------------------------------------
  private async handleLocalFallback(
    userId: string,
    message: string,
    accountId?: string,
  ): Promise<CopilotChatResponse> {
    const lower = message.toLowerCase();
    const stagedActions: PendingAction[] = [];

    // 1. Savings Summary
    if (lower.includes('saving') || lower.includes('waste') || lower.includes('summary') || lower.includes('total')) {
      const summary = await this.toolsService.getSavingsSummary(userId, { accountId, groupBy: 'type' });
      return {
        reply: `Here is your current AWS waste summary:\n\n• **Total Potential Monthly Savings:** $${summary.totalMonthlyWaste}/mo across ${summary.accountsScanned} account(s).\n• **Orphaned EBS Volumes:** $${summary.allGroupings?.byType?.EBS || 0}/mo\n• **Idle EC2 Instances:** $${summary.allGroupings?.byType?.EC2 || 0}/mo\n\n*(Note: Add GEMINI_API_KEY to server/.env for natural conversational processing).*`,
        proposedActions: [],
      };
    }

    // 2. Zombie Volumes
    if (lower.includes('volume') || lower.includes('ebs') || lower.includes('zombie') || lower.includes('orphaned')) {
      const volumes = await this.toolsService.listZombieVolumes(userId, { accountId });
      let text = `Found **${volumes.totalFound} orphaned EBS volumes** costing **$${volumes.totalMonthlyCost}/month** in unattached storage.`;
      
      if (volumes.volumes.length > 0) {
        text += `\n\nTop items:`;
        for (const v of volumes.volumes.slice(0, 3)) {
          text += `\n• \`${v.resourceId}\` (${v.sizeGb} GB in ${v.region}) — $${v.monthlyCost}/mo`;
        }
      }
      return { reply: text, proposedActions: [] };
    }

    // 3. Idle Instances
    if (lower.includes('instance') || lower.includes('ec2') || lower.includes('idle')) {
      const instances = await this.toolsService.listIdleInstances(userId, { accountId });
      let text = `Found **${instances.totalFound} idle EC2 instances** costing **$${instances.totalMonthlyCost}/month** (CPU < 5%).`;
      
      if (instances.instances.length > 0) {
        text += `\n\nItems:`;
        for (const inst of instances.instances.slice(0, 3)) {
          text += `\n• \`${inst.instanceId}\` (${inst.instanceType} in ${inst.region}, CPU: ${inst.avgCpuUtilization}%) — $${inst.monthlyCost}/mo`;
        }
      }
      return { reply: text, proposedActions: [] };
    }

    // Default "I don't know" rule enforcement
    return {
      reply: "I don't know based on your AWS data. You can ask me: 'What is my total monthly waste?', 'List orphaned EBS volumes', or 'Are there any idle EC2 instances?'.",
      proposedActions: stagedActions,
    };
  }
}
