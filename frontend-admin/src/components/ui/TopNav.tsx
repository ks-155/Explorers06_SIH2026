'use client';
import { useEffect, useState } from 'react';
import { loadAuth } from '@/lib/auth';
import { canViewAnalytics } from '@/lib/rbac';

export function TopNav() {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const a = loadAuth();
    setRole(a?.role ?? null);
    setReady(true);
  }, []);

  const showGov = ready ? (role ? canViewAnalytics(role as never) : false) : true;
  // During SSR/hydration, showGov true to avoid flicker, but after ready we hide if not gov/admin

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4 text-sm items-center">
        <a href="/login" className="font-bold text-slate-900 tracking-tight">
          SOIS Admin
        </a>
        <a href="/login" className="text-slate-600 hover:text-slate-900 hover:underline">
          Login
        </a>
        {showGov ? (
          <a href="/dashboard" className="text-slate-600 hover:text-slate-900 hover:underline">
            Gov Dashboard
          </a>
        ) : null}
        <a href="/employer/me" className="text-slate-600 hover:text-slate-900 hover:underline">
          Employer
        </a>
        <a href="/health" className="text-slate-600 hover:text-slate-900 hover:underline">
          Health
        </a>
        {ready && role && (
          <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">role: {role} {showGov ? '' : '· analytics hidden'}</span>
        )}
      </div>
    </nav>
  );
}
