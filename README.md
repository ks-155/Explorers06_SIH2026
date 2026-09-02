# Explorers06 — SIH 2026 · Skilling Outcomes Intelligence System (SOIS)

**Problem Statement ID:** 26135
**Organization:** Government of Maharashtra · Maharashtra State Innovation Society, Dept. of Skills, Employment, Entrepreneurship and Innovation
**Track:** Team Explorers06

> A **consent-based, longitudinal outcome-intelligence system** that reliably tracks and *verifies* what happens to a trainee AFTER skill training — employment, self-employment, retention, wage progression, relevance of training and longer-term livelihood outcomes — and converts those outcomes into actionable insights for trainees, training providers, employers and government.

---

## Problem Statement

Training systems frequently capture enrolment, attendance, assessment and certification, but reliable information on employment, self-employment, job retention, wage progression, relevance of training and longer-term livelihood outcomes may remain incomplete. Trainees may change phone numbers or locations, employers may not report consistently, and multiple programmes may use different identifiers and definitions.

**The challenge:** establish **credible, low-burden and privacy-conscious** outcome tracking that links training to placement and employment signals, conducts automated and assisted follow-ups, validates employer information, measures wage and retention progression, provides cohort/course/provider/district/demographic analytics, and identifies skill gaps and reasons for non-placement or attrition.

---

## Solution Overview

A **modular-monolith** platform with clear module boundaries:

| Module | Purpose |
|--------|---------|
| M1 · Unified Identity | Consent-based, deduplicated trainee identity; survives phone/location changes |
| M2 · Smart Follow-up Engine | Automated + assisted multi-channel follow-ups (30d/3m/6m/12m/24m) |
| M3 · Verification Engine | Confidence-scored, evidence-weighted employment verification (core innovation) |
| M4 · Employer Portal | One-click employer confirm/deny |
| M5 · Outcome Analytics | Gov/provider/course/district dashboards, retention & wage analytics |
| M6 · Skill Gap Engine | Outcome-based skill-gap detection + recommendations |

### Integration Status (Phase 1-3)

`origin/master = bb9bd7c` — all 5 members Phase 1-3 integrated, zero file conflicts. Frontend and backend isolated (`frontend-trainee/` vs `frontend-admin/` vs `backend/`), APIs wired via frozen contract `API-CONTRACT.md v1.0.0`. Ready for local run.

---

## Repository Structure

```
├── backend/                  # NestJS + Prisma + PostgreSQL API (Member 3/4/5)
│   ├── prisma/               # schema, migrations, seed
│   ├── src/
│   │   ├── auth/             # JWT + RBAC guards, login
│   │   ├── prisma/           # Prisma service
│   │   ├── health/           # /health endpoint
│   │   ├── common/audit/     # audit_log writer
│   │   ├── modules/
│   │   │   ├── trainees/         # M1
│   │   │   ├── identity-matches/ # M1 dedup
│   │   │   ├── follow-ups/       # M2
│   │   │   ├── skill-gaps/       # M6
│   │   │   ├── employment/       # M3
│   │   │   ├── verification/     # M3 confidence
│   │   │   ├── employers/        # M4
│   │   │   └── adapters/         # EPFO/Udyam/ESIC mocked
│   └── test/
├── frontend-trainee/         # Next.js 14 trainee app :3000 (Member 1)
│   ├── src/app/
│   │   ├── login/            # login
│   │   ├── register/         # P2 registration
│   │   ├── consent/[id]/     # P2 consent
│   │   ├── training/[id]/    # P2 training view
│   │   ├── contact/[id]/     # P2 phone/location update
│   │   ├── identity/[id]/    # P2 merge candidates
│   │   └── survey/           # P3 micro-survey + i18n hi/mr/en
│   └── src/lib/api-client.ts # /api/v1 client + MSW mocks
├── frontend-admin/           # Next.js 14 admin app :3002 (Member 2)
│   ├── src/app/(auth)/login/ # gov/employer login
│   ├── src/app/(employer)/   # P2 VerifyCard + ConfidenceBadge
│   └── src/app/(gov)/        # P3 KpiCards + ranking/district/skill-gaps (mocks)
├── docker-compose.yml        # postgres + redis + backend (Arch/M6)
└── API-CONTRACT.md           # FROZEN API contract (Member 5, Phase 1)
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + NestJS (TypeScript) |
| Database | PostgreSQL 16 (Prisma ORM) |
| Cache/Queue | Redis |
| Auth | JWT (15m access / 7d refresh) + RBAC (5 roles) |
| Frontend | Next.js 14 + Tailwind + shadcn/ui + TanStack Query + MSW |
| Docs | Swagger/OpenAPI at `/docs` |

---

## Quick Links (after local run)

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `http://localhost:3001` | Base URL (`/api/v1` prefix) |
| **Swagger / OpenAPI** | `http://localhost:3001/docs` | Interactive API docs — use **Authorize** to paste JWT |
| **Health** | `http://localhost:3001/api/v1/health` | `{"status":"ok","database":"up"}` public check |
| **Trainee App** | `http://localhost:3000` | Member 1 — register → consent → survey (hi/mr/en) |
| **Trainee Login** | `http://localhost:3000/login` | Phone/email + password → JWT |
| **Admin App** | `http://localhost:3002` | Member 2 — employer + gov dashboards |
| **Admin Login** | `http://localhost:3002/login` | Gov/employer login |
| **Employer Verify** | `http://localhost:3002/employer/[id]` | One-click confirm/deny |
| **Gov Dashboard** | `http://localhost:3002/dashboard` | KPIs + ranking + district + skill-gaps (mocks) |

