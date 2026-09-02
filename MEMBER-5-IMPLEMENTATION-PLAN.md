# MEMBER 5 (DATABASE + API) — 6-PHASE IMPLEMENTATION PLAN

**Project:** Skilling Outcomes Intelligence System (SOIS) · PS ID 26135 · Govt of Maharashtra
**Role:** Database + API Developer — the **Contract Owner**
**Scope:** PostgreSQL 16 schema, all REST APIs, auth/RBAC, seed data, audit logging, Swagger docs.

> This is an **implementation plan only** — no code. It is the blueprint that guides what you build in each of the 6 phases, matching `PHASE-CHECKLIST.md` and `WORKFLOW-FLOW.md`.
>
> **Key rule:** You are on the **critical path (M5 → M4 → M1 → M2)**. Everything you freeze in Phase 1 unblocks all other 5 members. Never build ahead of the schema you own.

---

# OVERVIEW — YOUR 6 PHASES

| Phase | Git Tag | Focus | Main Deliverables | You Unblock |
|-------|---------|-------|-------------------|-------------|
| 1 | `db/ph1-schema` | Foundation + Contracts | Prisma schema, migrations, auth, Swagger, **frozen API contract** | ALL members |
| 2 | `db/ph2-trainee` | Trainee + Identity | trainees, identity_matches, training_records endpoints + audit | M1, M4 |
| 3 | `db/ph3-followup` | Follow-ups | follow_ups, skill_gaps tables/endpoints | M1, M4 |
| 4 | `db/ph4-employment` | Verification + Employer | employment_records, verification_evidence, employers | M2, M3 |
| 5 | `db/ph5-analytics` | Analytics + RBAC lockdown | analytics_snapshots + aggregation + RBAC | M2 |
| 6 | `db/ph6-seed` | Demo readiness | Final Maharashtra seed, docs, master script | Demo |

**Critical path reminder:** Phase 1 contract → Phase 2 (M4/M1 go live) → Phase 4 (M3/M2) → Phase 5 (M2 gov dashboard).

---

# PHASE 1 — FOUNDATION + CONTRACTS (Week 1)
**Git tag:** `db/ph1-schema`
**Gate:** 15/15 checks in `PHASE-CHECKLIST.md` Part A Phase 1 (your share)

## Goal
Get your dev environment running and **freeze the API contract** so everyone can build in parallel.

## Tasks (in order)

### 1.1 Project scaffold
- Create `backend/` NestJS app inside the repo.
- `.gitignore` with `.env`, `node_modules`, `dist`, `prisma/migrations` cache.
- Root `README.md` describing the 3 services (backend :3001, fe-trainee :3000, fe-admin :3002).

