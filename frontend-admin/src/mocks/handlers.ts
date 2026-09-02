// Mocks for local dev until backend merged / running — Phase 1
// Not used when proxy to :3001 succeeds; kept for reference and tests
export const mockLogin = {
  government: { accessToken: 'mock.gov.jwt', refreshToken: 'mock.refresh', role: 'government' as const, userId: 'gov-1' },
  employer: { accessToken: 'mock.emp.jwt', refreshToken: 'mock.refresh', role: 'employer' as const, userId: 'emp-1' },
};
export const mockDashboard = {
  trained: 100000,
  certified: 82000,
  verified_employed: 51000,
  unemployed: 9000,
  unreachable: 10000,
  retention: { '3m': 78, '6m': 69, '12m': 61, '24m': 54 },
  wage_progression: { start: 12000, m6: 14500, m12: 17000 },
};
