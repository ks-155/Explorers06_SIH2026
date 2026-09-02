import { http, HttpResponse } from "msw";

// Handlers mirror the FROZEN API contract v1.0.0 (API-CONTRACT.md).
// Prefix is /api/v1, matching the Next proxy rewrite destination.
// Trainee role never touches /analytics/* (server-scoped to admin/government).

const API = "/api/v1";

const MOCK_TRAINEE_ID = "9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f";

const mockProfile = {
  id: MOCK_TRAINEE_ID,
  name: "Rahul Sharma",
  phone: "9876543210",
  district_id: 27,
  consent_given: true,
  consent_version: "1.0",
  preferred_language: "hi",
  preferred_channel: "whatsapp",
  identity_status: "canonical",
  merge_confidence: null,
  created_at: "2026-09-02T00:00:00Z",
};

const mockTraining = [
  {
    id: "tr-001",
    trainee_id: MOCK_TRAINEE_ID,
    provider_id: "prov-001",
    course_id: "course-001",
    sector: "Renewable Energy",
    job_role: "Solar Technician",
    nsqf_level: 4,
    enrollment_date: "2025-06-01",
    completion_date: "2025-08-15",
    certification_id: "CERT-2025-001",
    certification_date: "2025-08-20",
    status: "completed",
    source_system: "sidh",
  },
];

const mockEmployment = [
  {
    id: "emp-001",
    trainee_id: MOCK_TRAINEE_ID,
    training_id: "tr-001",
    employer_id: "employer-001",
    job_role: "Solar Technician",
    employment_type: "full_time",
    joining_date: "2025-09-01",
    current_salary: 18000,
    salary_currency: "INR",
    job_relevant_to_training: true,
    verification_status: "employer_confirmed",
    confidence_score: 87.0,
    level: "HIGH",
    verification_date: "2025-09-10",
  },
];

const mockMergeCandidates = [
  {
    id: "match-001",
    name: "Rahul Kumar",
    phone: "9123456789",
    district_id: 27,
    match_type: "soft",
    confidence: 75,
    matched_fields: ["name", "district_id"],
  },
];

const mockPendingFollowUps = [
  {
    id: "fu-001",
    trainee_id: MOCK_TRAINEE_ID,
    follow_up_date: "2025-09-20",
    months_after_training: 1,
    channel: "whatsapp",
    status: "scheduled",
    questions: [
      { id: "working", text: "Are you currently working?", type: "yes_no" },
      { id: "same_employer", text: "Still at the same employer?", type: "yes_no" },
      { id: "job_relevance", text: "Is your job relevant to your training?", type: "yes_no" },
    ],
  },
];

export const handlers = [
  // POST /api/v1/auth/login (public)
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { identifier?: string };
    if (!body.identifier) {
      return HttpResponse.json(
        { statusCode: 400, message: "identifier is required", error: "Bad Request" },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      data: {
        accessToken: "mock-access-token-xxx",
        refreshToken: "mock-refresh-token-xxx",
        role: "trainee",
        userId: MOCK_TRAINEE_ID,
      },
    });
  }),

  // POST /api/v1/trainees (public/provider)
  http.post(`${API}/trainees`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { data: { id: MOCK_TRAINEE_ID, ...body, created_at: new Date().toISOString() } },
      { status: 201 }
    );
  }),

  // GET & PUT /api/v1/trainees/:id
  http.get(`${API}/trainees/:id`, () => HttpResponse.json({ data: mockProfile })),
  http.put(`${API}/trainees/:id/consent`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { success: true, consent: body } });
  }),

  http.get(`${API}/trainees/:id/training`, () =>
    HttpResponse.json({ data: mockTraining })
  ),
  http.get(`${API}/trainees/:id/employment`, () =>
    HttpResponse.json({ data: mockEmployment })
  ),
  http.put(`${API}/trainees/:id/contact-update`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { success: true, updated: body } });
  }),
  http.get(`${API}/trainees/:id/merge-candidates`, () =>
    HttpResponse.json({ data: mockMergeCandidates })
  ),

  // POST /api/v1/identity-matches/:id/confirm (owner/admin)
  http.post(`${API}/identity-matches/:id/confirm`, () =>
    HttpResponse.json({ data: { success: true, message: "Merge confirmed" } })
  ),

  // Follow-ups (trainee, self)
  http.get(`${API}/follow-ups/pending`, () =>
    HttpResponse.json({ data: mockPendingFollowUps })
  ),
  http.post(`${API}/follow-ups/:id/respond`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      data: { success: true, response: body, responded_at: new Date().toISOString() },
    });
  }),
];