> **Proxy:** both frontends use `next.config.mjs` rewrite `/api/v1/* → http://localhost:3001/api/v1/*` — no CORS, no exposed BE URL.

---

## Running Locally

### Prerequisites

- **Node.js 18+** + npm
- **Docker + Docker Compose** (for Postgres 16 + Redis 7)
- **Git**

### 1. Clone & checkout master

```bash
git clone https://github.com/ks-155/Explorers06_SIH2026.git
cd Explorers06_SIH2026
git checkout master
git pull origin master   # bb9bd7c — Phase 1-3 integrated
```

### 2. Start infrastructure (Postgres + Redis)

```bash
docker compose up -d postgres redis
docker compose ps                    # both healthy
```

Verify DB:

```bash
docker exec -it sois-postgres psql -U sois -d sois -c "\dt"
```

### 3. Backend — `http://localhost:3001`

Open **terminal 1**:

```bash
cd backend
npm install
cp .env.example .env        # edit DATABASE_URL if needed (default: postgresql://sois:sois@localhost:5432/sois)
npx prisma migrate dev      # applies prisma/migrations/20260902070000_init
npx prisma db seed          # seeds 4 demo users (see Demo Accounts below)
npm run start:dev           # http://localhost:3001  — watch mode
```

Check:

- Health: `curl http://localhost:3001/api/v1/health` → `{"status":"ok","database":"up"}`
- Swagger: open `http://localhost:3001/docs` → click **Authorize** → paste `Bearer <accessToken>` from login

> **Env:** `backend/.env.example` → `DATABASE_URL`, `PORT=3001`, `JWT_SECRET`, `BCRYPT_SALT_ROUNDS=10`.

### 4. Trainee App — `http://localhost:3000` (Member 1)

Open **terminal 2**:

```bash
cd frontend-trainee
npm install
npm run dev                 # http://localhost:3000
# MSW mocks auto-enable in dev; to hit live BE, set NEXT_PUBLIC_API_URL=http://localhost:3001
```

Flow to test: `http://localhost:3000/register` → create trainee → `http://localhost:3000/consent/[id]` → `http://localhost:3000/training/[id]` → `http://localhost:3000/identity/[id]` (merge) → `http://localhost:3000/survey/[id]` (follow-up <60s, hi/mr/en via `lib/i18n.ts`).

### 5. Admin App — `http://localhost:3002` (Member 2)

Open **terminal 3**:

```bash
cd frontend-admin
npm install
npm run dev                 # http://localhost:3002 (next.config.mjs: dev -p 3002)
```

Flow to test: `http://localhost:3002/login` (gov/employer) → `http://localhost:3002/employer/[id]` (VerifyCard confirm/deny, `ConfidenceBadge` HIGH/MED/LOW) → `http://localhost:3002/dashboard` (KpiCards + ranking/district — `lib/withRole.tsx` guards `government`/`admin` only).

### 6. Full-stack via Docker (alternative)

```bash
docker compose up --build          # builds backend + postgres + redis
docker compose logs -f backend     # tail logs
```

> Frontend Docker: `frontend-trainee/` and `frontend-admin/` have no compose entry — run via `npm run dev` as above (per `ARCHITECTURE.md` local dev).

### Demo Accounts (seeded via `prisma db seed`)

| Role | Identifier | Password | Use |
|------|------------|----------|-----|
| `government` | `gov@mh.gov.in` | `gov123456` | Gov dashboard `/dashboard` |
| `admin` | `admin@sois.in` | `admin123456` | All analytics + admin |
| `trainee` | `trainee@sois.in` | `trainee123456` | Trainee app `:3000` |
| `employer` | `employer@sois.in` | `employer123456` | Employer portal `:3002/employer/[id]` |

