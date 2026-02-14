const API_BASE = 'http://localhost:3000';

export async function fetchScanResults(accountId: string) {
  const response = await fetch(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to fetch scan results');
  return response.json();
}

export async function fetchAccounts() {
  const response = await fetch(`${API_BASE}/api/accounts`);
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
  const response = await fetch(`${API_BASE}/api/accounts`, {
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
  const response = await fetch(`${API_BASE}/api/scanner/run/${accountId}`);
  if (!response.ok) throw new Error('Failed to trigger scan');
  return response.json();
}

export async function deleteVolume(accountId: string, region: string, volumeId: string) {
  const response = await fetch(`${API_BASE}/api/scanner/ebs/${accountId}/${region}/${volumeId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete volume');
  }
  
  return response.json();
}
