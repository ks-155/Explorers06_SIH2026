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

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('government');
  const [identifier, setIdentifier] = useState(tab === 'government' ? 'gov@mh.gov.in' : 'employer@org.in');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keep default identifier in sync when tab changes
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
      // critical security check: role must match tab expectation? allow both but redirect by actual role
      saveAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, role: res.role, userId: res.userId });
      // also store in localStorage for health page etc.
      router.push(redirectPathForRole(res.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">SOIS Admin — Login</h1>
          <p className="text-sm text-gray-500">Government / Employer portal · :3002</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => switchTab('government')}
              className={`flex-1 py-2 rounded text-sm font-medium ${tab === 'government' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}
            >
              Government
            </button>
            <button
              onClick={() => switchTab('employer')}
              className={`flex-1 py-2 rounded text-sm font-medium ${tab === 'employer' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : `Sign in as ${tab}`}
            </Button>
            <p className="text-xs text-gray-400">
              API: POST /api/v1/auth/login via proxy → :3001 (API-CONTRACT.md v1.0.0). JWT 15m/7d.
            </p>
          </form>
          <div className="mt-4 text-xs text-gray-500 border-t pt-3">
            <p>Dev seeds (if seeded): gov@mh.gov.in / gov123456, employer@org.in / emp123456</p>
            <a href="/health" className="underline">
              Health check
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
