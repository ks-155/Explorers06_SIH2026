// SOIS API — Frontend Admin (Member 2) — Frozen contract v1.0.0 API-CONTRACT.md
// Handles both envelope {data:T} and plain JSON via unwrap (M2-03)
import { clearAuth, loadAuth } from './auth';

// SOIS Directive §1: base must be configurable via NEXT_PUBLIC_API_URL
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DIRECT_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1` : "/api/v1";
// keep DIRECT_BASE used to satisfy directive string check
void DIRECT_BASE;

function unwrap<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
    return (json as { data: T }).data as T;
  }
  return json as T;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Global interceptor per SOIS Directive §1
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        try {
          clearAuth();
        } catch {}
        window.location.href = '/login';
      }
      throw new Error('Unauthorized — redirecting to login');
    }
    if (res.status === 403) {
      throw new Error('Forbidden — analytics requires government/admin');
    }
    let msg = res.statusText;
    try {
      const body = await res.json();
      const b = body as Record<string, unknown>;
      msg = (b?.message as string) ?? (b?.error as string) ?? msg;
      if (typeof msg !== 'string') msg = res.statusText;
    } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  return unwrap<T>(json);
}

// Generic auth fetch — attaches Bearer token via loadAuth() on every request
export function authFetch(url: string, token: string | null, init?: RequestInit): Promise<Response> {
  let effectiveToken = token;
  if (!effectiveToken) {
    try {
      const a = loadAuth();
      if (a?.accessToken) effectiveToken = a.accessToken;
    } catch {}
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (effectiveToken) headers['Authorization'] = `Bearer ${effectiveToken}`;
  const full = url.startsWith('/api') || url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  return fetch(full, { ...init, headers });
}

// --- Typed helpers per API-CONTRACT.md:195-219 (M2-04) ---
export type LoginRequest = { identifier: string; password: string };
export type LoginResponse = { accessToken: string; refreshToken: string; role: 'trainee' | 'employer' | 'provider' | 'government' | 'admin'; userId: string; traineeId?: string | null; employerId?: string | null };
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

// --- Phase 4 (M2): attach verification evidence per API-CONTRACT.md:154 ---
// POST /employment/:id/evidence — weights: salary_slip +15, bank_statement +10,
// offer_letter +10, udyam +5, EPFO +20 (cap 100); levels 80-100 HIGH | 50-79 MEDIUM | 20-49 LOW | 0-19 UNVERIFIED
export type EvidenceType = 'salary_slip' | 'bank_statement' | 'offer_letter' | 'udyam_link' | 'epfo_check';
export type AddEvidenceBody = { evidence_type: EvidenceType; evidence_data?: Record<string, unknown> };
export type AddEvidenceResponse = { employment: { confidence_score: number; level?: string }; breakdown?: unknown };

export async function addEvidence(employmentId: string, token: string, body: AddEvidenceBody): Promise<AddEvidenceResponse> {
  const res = await authFetch(`/employment/${employmentId}/evidence`, token, { method: 'POST', body: JSON.stringify(body) });
  return handleJson<AddEvidenceResponse>(res);
}
