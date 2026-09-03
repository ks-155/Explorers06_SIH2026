'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { mockSkillGaps } from '@/mocks/govMock';
import { getSkillGaps } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function SkillGapsPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { const a = loadAuth(); if (a) setToken(a.accessToken); }, []);
  const { data, error } = useQuery({ queryKey: ['skill-gaps-page'], queryFn: () => getSkillGaps(token!), enabled: !!token, staleTime: 30_000, retry: 1 });
  const gaps = (data as unknown as typeof mockSkillGaps) ?? mockSkillGaps;
  const isLive = !error && data !== undefined;
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Skill Gaps {isLive ? <span className="text-green-700 text-sm">Live</span> : <span className="text-amber-600 text-sm">Mock fallback</span>}</h1>
      <p className="text-sm text-gray-500">Per SOIS-CORE-MODULES.md:268 — GET /analytics/skill-gaps</p>
      <div className="space-y-2">
        {(gaps as unknown[]).map((g: unknown, i: number) => {
          const gg = g as Record<string, unknown>;
          const skill = (gg.skill_name ?? gg.skill) as string;
          return (
            <Card key={String(skill ?? i)}>
              <CardContent className="p-3">
                <div className="font-medium">{skill ?? 'Gap'}</div>
                <div className="text-xs text-gray-500">{gg.gap_type as string} → {gg.recommendation as string}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
