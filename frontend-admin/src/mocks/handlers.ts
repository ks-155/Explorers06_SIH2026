import { http, HttpResponse } from 'msw';
import { mockPending } from './employerMock';
import { mockGovDashboard, mockProviderRanking, mockSkillGaps } from './govMock';

const API = '/api/v1';

export const handlers = [
  http.get(`${API}/employers/:id/verify-pending`, () => HttpResponse.json({ data: mockPending })),
  http.post(`${API}/employers/:id/verify-employment`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { success: true, verified: body, confidence_score: 60 } });
  }),
  http.get(`${API}/analytics/dashboard`, () => HttpResponse.json({ data: mockGovDashboard })),
  http.get(`${API}/analytics/provider-ranking`, () => HttpResponse.json({ data: mockProviderRanking })),
  http.get(`${API}/analytics/district/:id`, () => HttpResponse.json({ data: { topSectors: mockGovDashboard.topSectors } })),
  http.get(`${API}/analytics/course/:id`, () => HttpResponse.json({ data: { id: 'course-1', retention: mockGovDashboard.retention, wage_progression: mockGovDashboard.wage_progression } })),
  http.get(`${API}/analytics/skill-gaps`, () => HttpResponse.json({ data: mockSkillGaps })),
];
