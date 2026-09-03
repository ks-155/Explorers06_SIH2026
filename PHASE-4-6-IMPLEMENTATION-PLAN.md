# PHASE 4-6 IMPLEMENTATION PLAN — SOIS (PS 26135)

**Base:** `master=4f9c4e0` · **Scope:** finish what P1-3 left open, demo-ready `v1.0-demo`
**Source docs:** `API-CONTRACT.md` (frozen v1.0.0) · `ARCHITECTURE.md` · `PHASE-CHECKLIST.md` · `WORKFLOW-FLOW.md`

> P1-3 are **integrated and live-verified** on master: 12 models + 3 migrations,
> JWT/RBAC, all trainee/identity/follow-up/employment/verification/employer/analytics
> routes, both frontends wired, backend build ✅, jest 20/20 ✅, both FEs `tsc` ✅,
> live E2E (register → consent → schedule → respond → employment signal) ✅.
> This plan covers **only remaining gaps** — no rework of merged code.

---

## STARTING STATE (verified 2026-09-03, live on :3001/:3000/:3002)

| Area | Status | Evidence |
|------|--------|----------|
| P1 Foundation (15/15) | DONE | schema 12 models, `POST /auth/login`, `GET /health`, `/docs`, strict `/api/v1` proxies |
| P2 Trainee+Identity (18/18) | DONE | 8 trainee + 2 identity routes, dedup, FE register/consent/training/contact/identity |
| P3 Follow-ups (13/13) | DONE | schedule/respond/pending/unreachable + cron + retry + survey hi/mr/en + I3.1 signal live |
| M3 Verification | DONE (code) | state machine + confidence `20+40+15/10/10/5+20`, ownership/RBAC, EPFO/Udyam/ESIC mocked |
| M4 Analytics | DONE (code) | 7 endpoints `dashboard/retention/wage-progression/provider-ranking/district/course/skill-gaps`, gov/admin-only |
| M5 Seed | DONE (code) | `seed.ts` 598 lines: 6 providers, 50 trainees, 50 training, 10 employers, 20 employment, 30 follow-ups, 5 skill-gaps |
| M6 Infra | DONE (code) | 5-service compose, 3 Dockerfiles, helmet/throttler, CI |

## OPEN GAPS (this plan)

| ID | Gap | Owner |
|----|-----|-------|
| G-01 | Live E2E `verify-employment` confirm → 87% never demo-proven | M3 + M2 |
| G-02 | Evidence upload UI missing in employer portal (0 hits) | M2 |
| G-03 | Trainee home is 6 bare buttons; no personal dashboard | M1 |
| G-04 | Admin home is a bullet list; no polish/branding/responsive pass | M2 |
| G-05 | No PWA/offline (`next.config.mjs` 0 hits) | M1 |
| G-06 | No git tags (`git tag` empty) | M6 |
| G-07 | Seed never loaded against fresh DB + verified in dashboards | M5 |
| G-08 | No written demo script (judge flow) | M6 + all |

---

## PHASE 4 — VERIFICATION E2E (Week 4) · Gate: 18/18 `PHASE-CHECKLIST.md:99`

**Goal:** report job → employer confirms in <30s → confidence 87% HIGH, live.

### M3 (Backend 1) — `be/1-e2e`
1. Live-prove on seeded DB: `POST /employment` (trainee) → `POST :id/verify` → `POST :id/evidence` (salary_slip) → employer `POST /employers/:id/verify-employment` confirm → assert `confidence_score=87`, `level=HIGH`, `verification_status=employer_confirmed`.
2. Keep EPFO/Udyam/ESIC mocked (`adapters/`); document mock boundary in Swagger description.
3. Regression: `npm test` 20/20 stays green.

### M2 (Frontend 2) — `fe/2-verify-ui`
1. Employer portal: add **evidence note UI** (`salary slip / offer letter` checklist + `POST /employment/:id/evidence` call) in `frontend-admin/src/app/(employer)/employer/[id]/page.tsx`.
2. Show returned `confidence_score` + `level` badge after confirm (reuse `ConfidenceBadge.tsx`).
3. Keep mock fallback only when API unreachable (current pattern).

### M1 (Frontend 1) — `fe/1-verify-support`
1. `training/[id]/page.tsx`: confidence card already live — add human explainer ("87% = self-report 20 + employer 40 + salary slip 15 + bank 10 + …").
2. No backend changes.

**Checkpoint 4.1:** judge demo step `report → confirm → 87%` passes on local stack. `PHASE-CHECKLIST.md:99-124` all ✅.

