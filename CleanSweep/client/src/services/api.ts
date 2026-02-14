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
