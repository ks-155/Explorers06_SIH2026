# SOIS — FROZEN API CONTRACT (Phase 1)

**Version:** 1.0.0 (FROZEN — Phase 1, Week 1)
**Owner:** Member 5 (Database + API)
**Scope:** All modules (M1–M6). Frontend/backend members build against this contract.
**Base URL:** `http://localhost:3001` — every route is prefixed **`/api/v1`**

> This contract is **frozen in Phase 1**. Any change requires a version bump + team notice (Member 5 signs off). Build your mocks against these exact shapes.

---

## 0. AUTHENTICATION & RBAC

**Roles:** `trainee | employer | provider | government | admin`

| Guard | Behaviour |
|-------|-----------|
| `protect` (default) | Requires valid JWT `Authorization: Bearer <token>` on all routes **except** public ones |
| `authorize(...roles)` | Restricts a route to listed roles only |
| Public routes | `/api/v1/auth/login`, `/api/v1/health`, `/api/v1` (root) |

**JWT:**
- Access token: **15 min**
- Refresh token: **7 days**
- Payload: `{ sub: userId, role, traineeId?, employerId? }`

**Route scoping (privacy-critical):**

| Route group | Allowed roles |
|-------------|---------------|
| `/api/v1/trainees/:id/*` | That trainee only (ownership) |
| `/api/v1/employers/*` | Employer of that org |
| `/api/v1/analytics/*` (aggregate) | `admin`, `government` ONLY |
| `/api/v1/follow-ups/*` | Trainee (self) |
| `/api/v1/training-records` | `provider`, `admin` |

> **Rule:** aggregate analytics are **never** exposed to trainees/employers. Enforced server-side.

### Standard error format
```json
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
```

---

## 1. AUTH (Module — all members)

### `POST /api/v1/auth/login` (public)
**Request:**
```json
{ "identifier": "gov@mh.gov.in", "password": "gov123456" }
```
**Response 200:**
```json
{ "accessToken": "<jwt>", "refreshToken": "<jwt>", "role": "government", "userId": "<uuid>" }
```

---

## 2. HEALTH / SYSTEM

### `GET /api/v1/health` (public)
**Response 200:**
```json
{ "status": "ok", "uptime": 12.3, "timestamp": "2026-09-02T00:00:00Z", "database": "up" }
```

### `GET /api/v1` (public)
Root banner (service name).

---

## 3. TRAINEES — M1 (Member 4 backend / Member 1 frontend)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| POST | `/api/v1/trainees` | Register trainee (consent captured) | public/provider |
| GET | `/api/v1/trainees/:id` | Get profile | owner |
| PUT | `/api/v1/trainees/:id/consent` | Update versioned consent | owner |
| GET | `/api/v1/trainees/:id/training` | Get training records | owner |
| GET | `/api/v1/trainees/:id/employment` | Get employment records | owner |
| POST | `/api/v1/trainees/match` | Run identity matching | admin/provider |
| GET | `/api/v1/trainees/:id/merge-candidates` | Probable duplicates | owner |
| PUT | `/api/v1/trainees/:id/contact-update` | Update phone/location, re-link | owner |

**`POST /trainees` request:**
```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "district_id": 27,
  "consent_given": true,
  "consent_version": "1.0",
  "preferred_language": "hi",
  "preferred_channel": "whatsapp"
}
```

**`GET /trainees/:id` response:**
```json
{
  "id": "<uuid>",
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "district_id": 27,
  "consent_given": true,
  "consent_version": "1.0",
  "preferred_language": "hi",
  "preferred_channel": "whatsapp",
  "identity_status": "canonical",
  "merge_confidence": null,
  "created_at": "2026-09-02T00:00:00Z"
}
```

---

## 4. IDENTITY MATCHES — M1 (Member 4 backend)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| POST | `/api/v1/identity-matches/:id/confirm` | Confirm a merge | owner/admin |
| POST | `/api/v1/identity-matches/:id/reject` | Reject a false positive | owner/admin |

---

## 5. FOLLOW-UPS — M2 (Member 4 backend / Member 1 frontend)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| POST | `/api/v1/follow-ups/schedule` | Schedule a follow-up | admin/provider |
| POST | `/api/v1/follow-ups/:id/respond` | Submit response | trainee |
| GET | `/api/v1/follow-ups/pending` | Pending for a trainee | trainee |
| GET | `/api/v1/follow-ups/unreachable` | Unreachable list | provider/admin |

