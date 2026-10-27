import { demoStore } from './demoStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper function to get the access token from Kinde
let getAccessToken: (() => Promise<string>) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// User & Billing API
export async function fetchMe() {
  if (demoStore.isDemoMode()) {
    return {
      id: 'demo-user',
      email: 'demo@cleansweep.io',
      name: 'Demo FinOps Engineer',
      subscriptionTier: 'PRO',
      createdAt: new Date().toISOString(),
    };
  }

  const response = await fetchWithAuth(`${API_BASE}/api/me`);
  if (!response.ok) throw new Error('Failed to fetch user info');
  return response.json();
}

export async function upgradeToPro() {
  if (demoStore.isDemoMode()) {
    return { success: true, message: 'Already PRO in demo mode' };
  }

  const response = await fetchWithAuth(`${API_BASE}/api/upgrade`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to upgrade to PRO');
  return response.json();
}

export async function fetchAuditLogs() {
  if (demoStore.isDemoMode()) {
    return demoStore.getAuditLogs();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/audit-logs`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}

// Scanner API
export async function fetchScanResults(accountId: string) {
  if (demoStore.isDemoMode()) {
    return demoStore.getScanResults();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch scan results');
  return response.json();
}

export async function fetchAccounts() {
  if (demoStore.isDemoMode()) {
    return demoStore.getAccounts();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/accounts`);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export interface CreateAccountData {
  accountName: string;
  provider: string;
  accessKey?: string;
  secretKey?: string;
  roleArn?: string;
  externalId?: string;
  region: string;
}

export async function createAccount(data: CreateAccountData) {
  const response = await fetchWithAuth(`${API_BASE}/api/accounts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }
  
  return response.json();
}

export async function triggerScan(accountId: string) {
  if (demoStore.isDemoMode()) {
    return demoStore.getScanResults();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to trigger scan');
  return response.json();
}

export async function deleteVolume(accountId: string, region: string, volumeId: string) {
  if (demoStore.isDemoMode()) {
    demoStore.deleteVolume(volumeId);
    return { success: true, message: `Volume ${volumeId} deleted successfully` };
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scanner/ebs/${accountId}/${region}/${volumeId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete volume');
  }
  
  return response.json();
}

export async function getIdleInstances(accountId: string) {
  if (demoStore.isDemoMode()) {
    return demoStore.getIdleInstances();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scanner/idle-instances/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch idle instances');
  return response.json();
}

// Scheduler API functions
export async function listInstances(accountId: string, region: string) {
  if (demoStore.isDemoMode()) {
    return [
      {
        instanceId: 'i-0a91fbc7d9',
        instanceType: 'm5.xlarge',
        state: 'running',
        availabilityZone: 'us-east-1a',
        tags: { Name: 'staging-batch-worker', Environment: 'staging' },
      },
      {
        instanceId: 'i-03d89ac124',
        instanceType: 't3.large',
        state: 'running',
        availabilityZone: 'eu-west-1a',
        tags: { Name: 'dev-analytics-node', Environment: 'dev' },
      },
    ];
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/instances/${accountId}/${region}`);
  if (!response.ok) throw new Error('Failed to fetch instances');
  return response.json();
}

export async function listSchedules(accountId: string) {
  if (demoStore.isDemoMode()) {
    return [
      {
        id: 'sched-1',
        instanceId: 'i-0a91fbc7d9',
        accountId: 'acc-demo-2',
        region: 'us-east-1',
        stopTime: '19:00',
        startTime: '08:00',
        timezone: 'America/New_York',
        isEnabled: true,
      },
    ];
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/schedules/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch schedules');
  return response.json();
}

export async function createSchedule(data: {
  instanceId: string;
  accountId: string;
  region: string;
  stopTime: string;
  startTime: string;
  timezone: string;
}) {
  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/schedules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create schedule');
  }
  
  return response.json();
}

export async function updateSchedule(id: string, data: {
  stopTime?: string;
  startTime?: string;
  timezone?: string;
  isEnabled?: boolean;
}) {
  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update schedule');
  }
  
  return response.json();
}

export async function deleteSchedule(id: string) {
  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/schedules/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete schedule');
  }
  
  return response.json();
}

export async function stopInstance(accountId: string, region: string, instanceId: string) {
  if (demoStore.isDemoMode()) {
    demoStore.stopInstance(instanceId);
    return { success: true, message: `Instance ${instanceId} stopped successfully` };
  }

  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/stop-instance/${accountId}/${region}/${instanceId}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to stop instance');
  }
  
  return response.json();
}

// Copilot AI API
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

export interface CopilotChatResponse {
  reply: string;
  proposedActions: PendingAction[];
  tokenUsage?: {
    totalTokens: number;
    dailyUsed: number;
    dailyCap: number;
  };
}

export async function sendCopilotChat(message: string, accountId?: string): Promise<CopilotChatResponse> {
  if (demoStore.isDemoMode()) {
    // Artificial 400ms delay to feel natural
    await new Promise((r) => setTimeout(r, 400));
    return demoStore.evaluateCopilotChat(message);
  }

  const response = await fetchWithAuth(`${API_BASE}/api/copilot/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, accountId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get response from CleanSweep Copilot');
  }

  return response.json();
}

export async function fetchCopilotPendingActions(): Promise<PendingAction[]> {
  if (demoStore.isDemoMode()) {
    return demoStore.getPendingActions();
  }

  const response = await fetchWithAuth(`${API_BASE}/api/copilot/actions`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function confirmCopilotAction(actionId: string) {
  if (demoStore.isDemoMode()) {
    return demoStore.confirmAction(actionId);
  }

  const response = await fetchWithAuth(`${API_BASE}/api/copilot/actions/${actionId}/confirm`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to confirm action');
  }

  return response.json();
}

export async function dismissCopilotAction(actionId: string) {
  if (demoStore.isDemoMode()) {
    demoStore.dismissAction(actionId);
    return { success: true, message: 'Action proposal dismissed' };
  }

  const response = await fetchWithAuth(`${API_BASE}/api/copilot/actions/${actionId}/dismiss`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to dismiss action');
  }

  return response.json();
}
