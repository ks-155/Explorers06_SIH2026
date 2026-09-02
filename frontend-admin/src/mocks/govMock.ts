// Mock for Phase 3 — shape matches GET /analytics/dashboard + analytics_snapshots.metrics JSONB
// Will be replaced by live TanStack Query in Phase 5

export const mockGovDashboard = {
  trained: 100000,
  certified: 82000,
  verified_employed: 51000,
  unemployed: 9000,
  unreachable: 10000,
  retention: { '3m': 78, '6m': 69, '12m': 61, '24m': 54 },
  wage_progression: { start: 12000, m6: 14500, m12: 17000 },
  topSectors: [
    { sector: 'Solar', employed: 4200 },
    { sector: 'Construction', employed: 3800 },
    { sector: 'IT', employed: 3100 },
  ],
};

export const mockProviderRanking = [
  { id: 'p1', name: 'Pune Skill Center', placement: 85, retention: 78, district: 'Pune' },
  { id: 'p2', name: 'Mumbai ITI', placement: 72, retention: 65, district: 'Mumbai' },
  { id: 'p3', name: 'Nagpur Polytechnic', placement: 68, retention: 61, district: 'Nagpur' },
];

export const mockSkillGaps = [
  { skill: 'Electrical troubleshooting', gap_type: 'employer_feedback', recommendation: 'Add 8h hands-on' },
  { skill: 'Solar panel wiring', gap_type: 'retention_analysis', recommendation: 'Add field internship' },
];