**`POST /follow-ups/:id/respond` request:**
```json
{
  "responses": { "working": "yes", "same_employer": true },
  "non_placement_reason": null,
  "response_time_seconds": 45
}
```

---

## 6. EMPLOYMENT — M3 (Member 3 backend / Member 1+2 frontend)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| POST | `/api/v1/employment` | Create employment record | trainee/provider |
| GET | `/api/v1/employment/:id` | Get details + confidence | owner |
| POST | `/api/v1/employment/:id/verify` | Trigger verification | admin/provider |
| POST | `/api/v1/employment/:id/evidence` | Add verification evidence | trainee/admin |

**`POST /employment` request:**
```json
{
  "trainee_id": "<uuid>",
  "training_id": "<uuid>",
  "employer_id": "<uuid>",
  "job_role": "Solar Technician",
  "employment_type": "full_time",
  "joining_date": "2026-06-01",
  "current_salary": 18000,
  "salary_currency": "INR",
  "job_relevant_to_training": true
}
```

**`GET /employment/:id` response (includes confidence):**
```json
{
  "id": "<uuid>",
  "trainee_id": "<uuid>",
  "employment_type": "full_time",
  "current_salary": 18000,
  "verification_status": "employer_confirmed",
  "confidence_score": 87.0,
  "level": "HIGH",
  "job_relevant_to_training": true
}
```

**Confidence score weights (frozen):**
```
20 self-report + 40 employer confirmed
+ 15 salary slip + 10 bank statement + 10 offer letter + 5 udyam
+ 20 EPFO; cap 100
Levels: 80-100 HIGH | 50-79 MEDIUM | 20-49 LOW | 0-19 UNVERIFIED
```

---

## 7. EMPLOYERS — M4 (Member 3 backend / Member 2 frontend)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| POST | `/api/v1/employers` | Register employer | employer/admin |
| GET | `/api/v1/employers/:id` | Get employer | employer |
| GET | `/api/v1/employers/:id/verify-pending` | Pending verifications | employer |
| POST | `/api/v1/employers/:id/verify-employment` | Confirm/deny claim | employer |

**`POST /employers/:id/verify-employment` request:**
```json
{ "employment_id": "<uuid>", "decision": "confirm", "still_employed": true, "job_relevant": true }
```

---

## 8. ANALYTICS — M5 (Member 4 backend / Member 2 frontend) — **GOV/ADMIN ONLY**

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| GET | `/api/v1/analytics/dashboard` | Overview KPIs | admin, government |
| GET | `/api/v1/analytics/provider-ranking` | Provider rankings | admin, government |
| GET | `/api/v1/analytics/district/:id` | District analytics | admin, government |
| GET | `/api/v1/analytics/course/:id` | Course analytics | admin, government |
| GET | `/api/v1/analytics/skill-gaps` | Skill gaps + recommendations | admin, government |

**`GET /analytics/dashboard` response:**
```json
{
  "trained": 100000,
  "certified": 82000,
  "verified_employed": 51000,
  "unemployed": 9000,
  "unreachable": 10000,
  "retention": { "3m": 78, "6m": 69, "12m": 61, "24m": 54 },
  "wage_progression": { "start": 12000, "m6": 14500, "m12": 17000 }
}
```

---

## 9. DATA TYPES / CONSTRAINTS

| Field | Constraint |
|-------|-----------|
| `id` | UUID |
| `employment_type` | `full_time|part_time|contract|self_employed|apprenticeship` |
| `verification_status` | `self_reported|pending|employer_confirmed|evidence_confirmed|rejected` |
| `role` | `trainee|employer|provider|government|admin` |
| `aadhaar_hash` | SHA-256 hex (64 chars), **hashed only — never raw** |
| `current_salary` | Decimal, INR |
| Audit | Every create/update → `audit_log` |

---

## 10. SWAGGER

Interactive docs (auto-generated from contract): **`http://localhost:3001/docs`**
Use "Authorize" button to set the JWT bearer token.

---

**Contract frozen by:** Member 5 (Database + API)
*End of contract. Version 1.0.0.*
