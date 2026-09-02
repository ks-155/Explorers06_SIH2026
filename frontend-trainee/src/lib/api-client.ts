const API_PREFIX = "/api/v1";

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

// --- Generic request wrapper ---
interface ApiEnvelope<T> {
  data: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_PREFIX}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error?.message ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  const body = (await res.json()) as ApiEnvelope<T>;
  return body.data;
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