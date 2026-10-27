export interface PendingAction {
  id: string;
  userId: string;
  accountId: string;
  actionType: 'DELETE_EBS' | 'STOP_EC2';
  resourceId: string;
  region: string;
  estimatedMonthlySavings: number;
  reason: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'EXECUTED' | 'DISMISSED';
}

export class CopilotChatDto {
  message!: string;
  accountId?: string;
}

export interface CopilotChatResponse {
  reply: string;
  proposedActions: PendingAction[];
  tokenUsage?: {
    totalTokens: number;
    dailyUsed: number;
    dailyCap: number;
  };
}

export interface TagCheckResult {
  blocked: boolean;
  reason: string;
  tags?: Record<string, string>;
}
