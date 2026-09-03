'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadAuth, clearAuth } from '@/lib/auth';
import { canViewAnalytics } from '@/lib/rbac';
import { Skeleton } from '@/components/ui/skeleton';

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/ranking', label: 'Providers' },
  { href: '/dashboard/course', label: 'Courses' },
  { href: '/dashboard/district/pune', label: 'Districts' },
  { href: '/dashboard/skill-gaps', label: 'Skill Gaps' },
];

export default function GovLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const a = loadAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setRole(a.role);
    const ok = canViewAnalytics(a.role as never);
    setAuthorized(ok);
    setChecked(true);
    // Do not auto-redirect for unauthorized — show fallback per SOIS UI Directive
  }, [router]);

  if (!checked) return <div className="p-8 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const canView = authorized === true;
  // Hide analytics nav links if not government/admin per directive
  const visibleNav = canView ? nav : [];

  if (authorized === false) {
    return (
      <div className="max-w-6xl mx-auto flex gap-4 p-4">
        <aside className="w-48 shrink-0">
          <div className="border rounded-lg bg-white shadow-sm border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 text-xs text-slate-500 bg-slate-50">Gov Portal · {role}</div>
            <div className="p-3 text-xs text-slate-500">Analytics hidden — insufficient role</div>
            <button
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-t border-slate-200"
            >
              Sign out
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">RBAC: government/admin only</p>
        </aside>
        <section className="flex-1 min-w-0">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Unauthorized — Analytics restricted</h2>
            <p className="text-sm text-slate-600 mt-1">Your role <span className="font-mono font-semibold text-slate-900">{role}</span> cannot view aggregate analytics. Only <span className="font-semibold">government</span> or <span className="font-semibold">admin</span> roles can access Gov Dashboard, Provider Ranking, District and Skill Gaps.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => router.push('/login')} className="min-h-[36px] px-4 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800">
                Go to Login
              </button>
              <button onClick={() => router.push('/employer/me')} className="min-h-[36px] px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50">
                Employer portal
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-3">Fallback per SOIS UI Directive — analytics nav links hidden for non-government roles.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex gap-4 p-4">
      <aside className="w-48 shrink-0">
        <div className="border rounded-lg bg-white shadow-sm border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 text-xs text-slate-500 bg-slate-50">Gov Portal · {role}</div>
          <nav className="flex flex-col">
            {visibleNav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 text-sm hover:bg-slate-50 border-l-2 ${pathname === n.href ? 'bg-slate-900 text-white border-slate-900 font-medium' : 'text-slate-700 border-transparent hover:border-slate-200'}`}
              >
                {n.label}
              </Link>
            ))}
            {visibleNav.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">No analytics access</div>}
          </nav>
          <button
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-t border-slate-200"
          >
            Sign out
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Maharashtra outcome intelligence · live PostgreSQL data</p>
      </aside>
      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}
