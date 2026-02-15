const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper function to get the access token from Kinde
// This will be called by the Kinde SDK when needed
let getAccessToken: (() => Promise<string>) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add authorization header if we have an access token getter
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

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    console.error('Unauthorized - please log in');
    // The Kinde SDK will handle redirecting to login
  }

  return response;
}

export async function fetchScanResults(accountId: string) {
  const response = await fetchWithAuth(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch scan results');
  return response.json();
}

export async function fetchAccounts() {
  const response = await fetchWithAuth(`${API_BASE}/api/accounts`);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export interface CreateAccountData {
  accountName: string;
  provider: string;
  accessKey: string;
  secretKey: string;
  region: string;
}

export async function createAccount(data: CreateAccountData) {
  const response = await fetchWithAuth(`${API_BASE}/api/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }
  
  return response.json();
}

export async function triggerScan(accountId: string) {
  const response = await fetchWithAuth(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to trigger scan');
  return response.json();
}

export async function deleteVolume(accountId: string, region: string, volumeId: string) {
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
  const response = await fetchWithAuth(`${API_BASE}/api/scanner/idle-instances/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch idle instances');
  return response.json();
}

// Scheduler API functions
export async function listInstances(accountId: string, region: string) {
  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/instances/${accountId}/${region}`);
  if (!response.ok) throw new Error('Failed to fetch instances');
  return response.json();
}

export async function listSchedules(accountId: string) {
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetchWithAuth(`${API_BASE}/api/scheduler/stop-instance/${accountId}/${region}/${instanceId}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to stop instance');
  }
  
  return response.json();
}
