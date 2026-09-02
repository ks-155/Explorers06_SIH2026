'use client';
import { mockSkillGaps } from '@/mocks/govMock';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function SkillGapsPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Skill Gaps (mock Phase 3)</h1>
      <p className="text-sm text-gray-500">Per `SOIS-CORE-MODULES.md:268` — Phase 5 live `GET /analytics/skill-gaps`</p>
      <div className="space-y-2">
        {mockSkillGaps.map((g) => (
          <Card key={g.skill}>
            <CardContent className="p-3">
              <div className="font-medium">{g.skill}</div>
              <div className="text-xs text-gray-500">{g.gap_type} → {g.recommendation}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