---

## PHASE 5 — ANALYTICS LOCKDOWN + DASHBOARDS (Week 5) · Gate: 20/20 `PHASE-CHECKLIST.md:128`

**Goal:** gov dashboard answers "which courses produce best outcomes?" in <30s, privacy enforced.

### M4 (Backend 2) — `be/2-analytics-verify`
1. Verify the 7 `skill-gaps.controller.ts` routes return seeded Maharashtra data (not empty arrays) after `npx prisma db seed`.
2. Confirm retention (3m/6m/12m/24m) + wage progression compute from `employment/follow-up` tables.
3. RBAC re-proven live: trainee → 403, employer → 403, gov/admin → 200 (already tested 2026-09-03; re-run post-seed).

### M2 (Frontend 2) — `fe/2-analytics-polish`
1. Remove mock fallback where live data exists; keep fallback banner only on fetch error.
2. Provider ranking sortable table + district view + retention/wage `RetentionChart.tsx`/`WageChart.tsx` against live `GET /analytics/*`.
3. `withRole.tsx` + `canViewAnalytics` unchanged (already correct).

### M5 (Database) — `db/ph5-verify`
1. Fresh-DB proof: `npx prisma migrate deploy && npx prisma db seed` on empty `sois` → row counts match plan (50/50/10/20/30/5).
2. No schema changes expected; if any, new migration (precedent: `20260903073643_add_followup_retry_fields`).

**Checkpoint 5.1:** `GET /analytics/dashboard` returns Pune/Mumbai/Nagpur KPIs; trainee/employer blocked; `PHASE-CHECKLIST.md:128-155` all ✅.

---

## PHASE 6 — DEMO READINESS (Week 6) · Gate: 14/14 `PHASE-CHECKLIST.md:158`

**Goal:** `docker compose up --build` → full demo, no crashes, tagged.

### M6 (Architecture) — `arch/release`
1. `docker compose up --build` green: all 5 services healthy (`postgres`, `redis`, `backend`, `fe-trainee`, `fe-admin`).
2. `.github/workflows/ci.yml` green on `master`.
3. Tag `v1.0-demo` + push (`git tag` currently empty — G-06).
4. Write judge demo script (6 steps, ~5 min): register → consent → dedup confirm → survey <60s → employer confirm 87% → dashboard retention/wage/skill-gap.

### M1 (Frontend 1) — `fe/1-polish`
1. Trainee home (`page.tsx`): replace 6 bare buttons with guided cards (Register → Training → Survey) + Hindi/Marathi toggle wiring (`lib/i18n.ts` exists for survey; extend to shell).
2. Mobile-first pass (all pages already `p-4 max-w-*`; verify on 360px).
3. PWA: add `next-pwa` (or manual manifest + service worker) — G-05.

### M2 (Frontend 2) — `fe/2-polish`
1. Admin home (`page.tsx`): replace bullet list with role-aware landing (redirect already works; add cards).
2. Responsive + chart polish; loading/error states on all `useQuery` screens.

### M3/M4/M5 — hardening only
- M3: edge cases (double-verify, rejected→evidence blocked — already coded; demo-prove).
- M4: scheduler/retry demo-prove; no new endpoints.
- M5: `API-CONTRACT.md` conformance sweep (contract v1.0.0 unchanged).

**Checkpoint 6.1 (FINAL):** `PHASE-CHECKLIST.md:158-180` 14/14 ✅ → `v1.0-demo` pushed → demo ready.

---

## EXECUTION ORDER (critical path)

```
P4: M3 (live verify proof) ─┬─→ M2 (evidence UI + badge)
                            └─→ M1 (confidence explainer)
P5: M5 (fresh seed proof) → M4 (analytics data + RBAC re-proof) → M2 (live dashboards)
P6: M1 + M2 (polish/PWA) ‖ M6 (compose + CI + tag + demo script) ‖ M3/M4/M5 (harden)
```

**Branch rules:** branch from updated `master`, one branch per member per phase, PR (not direct push), `tsc` + `jest` green before merge — precedent: `75442cc` PR #4.

## DONE CRITERIA
- [ ] P4 gate 18/18, P5 gate 20/20, P6 gate 14/14 (`PHASE-CHECKLIST.md`)
- [ ] `docker compose up --build` → 5 healthy → demo script runs with no crash
- [ ] `git tag v1.0-demo` pushed
- [ ] `API-CONTRACT.md` v1.0.0 still accurate (no drift)
