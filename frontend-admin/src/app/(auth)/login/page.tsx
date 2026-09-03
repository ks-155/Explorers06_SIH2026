'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { redirectPathForRole } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type Tab = 'government' | 'employer';

function Loader2({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('government');
  const [identifier, setIdentifier] = useState(tab === 'government' ? 'gov@mh.gov.in' : 'employer@org.in');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    setIdentifier(t === 'government' ? 'gov@mh.gov.in' : 'employer@org.in');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ identifier: identifier.trim(), password });
      saveAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, role: res.role, userId: res.userId });
      router.push(redirectPathForRole(res.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-page-enter">
      <Card className="w-full max-w-md transition-all duration-300 hover:shadow-lg border-slate-200">
        <CardHeader>
          <h1 className="text-xl font-semibold">SOIS Admin — Login</h1>
          <p className="text-sm text-gray-500">Government / Employer portal · :3002</p>
          {/* Active tab slider via Tailwind transition-all */}
          <div className="relative flex gap-0 mt-3 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <div
              className="absolute top-1 bottom-1 bg-teal-700 rounded-md shadow-sm transition-all duration-300 ease-out"
              style={{
                left: tab === 'government' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
                transform: tab === 'government' ? 'translateX(0)' : 'translateX(-4px)',
              }}
            />
            <button
              type="button"
              onClick={() => switchTab('government')}
              className={`relative z-10 flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${tab === 'government' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Government
            </button>
            <button
              type="button"
              onClick={() => switchTab('employer')}
              className={`relative z-10 flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${tab === 'employer' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Employer
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm">Identifier (email / phone)</label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="gov@mh.gov.in" required />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-red-600 animate-page-enter">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 transition-all duration-200">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4" /> Signing in…
                </>
              ) : (
                `Sign in as ${tab}`
              )}
            </Button>
            <p className="text-xs text-gray-400">API: POST /api/v1/auth/login via proxy → :3001 (API-CONTRACT.md v1.0.0). JWT 15m/7d.</p>
          </form>
          <div className="mt-4 text-xs text-gray-500 border-t pt-3">
            <p>Dev seeds (if seeded): gov@mh.gov.in / gov123456, employer@org.in / emp123456</p>
            <a href="/health" className="underline hover:text-slate-900 transition-colors">
              Health check
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
