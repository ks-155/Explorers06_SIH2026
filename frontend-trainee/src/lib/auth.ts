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
        traineeId: (data as { traineeId?: string | null }).traineeId ?? null,
        employerId: (data as { employerId?: string | null }).employerId ?? null,
      });
      // Fix: use traineeId for trainee role, not userId (user.id = d46b..., trainee.id = c24d...)
      const traineeId = (data as { traineeId?: string | null }).traineeId;
      const target =
        data.role === "trainee" && traineeId
          ? `/training/${traineeId}`
          : data.role === "trainee" && data.userId
            ? `/training/${data.userId}`
            : data.role === "trainee"
              ? "/training"
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