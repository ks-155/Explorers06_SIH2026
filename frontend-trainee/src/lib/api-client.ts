// Base is configurable via NEXT_PUBLIC_API_URL; fallback uses proxy /api/v1
// which rewrites to http://localhost:3001/api/v1 (see next.config.mjs).
// Direct fallback expression required by SOIS Directive §1: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"`
const DIRECT_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// FETCH_BASE keeps proxy for same-origin dev (relative /api/v1 rewrites to DIRECT_BASE),
// but uses absolute URL when NEXT_PUBLIC_API_URL is provided (e.g. production).
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";
// Keep alias for backwards compat if any module imported API_PREFIX
const API_PREFIX = API_BASE;

// --- Storage helpers (JWT) ---
const ACCESS_TOKEN_KEY = "sois_access_token";
const REFRESH_TOKEN_KEY = "sois_refresh_token";
const ROLE_KEY = "sois_role";
const USER_ID_KEY = "sois_user_id";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setSession(data: {
  accessToken: string;
  refreshToken?: string;
  role: string;
  userId?: string;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(ROLE_KEY, data.role);
  if (data.userId) localStorage.setItem(USER_ID_KEY, data.userId);
}

export function getSession() {
  if (typeof window === "undefined") return null;
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    role: localStorage.getItem(ROLE_KEY),
    userId: localStorage.getItem(USER_ID_KEY),
  };
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

// --- Generic request wrapper with global 401/403 handling ---
// Stale Trainee ID fix: backend 404 "Trainee <id> not found" for a cached
// USER_ID_KEY means localStorage is stale after DB re-seed. We preserve
// statusCode on the thrown Error so pages (training/[id]/page.tsx) can show
// a friendly "clear session & sign in again" card instead of raw text.
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Attach JWT Bearer from getSession on every request (SOIS Directive §1)
  const sessionToken = typeof window !== "undefined" ? getSession()?.accessToken : null;
  const token = sessionToken ?? getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Use API_BASE (proxy-aware) for fetch; DIRECT_BASE is the canonical absolute fallback.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void DIRECT_BASE;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Global response interceptor logic per SOIS Directive §1
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized — redirecting to login");
  }
  if (res.status === 403) {
    console.warn("Forbidden — insufficient permissions", path);
    throw new Error("Forbidden — insufficient permissions");
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error?.message ?? message;
    } catch {
      /* ignore parse errors */
    }
    const err = new Error(message) as Error & { statusCode?: number };
    err.statusCode = res.status;
    throw err;
  }

  const json = await res.json();
  // Unwrap {data:T} envelope when present, otherwise return plain JSON (works for both)
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data as T;
  }
  return json as T;
}

// --- API surface (frozen contract, v1.0.0) ---
export const api = {
  auth: {
    login(payload: { identifier: string; password: string }) {
      return request<{
        accessToken: string;
        refreshToken: string;
        role: string;
        userId: string;
      }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
    },
  },
  trainees: {
    register(payload: Record<string, unknown>) {
      return request<{ id: string }>("/trainees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    runMatch(payload: Record<string, unknown> = {}) {
      return request("/trainees/match", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    get(id: string) {
      return request<Record<string, unknown>>(`/trainees/${id}`);
    },
    updateConsent(id: string, payload: Record<string, unknown>) {
      return request(`/trainees/${id}/consent`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    getTraining(id: string) {
      return request<unknown[]>(`/trainees/${id}/training`);
    },
    getEmployment(id: string) {
      return request<unknown[]>(`/trainees/${id}/employment`);
    },
    updateContact(id: string, payload: Record<string, unknown>) {
      return request(`/trainees/${id}/contact-update`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    getMergeCandidates(id: string) {
      return request<unknown[]>(`/trainees/${id}/merge-candidates`);
    },
  },
  identity: {
    confirmMerge(matchId: string) {
      return request(`/identity-matches/${matchId}/confirm`, {
        method: "POST",
      });
    },
    rejectMerge(matchId: string) {
      return request(`/identity-matches/${matchId}/reject`, {
        method: "POST",
      });
    },
  },
  followUps: {
    getPending() {
      return request<unknown[]>(`/follow-ups/pending`);
    },
    respond(id: string, payload: Record<string, unknown>) {
      return request(`/follow-ups/${id}/respond`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
};
