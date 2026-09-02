"use client";

import { api, clearSession, setSession } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginPayload {
  identifier: string;
  password: string;
}

export function useLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => api.auth.login(payload),
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        role: data.role,
        userId: data.userId,
      });
      // Trainee lands on dashboard; other roles fall through to role-scoped route.
      const target =
        data.role === "trainee" && data.userId
          ? `/dashboard/${data.userId}`
          : "/";
      router.push(target);
    },
    onError: (err: Error) => setError(err.message),
  });

  return { login: mutation.mutate, isPending: mutation.isPending, error };
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearSession();
    router.push("/login");
  };
}