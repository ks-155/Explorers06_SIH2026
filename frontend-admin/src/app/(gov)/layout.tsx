'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadAuth, clearAuth } from '@/lib/auth';
import { canViewAnalytics } from '@/lib/rbac';

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/ranking', label: 'Provider Ranking' },
  { href: '/dashboard/district/pune', label: 'District' },
  { href: '/dashboard/skill-gaps', label: 'Skill Gaps' },
];

export default function GovLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const a = loadAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setRole(a.role);
    if (!canViewAnalytics(a.role)) {
      // RBAC: block employer/trainee from aggregate analytics per API-CONTRACT.md 8
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return <p className="p-8 text-sm text-gray-500">Checking gov access…</p>;

  return (
    <div className="max-w-6xl mx-auto flex gap-4 p-4">
      <aside className="w-48 shrink-0">
        <div className="border rounded bg-white">
          <div className="p-3 border-b text-xs text-gray-500">Gov Portal · {role}</div>
          <nav className="flex flex-col">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 text-sm hover:bg-gray-50 ${pathname === n.href ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t"
          >
            Sign out
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Phase 3 gov-ov: RBAC live, mocks until Phase 5 live analytics</p>
      </aside>
      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}
