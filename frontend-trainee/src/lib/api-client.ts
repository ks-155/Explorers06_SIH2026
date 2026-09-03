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
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = "Bearer ";

  const res = await fetch(${API_PREFIX}, { ...options, headers });

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
      return request<Record<string, unknown>>(/trainees/);
    },
    updateConsent(id: string, payload: Record<string, unknown>) {
      return request(/trainees//consent, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    getTraining(id: string) {
      return request<unknown[]>(/trainees//training);
    },
    getEmployment(id: string) {
      return request<unknown[]>(/trainees//employment);
    },
    updateContact(id: string, payload: Record<string, unknown>) {
      return request(/trainees//contact-update, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    getMergeCandidates(id: string) {
      return request<unknown[]>(/trainees//merge-candidates);
    },
  },
  identity: {
    confirmMerge(matchId: string) {
      return request(/identity-matches//confirm, {
        method: "POST",
      });
    },
    rejectMerge(matchId: string) {
      return request(/identity-matches//reject, {
        method: "POST",
      });
    },
  },
  followUps: {
    getPending() {
      return request<unknown[]>(/follow-ups/pending);
    },
    respond(id: string, payload: Record<string, unknown>) {
      return request(/follow-ups//respond, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
};
