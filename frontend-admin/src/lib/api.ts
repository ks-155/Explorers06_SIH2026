// SOIS API — Frontend Admin (Member 2) — Frozen contract v1.0.0 API-CONTRACT.md
// Handles both envelope {data:T} and plain JSON via unwrap (M2-03)

const BASE = '/api/v1';

function unwrap<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
    return (json as { data: T }).data as T;
  }
  return json as T;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = (body as Record<string, unknown>)?.message as string ?? (body as Record<string, unknown>)?.error as string ?? msg;
    } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  return unwrap<T>(json);
}

// Generic auth fetch — attaches Bearer token
export function authFetch(url: string, token: string | null, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const full = url.startsWith('/api') ? url : `${BASE}${url}`;
  return fetch(full, { ...init, headers });
}

// --- Typed helpers per API-CONTRACT.md:195-219 (M2-04) ---
export type LoginRequest = { identifier: string; password: string };
export type LoginResponse = { accessToken: string; refreshToken: string; role: 'trainee' | 'employer' | 'provider' | 'government' | 'admin'; userId: string };
export type VerifyEmploymentReq = { employment_id: string; decision: 'confirm' | 'deny'; still_employed: boolean; job_relevant: boolean };
export type PendingItem = { employment_id: string; trainee_name: string; job_role: string; training_job_role?: string; confidence_score?: number; joining_date?: string };
export type AnalyticsDashboard = { trained: number; certified: number; verified_employed: number; unemployed: number; unreachable: number; retention: Record<string, number>; wage_progression: Record<string, number> };
export type ProviderRank = { id: string; name: string; placement: number; retention: number; district: string };
export type SkillGap = { skill_name?: string; skill?: string; gap_type: string; recommendation: string; gap_description?: string };

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
  return handleJson<LoginResponse>(res);
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${BASE}/health`, { cache: 'no-store' });
  return handleJson(res);
}

export async function getVerifyPending(employerId: string, token: string): Promise<PendingItem[]> {
  const res = await authFetch(`/employers/${employerId}/verify-pending`, token);
  return handleJson<PendingItem[]>(res);
}

export async function postVerifyEmployment(employerId: string, token: string, body: VerifyEmploymentReq): Promise<unknown> {
  const res = await authFetch(`/employers/${employerId}/verify-employment`, token, { method: 'POST', body: JSON.stringify(body) });
  return handleJson(res);
}

export async function getAnalyticsDashboard(token: string): Promise<AnalyticsDashboard> {
  const res = await authFetch('/analytics/dashboard', token);
  return handleJson(res);
}

export async function getProviderRanking(token: string): Promise<ProviderRank[]> {
  const res = await authFetch('/analytics/provider-ranking', token);
  return handleJson(res);
}

export async function getDistrictAnalytics(districtId: string, token: string): Promise<unknown> {
  const res = await authFetch(`/analytics/district/${districtId}`, token);
  return handleJson(res);
}

export async function getCourseAnalytics(courseId: string, token: string): Promise<unknown> {
  const res = await authFetch(`/analytics/course/${courseId}`, token);
  return handleJson(res);
}

export async function getSkillGaps(token: string): Promise<SkillGap[]> {
  const res = await authFetch('/analytics/skill-gaps', token);
  return handleJson(res);
}
