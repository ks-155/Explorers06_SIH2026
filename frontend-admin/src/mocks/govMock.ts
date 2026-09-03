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
  { id: 'p4', name: 'Nashik Vocational', placement: 90, retention: 82, district: 'Nashik' },
  { id: 'p5', name: 'Aurangabad Skills', placement: 55, retention: 48, district: 'Aurangabad' },
  { id: 'p6', name: 'Kolhapur Center', placement: 77, retention: 70, district: 'Kolhapur' },
  { id: 'p7', name: 'Amravati ITI', placement: 62, retention: 58, district: 'Amravati' },
  { id: 'p8', name: 'Solapur Polytechnic', placement: 48, retention: 42, district: 'Solapur' },
  { id: 'p9', name: 'Jalgaon Skill Hub', placement: 81, retention: 74, district: 'Jalgaon' },
  { id: 'p10', name: 'Satara Training', placement: 69, retention: 63, district: 'Satara' },
  { id: 'p11', name: 'Sangli Vocational', placement: 74, retention: 67, district: 'Sangli' },
  { id: 'p12', name: 'Latur Skills', placement: 53, retention: 45, district: 'Latur' },
];

export const mockSkillGaps = [
  { skill: 'Electrical troubleshooting', gap_type: 'employer_feedback', recommendation: 'Add 8h hands-on' },
  { skill: 'Solar panel wiring', gap_type: 'retention_analysis', recommendation: 'Add field internship' },
];
