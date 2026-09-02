// Auth helpers — Phase 1: store JWT + role from POST /api/v1/auth/login
// Contract: API-CONTRACT.md  POST /api/v1/auth/login -> {accessToken, refreshToken, role, userId}
// Must hide aggregate analytics from employer/trainee — see rbac.ts

export type Role = 'trainee' | 'employer' | 'provider' | 'government' | 'admin';

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  role: Role;
  userId: string;
};

const KEY = 'sois_admin_auth';

export function saveAuth(a: StoredAuth) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(a));
}

export function loadAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.role as Role) || null;
  } catch {
    return null;
  }
}
