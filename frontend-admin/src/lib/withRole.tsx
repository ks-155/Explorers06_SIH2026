'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth } from '@/lib/auth';
import type { Role } from '@/lib/auth';

export function withRole(allowed: Role[], Fallback?: React.ComponentType) {
  return function Guard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ok, setOk] = useState<boolean | null>(null);
    useEffect(() => {
      const a = loadAuth();
      if (!a) {
        router.replace('/login');
        return;
      }
      if (!allowed.includes(a.role)) {
        setOk(false);
        router.replace('/login');
        return;
      }
      setOk(true);
    }, [router]);
    if (ok === null) return <p className="p-8 text-sm text-gray-500">Checking access…</p>;
    if (ok === false) return Fallback ? <Fallback /> : <p className="p-8 text-sm text-red-600">403 — Forbidden for your role</p>;
    return <>{children}</>;
  };
}