### 1.2 Docker Compose (shared with Arch/M6)
- `docker-compose.yml` with `postgres:16` + `redis` + backend service.
- `.env` with `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, ports.

### 1.3 Prisma schema — create ALL 11 tables now (Part D of SOIS-CORE-MODULES.md)
Tables to reproduce 1:1:
1. `trainees` (+`aadhaar_hash`, `unified_identity_id`, `identity_status`, `merge_confidence`, consent fields)
2. `identity_matches` (dedup audit)
3. `training_records`
4. `training_providers`
5. `employers`
6. `employment_records` (THE core outcome table + confidence)
7. `verification_evidence`
8. `follow_ups`
9. `skill_gaps`
10. `analytics_snapshots`
11. `audit_log`

> Define the **full schema in Phase 1** even if endpoints come later. This lets other members `prisma generate` the client and build against real types immediately.

### 1.4 Run migration
- `prisma migrate dev --name init` → committed migration.
- Confirm all 11 tables exist (`prisma studio` or psql `\dt`).

### 1.5 Auth + RBAC foundation
- JWT login endpoint: `POST /api/v1/auth/login` returns `{ accessToken, refreshToken, role }`.
- Role enum: `trainee | employer | provider | government | admin`.
- Global guards:
  - `protect` — any valid JWT.
  - `authorize(...roles)` — role-based.
- Password hashing with **bcrypt (cost 10)**.
- **JWT: 15 min access token + 7 day refresh token.**

### 1.6 Swagger / OpenAPI
- Enable Swagger at `/docs` documenting every endpoint + DTO (validation classes).

### 1.7 Health endpoint
- `GET /health` → 200 with uptime + DB connectivity check.

### 1.8 FREEZE THE API CONTRACT
- This is your #1 deliverable. Generate/export a **shared JSON OpenAPI spec** + a written `API-CONTRACT.md`.
- Share it with M1, M2, M3, M4 so they build UI/backend against real contracts (not guesses).
- Freeze endpoint paths, request/response shapes, error codes, auth headers.

## Checkpoint 1.1 (Phase 1 gate, your part)
- [ ] `npm run dev` starts backend :3001
- [ ] Migrations run — all 11 tables created
- [ ] `POST /auth/login` returns JWT + role
- [ ] Protect guard blocks no-token requests
- [ ] `authorize()` blocks wrong roles
- [ ] `/health` returns 200
- [ ] Swagger accessible at `/docs`
- [ ] API contract frozen + shared

## Files you create this phase
- `docker-compose.yml` (with Arch)
- `backend/package.json`, `backend/tsconfig.json`
- `backend/prisma/schema.prisma`, `backend/prisma/migrations/*`
- `backend/src/main.ts` (bootstrap + Swagger)
- `backend/src/auth/**` (module, service, controller, guards, strategies)
- `backend/src/app.module.ts`
- `API-CONTRACT.md` (frozen)

---

# PHASE 2 — TRAINEE + IDENTITY (Week 2)
**Git tag:** `db/ph2-trainee`
**Gate:** 18/18 checks Phase 2 (your share)

## Goal
Trainee endpoints work end-to-end: registration with consent, identity matching, training records, merge audit. This unblocks M4 (dedup backend) and M1 (registration UI).

## Tasks

### 2.1 Trainee endpoints
- `POST /api/v1/trainees` — register with consent (captures `consent_version`, `consent_date`, language, channel).
- `GET /api/v1/trainees/:id` — profile (ownership-scoped).
- `PUT /api/v1/trainees/:id/consent` — update versioned consent (opt-in/out).

### 2.2 Identity endpoints (support M4's dedup algorithm)
- `GET /api/v1/trainees/:id/merge-candidates` — list probable duplicates (soft matches).
- `POST /api/v1/identity-matches/:id/confirm` — commit a merge.
- `POST /api/v1/identity-matches/:id/reject` — reject a false positive.
- `POST /api/v1/trainees/match` — run matching (consumes M4's algorithm OR reads rule results it writes).

### 2.3 Training records
- `GET /api/v1/trainees/:id/training` — linked courses + certifications.

### 2.4 Audit logging
- Wire **every create/update/merge** into `audit_log` (actor, action, entity, old/new JSONB, IP).

### 2.5 Aadhaar privacy
- Store only **hash** (never raw) — green check in Part E.

## Integration with others
- **M1 (FE)** uses your trainee/consent/merge/contact-update endpoints for registration + "update my phone" + "confirm this is you" screens.
- **M4 (BE2)** owns the dedup *algorithm*; you own the *schema + endpoints + audit rows* (`identity_matches`).

## Checkpoint 2.1 (your part)
- [ ] `POST /trainees` registers with consent captured + versioned
- [ ] Consent opt-in/out stored
- [ ] Training record linked
- [ ] Merge-candidates listed
- [ ] Confirm/reject merge works
- [ ] Every merge writes an `identity_matches` audit row
- [ ] Aadhaar stored hashed only

## Files you create this phase
- `backend/src/trainees/**`
- `backend/src/identity/**`
- `backend/src/audit/**` (logging service)
- `backend/src/training/**` (records)
- Updated `schema.prisma` (if fields added) + migration
- Swagger updates

---

# PHASE 3 — FOLLOW-UPS (Week 3)
**Git tag:** `db/ph3-followup`
**Gate:** 13/13 checks Phase 3 (your share)

## Goal
Follow-up scheduling + response capture + skill-gap tables exist. This powers M4's scheduler and M1's micro-survey.

## Tasks

### 3.1 follow_ups table + endpoints
- `POST /api/v1/follow-ups/schedule` — create a scheduled follow-up (30d/3m/6m/12m/24m).
- `GET /api/v1/follow-ups/pending` — pending follow-ups for a trainee.
- `POST /api/v1/follow-ups/:id/respond` — save answers (questions/responses JSONB), `response_time_seconds`, `non_placement_reason`.
- `GET /api/v1/follow-ups/unreachable` — after all channels fail.

### 3.2 skill_gaps table + endpoint
- Table ready (course, sector, job_role, gap_type, description, recommendation).
- `GET /api/v1/analytics/skill-gaps` (placeable here or Phase 5).

> **Note:** M4 owns the scheduler logic (Redis cron). You supply the schema, persistence, and response API. The "Working: Yes → employment signal" handoff happens between M4 → M3.

## Checkpoint 3.1 (your part)
- [ ] follow_ups table supports schedule → sent → responded states
- [ ] `response_time_seconds` tracked
- [ ] `non_placement_reason` stored on "not working"
- [ ] skill_gaps table + endpoint queryable

## Files you create this phase
- `backend/src/followups/**`
- `backend/src/skillgaps/**`
- Migration for `follow_ups`/`skill_gaps` changes
- Swagger updates

---

# PHASE 4 — VERIFICATION + EMPLOYER (Week 4)
**Git tag:** `db/ph4-employment`
**Gate:** 18/18 checks Phase 4 (your share)

## Goal
Employment verification + employer data supported. This is where M3 (verification engine) and M2 (employer portal) depend on you.

## Tasks

### 4.1 employment_records + endpoints (schema you own)
- `POST /api/v1/employment` — create record: trainee_id (validated unified identity) + training_id + employer_id + job_role + employment_type + salary (INR decimal) + joining_date.
- `GET /api/v1/employment/:id` — details incl. `verification_status` + `confidence_score` + `level`.
- Employment types supported: `full_time | part_time | contract | self_employed | apprenticeship`.

### 4.2 verification_evidence + endpoint
- `POST /api/v1/employment/:id/evidence` — store evidence (salary_slip, bank_statement, offer_letter, udyam_link, epfo_check) with `confidence_contribution`.
- `POST /api/v1/employment/:id/verify` — trigger verification state machine (logic owned by M3; you provide endpoint + storage).

### 4.3 employers + endpoint
- `POST /api/v1/employers` — register employer (udyam_number, verified flag).
- `GET /api/v1/employers/:id`.
- `POST /api/v1/employers/:id/verify-employment` — confirm/deny (M2 portal calls this).

### 4.4 Confidence score (shared contract)
Re-expose and agree the exact weights:
```
score = 20 (self) + 40 (employer confirmed)
      + 15 (salary slip) + 10 (bank statement) + 10 (offer letter) + 5 (udyam)
      + 20 (EPFO verified); cap 100
Levels: 80-100 HIGH | 50-79 MEDIUM | 20-49 LOW | 0-19 UNVERIFIED
```
Return `confidence_score` + `verification_status` + `level` from every employment response.

## Integration with others
- **M3 (BE1)** owns verification *logic*; you own the *schema, evidence table, and confirm/deny endpoint storage*.
- **M2 (FE2)** calls your `/employers/:id/verify-employment` and reads confidence from employment GET.

## Checkpoint 4.1 (your part)
- [ ] employment_records created (all 5 types) + salary decimal INR
- [ ] Evidence stored with confidence_contribution
- [ ] verify triggers state machine (with M3)
- [ ] employers register + verify-employment works
- [ ] Every action in audit_log

## Files you create this phase
- `backend/src/employment/**`
- `backend/src/employers/**`
- `backend/src/verification/**` (state storage coordination with M3)
- Migration for new fields
- Swagger updates

---

# PHASE 5 — ANALYTICS + RBAC LOCKDOWN (Week 5)
**Git tag:** `db/ph5-analytics`
**Gate:** 20/20 checks Phase 5 (your share)

## Goal
Precomputed analytics + **strict RBAC** so only government/admin see aggregates. Powers M2's gov dashboard.

## Tasks

### 5.1 analytics_snapshots table
- schema supports `snapshot_type` (`district | provider | course | cohort`), `entity_id`, `period_start/end`, `metrics JSONB`.

### 5.2 Aggregation endpoints (SQL over your schema)
- `GET /api/v1/analytics/dashboard` — overview KPIs (trained/certified/verified/unemployed/unreachable).
- `GET /api/v1/analytics/provider-ranking` — ranked by placement/retention.
- `GET /api/v1/analytics/district/:id` — district data.
- `GET /api/v1/analytics/course/:id` — course effectiveness.
- `GET /api/v1/analytics/skill-gaps` — gaps + recommendations.
- Retention (3m/6m/12m/24m) + wage progression computed from employment/follow-up data.

### 5.3 🔐 RBAC LOCKDOWN (SECURITY-CRITICAL — with M3)
Enforce on **every** `/api/v1/analytics/*` (and provider-ranking, skill-gaps):
- BLOCKED for `trainee`
- BLOCKED for `employer`
- ALLOWED for `government` + `admin`
``` 
@UseGuards(AuthGuard) @Roles('admin','government')
```
> This is a **PS privacy requirement**, not optional. Verify with role-protected tests.

### 5.4 Analytics snapshot population
- Batch job (cron/manual) recomputes `analytics_snapshots` from source tables.

## Integration with others
- **M2 (FE2)** reads `/analytics/*` for the gov dashboard + charts.
- **M3** helps dual-verify the RBAC guards.

## Checkpoint 5.1 (your part)
- [ ] `/analytics/dashboard` returns KPIs
- [ ] Provider ranking, district, course, skill-gaps all return data
- [ ] Retention/wage calculated
- [ ] **RBAC: trainee BLOCKED** (403)
- [ ] **RBAC: employer BLOCKED** (403)
- [ ] **RBAC: government/admin ALLOWED** (200)
- [ ] All in audit_log

## Files you create this phase
- `backend/src/analytics/**` (aggregation service + controller + guards)
- Migration for `analytics_snapshots`
- Seed/aggregation cron module
- Swagger updates

---

# PHASE 6 — SEED DATA + DEMO READY (Week 6)
**Git tag:** `db/ph6-seed`
**Gate:** 14/14 checks Phase 6 (your share)

## Goal
Realistic demo dataset + full-system run for the judges.

## Tasks

### 6.1 Seed data (realistic Maharashtra)
- Districts: **Pune, Mumbai, Nagpur** (+ rural).
- Providers, courses, sectors (e.g. solar tech), employers.
- Trainees across districts with varied employment outcomes + confidence scores.
- Enough rows so dashboards/charts show meaningful numbers ("Course X 61% retention", "gap in Y").

### 6.2 Master seed script
- `prisma db seed` reproducible, idempotent (re-runnable).
- Resets to a known demo state.

### 6.3 Documentation
- Update README with run commands, seed instructions, port map, demo accounts (trainee/employer/gov/admin).
- Confirm `API-CONTRACT.md` matches the shipped schema.

### 6.4 Final verification sweep
- Run the whole `PHASE-CHECKLIST.md` — every row green.
- Audit log captures all demo actions.
- Confirm RBAC lockdown holds under demo flow.

### 6.5 Commit + tag
- Merge all branches, push, tag `v1.0-demo`.

## Checkpoint 6.1 (your part)
- [ ] Seed loaded (Pune/Mumbai/Nagpur)
- [ ] `docker compose up --build` runs full system
- [ ] Health checks pass
- [ ] Audit log captures all actions
- [ ] README + demo accounts documented
- [ ] Git tag `v1.0-demo` pushed

## Files you create this phase
- `backend/prisma/seed.ts` (or `seed/*`)
- `backend/prisma/seed-data/` (JSON fixtures)
- Updated README, API-CONTRACT.md
- Final migration (if any)

---

# CROSS-PHASE — THINGS THAT STAY TRUE EVERY PHASE

## Audit logging (always)
Every create/update/merge writes to `audit_log`:
`actor_id, actor_type, action, entity_type, entity_id, old_value, new_value, ip_address, created_at`.

## Privacy (always — Part E of checklist)
- Aadhaar = **hash only**, never raw.
- No biometric/facial data anywhere.
- Consent versioned (`consent_version`, `consent_date`).
- Aggregate analytics **government/admin only**.

## Security (always)
- bcrypt (cost 10) for passwords.
- JWT 15m access / 7d refresh.
- Rate limiting (in-memory express-rate-limit) on auth + write endpoints.
- Input validation on every DTO (class-validator).
- No secrets in Git (`.env` only).

## Testing
- Unit tests per module service.
- e2e/auth tests verifying RBAC (trainee vs gov on analytics) — critical for Phase 5.
- Health check in CI.

---

# DEPENDENCY MAP — WHO NEEDS YOU **WHEN**

| Your deliverable | Who consumes | Needed by Phase |
|------------------|--------------|-----------------|
| Schema + migrations | M3, M4 (Prisma client) | 1 |
| Frozen API contract | M1, M2, M3, M4 | 1 |
| Auth + RBAC guards | All | 1 |
| Trainee/identity/training endpoints | M1, M4 | 2 |
| Follow-up + skill-gap tables | M4, M1 | 3 |
| Employment + evidence + employers | M3, M2 | 4 |
| Analytics + RBAC lockdown | M2 | 5 |
| Seed data + docs + tag | All (demo) | 6 |

**Critical path you drive:** `M5 → M4 → M1 → M2`

---

# SUCCESS METRIC (your role)
> All modules read/write through **documented, authenticated, audited** APIs. One source of truth — no duplicated data. Every PS expected-solution item is verifiable through your schema.

**End of Member 5 Implementation Plan.**