Get a JWT manually:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gov@mh.gov.in","password":"gov123456"}'
# → { "accessToken":"<jwt>", "refreshToken":"<jwt>", "role":"government", "userId":"<uuid>" }

curl http://localhost:3001/api/v1/trainees/<id> \
  -H "Authorization: Bearer <accessToken>"
```

---

## Backend API — Readable List

**Base:** `http://localhost:3001` · **Prefix:** `/api/v1` · **Docs:** `http://localhost:3001/docs`

### 0. Auth & RBAC

| Guard | Behaviour |
|-------|-----------|
| `protect` (default, `JwtAuthGuard`) | Requires `Authorization: Bearer <token>` |
| `authorize('admin','government')` (`RolesGuard`) | Role-scoped; aggregate analytics gov/admin only |
| **Public** | `POST /api/v1/auth/login`, `GET /api/v1/health`, `GET /api/v1` |

**JWT:** 15 min access / 7 day refresh · **Password:** bcrypt cost 10 · **Error:** `{ statusCode, message, error }`

### 1. Auth

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/v1/auth/login` | Login → `{ accessToken, refreshToken, role, userId }` | Public |

`{ identifier: email|phone, password }` → `200 { accessToken, refreshToken, role, userId }`

### 2. Health / System

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/v1/health` | DB + uptime → `{ status:"ok", uptime, database:"up" }` | Public |
| `GET` | `/api/v1` | Service banner | Public |

### 3. Trainees — M1 (`trainees.controller.ts`)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `POST` | `/api/v1/trainees` | Register (consent captured) | Public / `provider` |
| `GET` | `/api/v1/trainees/:id` | Get profile (ownership-scoped) | owner (`trainee` self) / `admin` |
| `PUT` | `/api/v1/trainees/:id/consent` | Update versioned consent | owner / `admin` |
| `GET` | `/api/v1/trainees/:id/training` | Training records | owner / `admin` |
| `GET` | `/api/v1/trainees/:id/employment` | Employment records | owner / `admin` |
| `POST` | `/api/v1/trainees/match` | Run identity dedup sweep | `admin`, `provider` |
| `GET` | `/api/v1/trainees/:id/merge-candidates` | Probable duplicates (`proposed`) | owner / `admin` |
| `PUT` | `/api/v1/trainees/:id/contact-update` | Update phone/location, re-link identity | owner / `admin` |

### 4. Identity Matches — M1 (`identity-matches.controller.ts`)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `POST` | `/api/v1/identity-matches/:id/confirm` | Confirm merge (audit → `audit_log`) | owner / `admin` |
| `POST` | `/api/v1/identity-matches/:id/reject` | Reject false positive | owner / `admin` |

### 5. Follow-ups — M2 (`follow-ups.controller.ts`)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `POST` | `/api/v1/follow-ups/schedule` | Schedule (30d/3m/6m/12m/24m) | `admin`, `provider` |
| `POST` | `/api/v1/follow-ups/:id/respond` | Submit response (`responses` JSON, `non_placement_reason`, `response_time_seconds`) | `trainee` (self) |
| `GET` | `/api/v1/follow-ups/pending` | Pending for logged-in trainee | `trainee` |
| `GET` | `/api/v1/follow-ups/unreachable` | All `failed` follow-ups | `admin`, `provider` |

**FE wiring:** `frontend-trainee/src/lib/api-client.ts:followUps.getPending/respond` → `src/app/survey/[id]/page.tsx` micro-survey + `lib/i18n.ts` hi/mr/en.

### 6. Employment — M3 (`employment.controller.ts` + `verification.controller.ts`)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `POST` | `/api/v1/employment` | Create (self-reported, `confidence_score=20` initial) | `trainee`, `employer`, `provider`, `admin` |
| `GET` | `/api/v1/employment/:id` | Get + `confidence_score` + `level` (HIGH/MED/LOW/UNVERIFIED) | authenticated |
| `POST` | `/api/v1/employment/:id/verify` | Trigger verification state machine (pending→confirmed/denied) | `trainee`, `employer`, `provider`, `admin` |
| `POST` | `/api/v1/employment/:id/evidence` | Add evidence (`salary_slip` 15, `bank_statement` 10, `offer_letter` 10, `udyam_link` 5, `epfo_check` 20) | `trainee`, `provider`, `admin` |

**Confidence:** `20(self) + 40(employer confirmed) + evidence(0-40) + 20(EPFO)`, cap 100 → `80-100 HIGH | 50-79 MEDIUM | 20-49 LOW | 0-19 UNVERIFIED` (`verification/confidence-score.service.ts`).

