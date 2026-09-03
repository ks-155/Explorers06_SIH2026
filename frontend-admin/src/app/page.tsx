'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth } from '@/lib/auth';
import { redirectPathForRole } from '@/lib/rbac';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const a = loadAuth();
    if (a?.role) {
      router.replace(redirectPathForRole(a.role as never));
    }
  }, [router]);
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">SOIS Admin (Member 2) — Frontend :3002</h1>
      <p className="text-sm text-gray-600 mt-2">Modules M4 Employer Portal + M5 Outcome Analytics. See /login.</p>
      <ul className="list-disc ml-6 mt-4 text-sm">
        <li><a href="/login" className="text-teal-700 underline">Login (gov / employer)</a></li>
        <li><a href="/dashboard" className="text-teal-700 underline">Gov dashboard (RBAC: government/admin)</a></li>
        <li><a href="/employer/me" className="text-teal-700 underline">Employer dashboard</a></li>
        <li><a href="/health" className="text-teal-700 underline">Health → proxy to :3001</a></li>
      </ul>
      <p className="text-xs text-gray-400 mt-6">Next 14 · proxy /api/v1 → ${`{NEXT_PUBLIC_API_URL}`}/api/v1 · API-CONTRACT.md v1.0.0</p>
    </main>
  );
}
