// SOIS API — Frontend Admin (Member 2) — Phase 1
// Base is /api/v1 via proxy rewrite to http://localhost:3001/api/v1 (next.config.mjs)
// Frozen contract: API-CONTRACT.md v1.0.0

const BASE = '/api/v1';

export type LoginRequest = { identifier: string; password: string };
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: 'trainee' | 'employer' | 'provider' | 'government' | 'admin';
  userId: string;
};

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(err.message || `Login failed (${res.status})`);
  }
  return res.json();
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${BASE}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// Generic auth fetch — attaches Bearer token from localStorage
export function authFetch(url: string, token: string | null, init?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url.startsWith('/api') ? url : `${BASE}${url}`, { ...init, headers });
}
