'use client';
import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HealthPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getHealth()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="font-medium">Health — GET /api/v1/health (proxy → :3001)</CardHeader>
        <CardContent>
          {err && <p className="text-sm text-red-600">{err} — backend not running or proxy misconfigured (next.config.mjs).</p>}
          {data && <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>}
          {!data && !err && <p className="text-sm text-gray-500">Loading…</p>}
        </CardContent>
      </Card>
    </main>
  );
}