### 7. Employers — M4 (`employers.controller.ts`)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `POST` | `/api/v1/employers` | Register employer (udyam_number, verified flag) | `employer`, `admin` |
| `GET` | `/api/v1/employers/:id` | Get employer + `pending_verifications` count | authenticated |
| `GET` | `/api/v1/employers/:id/verify-pending` | Pending `employmentRecords` for employer | `employer` |
| `POST` | `/api/v1/employers/:id/verify-employment` | One-click confirm/deny → updates `confidence_score` + `audit_log` | `employer` (own org) |

`{ employment_id, decision:"confirm"|"deny", still_employed, job_relevant }` → `employers.service.ts:106` `verifyEmployment`.

**FE wiring:** `frontend-admin/src/components/employer/VerifyCard.tsx` + `ConfidenceBadge.tsx` → `src/app/(employer)/employer/[id]/page.tsx` pending table (mocks `employerMock.ts`, live `POST` Phase 4).

### 8. Analytics — M5 (`skill-gaps.controller.ts`, gov/admin only)

| Method | Endpoint | Purpose | Roles |
|--------|----------|---------|-------|
| `GET` | `/api/v1/analytics/dashboard` | Overview KPIs (trained/certified/verified/unemployed/unreachable + retention 3m/6m/12m/24m + wage) | `admin`, `government` |
| `GET` | `/api/v1/analytics/provider-ranking` | Provider rankings (mock → live Phase 5) | `admin`, `government` |
| `GET` | `/api/v1/analytics/district/:id` | District analytics | `admin`, `government` |
| `GET` | `/api/v1/analytics/course/:id` | Course analytics | `admin`, `government` |
| `GET` | `/api/v1/analytics/skill-gaps` | Skill gaps + recommendations | `admin`, `government` |

**Privacy:** `RolesGuard` blocks `trainee`/`employer` → `403`; `frontend-admin/src/lib/withRole.tsx:1` + `lib/rbac.ts:6` `canViewAnalytics`.

**FE wiring:** `frontend-admin/src/components/government/KpiCards.tsx` + `src/app/(gov)/dashboard/*` (mocks `govMock.ts`, live wiring Phase 5).

---

## Roles (RBAC)

`trainee · employer · provider · government · admin`

| Route group | Allowed | Enforced by |
|-------------|---------|-------------|
| `/api/v1/trainees/:id/*` | That trainee only (ownership check `trainees.service.ts:357` `assertOwnerOrAdmin`) | `JwtAuthGuard` + service |
| `/api/v1/employers/*` | Employer of that org | `employers.service.ts:126` |
| `/api/v1/analytics/*` | `admin`, `government` ONLY | `RolesGuard` + `frontend-admin/src/lib/withRole.tsx` |
| `/api/v1/follow-ups/*` | Trainee self (pending/respond) | `follow-ups.service.ts:157` |
| `/api/v1/training-records` | `provider`, `admin` | `RolesGuard` |

> **Privacy:** aggregate analytics are restricted to `government`/`admin` only. Trainees never see aggregate data. Aadhaar stored as `aadhaar_hash` only (never raw).

---

## Team

| Member | Role | Modules | Phase 1-3 status on `master` |
|--------|------|---------|------------------------------|
| Member 1 | Frontend 1 (Trainee) `:3000` | M1, M2 | P1 scaffold + P2 register/consent/training/identity + P3 survey — `frontend-trainee/` 38 files ✅ |
| Member 2 | Frontend 2 (Employer + Gov) `:3002` | M4, M5 | P1 foundation + P2 employer mock + P3 gov dashboard — `frontend-admin/` 38 files ✅ |
| Member 3 | Backend 1 (Verification + Employer) | M3, M4 | `employment/`, `verification/`, `employers/`, `adapters/` — 74 BE files ✅ |
| Member 4 | Backend 2 (Identity + Follow-ups) | M1, M2 | `trainees/`, `identity-matches/`, `follow-ups/` via `db/ph2`+`db/ph3` ✅ |
| Member 5 | Database + API (contract owner) | All (schema) | 11 tables `schema.prisma`, frozen `API-CONTRACT.md`, `health/`, `audit/` ✅ |
| Member 6 | Architecture + Research | Cross-cutting | `docker-compose.yml`, `ARCHITECTURE.md` |

Phase 4-6 next: M5 audit wiring → M3 live verify → M2 live analytics → seed Maharashtra (Pune/Mumbai/Nagpur).

---

## License

Private / team project for SIH 2026.
