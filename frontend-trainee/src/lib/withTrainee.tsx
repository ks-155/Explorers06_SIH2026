"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/api-client";

// Trainee role guard mirroring frontend-admin's withRole pattern.
// Redirects to /login when unauthenticated or when the session role is
// not "trainee" (trainee app never renders gov/admin views).
export function WithTrainee({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s || !s.accessToken) {
      router.replace("/login");
      return;
    }
    if (s.role !== "trainee") {
      router.replace("/login");
      return;
    }
    setOk(true);
  }, [router]);

  if (ok === null)
    return <p className="p-8 text-sm text-gray-500">Checking access…</p>;
  if (ok === false)
    return <p className="p-8 text-sm text-red-600">403 — Forbidden for your role</p>;
  return <>{children}</>;
}