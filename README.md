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

---

## Repository Structure

```
├── backend/                  # NestJS + Prisma + PostgreSQL API (Member 5)
│   ├── prisma/               # schema, migrations, seed
│   ├── src/
│   │   ├── auth/             # JWT + RBAC guards, login
│   │   ├── prisma/           # Prisma service
│   │   ├── health/           # /health endpoint
│   │   └── …                 # modules added per phase
│   └── test/
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
| Frontend | Next.js (trainee :3000, admin :3002) |

---

## Running Locally

### 1. Start infrastructure (Postgres + Redis)
```bash
docker compose up -d postgres redis
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL
npx prisma migrate dev      # apply migrations
npx prisma db seed          # seed demo users
npm run start:dev           # http://localhost:3001
```
- API docs (Swagger): `http://localhost:3001/docs`
- Health: `http://localhost:3001/api/v1/health`

### 3. Frontends (Member 1 & 2)
- Trainee app: `frontend-trainee` → `:3000`
- Admin app: `frontend-admin` → `:3002`

---

## Roles (RBAC)

`trainee · employer · provider · government · admin`

> **Privacy:** aggregate analytics are restricted to `government`/`admin` only. Trainees never see aggregate data.

---

## Team

| Member | Role | Modules |
|--------|------|---------|
| Member 1 | Frontend 1 (Trainee) | M1, M2 |
| Member 2 | Frontend 2 (Employer + Gov) | M4, M5 |
| Member 3 | Backend 1 (Verification + Employer) | M3, M4 |
| Member 4 | Backend 2 (Identity + Follow-ups) | M1, M2 |
| Member 5 | Database + API (this repo owner) | All (schema) |
| Member 6 | Architecture + Research | Cross-cutting |

---

## License

Private / team project for SIH 2026.
