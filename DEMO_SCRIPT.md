# SOIS — Judge Demo Script (Phase 6 · ~5 min · 6 steps)

> **Goal:** `docker compose up --build` → full judge flow no crash. Live stack: `postgres` + `redis` + `backend:3001` + `fe-trainee:3000` + `fe-admin:3002`.
Prereq: `docker compose up --build -d` → wait ~40s → `docker compose ps` 5 healthy. Seed already via entrypoint `npx prisma migrate deploy && npx prisma db seed || true && npm run start:prod`. Check: `curl http://localhost:3001/api/v1/health` → `{"status":"ok","database":"up"}`. Docs: `http://localhost:3001/docs` (Authorize → `Bearer <token>`).

**Demo accounts (seeded):**

| Role | Identifier | Password | Use |
|------|------------|----------|-----|
| `trainee` | `trainee@sois.in` | `trainee123456` | Step 1-4 `:3000` |
| `government` | `gov@mh.gov.in` | `gov123456` | Step 6 `:3002/dashboard` |
| `admin` | `admin@sois.in` | `admin123456` | E2E verify (or gov alt) |
| `employer` | `employer@sois.in` | `employer123456` | Step 5 `:3002/employer/[id]` |

**Live links:** Trainee `http://localhost:3000/login` · Register `http://localhost:3000/register` · Consent `http://localhost:3000/consent/[id]` · Identity `http://localhost:3000/identity/[id]` · Training `http://localhost:3000/training/[id]` · Survey `http://localhost:3000/survey/[id]` · Admin `http://localhost:3002/login` · Employer `http://localhost:3002/employer/[id]` · Gov `http://localhost:3002/dashboard` · Skill-gaps `http://localhost:3002/dashboard/skill-gaps` · Ranking `http://localhost:3002/dashboard/ranking`
**Backend E2E script (headless alt):** `powershell -ExecutionPolicy Bypass -File scripts/demo-phase4-verify.ps1` — asserts 85 HIGH live on `:3001` without UI.

---

### Step 1 — Register trainee [0:00-0:45]

**UI:** `http://localhost:3000/register` → fill → Submit.
**API (alt):**
```powershell
curl -X POST http://localhost:3001/api/v1/trainees -H "Content-Type: application/json" -d "{\"name\":\"Rahul Sharma\",\"phone\":\"9876543210\",\"district_id\":27,\"consent_given\":true,\"consent_version\":\"1.0\",\"preferred_language\":\"hi\",\"preferred_channel\":\"whatsapp\"}"
```
Payload: `name, phone, district_id=27 (Pune), consent_given=true, consent_version=1.0, preferred_language hi, preferred_channel whatsapp`
**Expected:** `201` → `{ "id":"<uuid>", "identity_status":"canonical" }` → redirect to `/consent/<id>`. Save `traineeId`.

### Step 2 — Consent [0:45-1:15]

**UI:** `http://localhost:3000/consent/<traineeId>` → toggle consent v1.0 → Save.
**API:**
```powershell
curl -X PUT http://localhost:3001/api/v1/trainees/<traineeId>/consent -H "Authorization: Bearer <traineeToken>" -H "Content-Type: application/json" -d "{\"consent_given\":true,\"consent_version\":\"1.0\"}"
```
**Expected:** `200` `{ consent_given:true, consent_version:"1.0" }`. Shows privacy badge.

### Step 3 — Dedup confirm [1:15-1:50]

**UI:** `http://localhost:3000/identity/<traineeId>` → merge candidates table → **Confirm** (or Reject to demo false-positive).
**API:**
```powershell
curl -X POST http://localhost:3001/api/v1/trainees/match -H "Authorization: Bearer <adminToken>" -d "{}"
curl http://localhost:3001/api/v1/trainees/<traineeId>/merge-candidates -H "Authorization: Bearer <traineeToken>"
curl -X POST http://localhost:3001/api/v1/identity-matches/<matchId>/confirm -H "Authorization: Bearer <traineeToken>"
```
**Expected:** `GET merge-candidates` → `[ { status:"proposed" } ]` or `[]` if no dupe (seed has 0 dupes for new trainee). Confirm → `200` `identity_status: canonical`, audit logged. Explain: phone/location change survives via `contact-update` + `re-link`.

### Step 4 — Survey <60s [1:50-2:40] · hi/mr/en toggle

**UI:** `http://localhost:3000/survey/<followUpId>` → toggle `hi` → answer 2 Qs → Submit. Timer shows <60s.
**API:**
```powershell
curl http://localhost:3001/api/v1/follow-ups/pending -H "Authorization: Bearer <traineeToken>"
curl -X POST http://localhost:3001/api/v1/follow-ups/<followUpId>/respond -H "Authorization: Bearer <traineeToken>" -H "Content-Type: application/json" -d "{\"responses\":{\"working\":\"yes\",\"same_employer\":true},\"non_placement_reason\":null,\"response_time_seconds\":45}"
```
**Expected:** `201` `{ status:"responded", response_time_seconds:45 }` (<60s pass) → employment signal created if `working:yes`. Demo: `unreachable` at `http://localhost:3002/dashboard` updates if `failed`.

### Step 5 — Employer confirm → 85 HIGH [2:40-3:40]

**Core innovation.** Show confidence breakdown `20 self + 40 employer + 15 salary_slip + 10 bank = 85 HIGH (≥80)` from `backend/src/modules/verification/confidence-score.service.ts:54`.

**UI:** `http://localhost:3002/login` as `employer@sois.in` → `http://localhost:3002/employer/<employerId>` → pending table → check `salary slip` + `bank statement` evidence → **Confirm** → badge flips to **HIGH 85%**.

**API (exact E2E — same as `scripts/demo-phase4-verify.ps1`):**
```powershell
# login admin + trainee, create employer, employment=20, verify, 2 evidences, employer confirm=85
powershell -ExecutionPolicy Bypass -File scripts/demo-phase4-verify.ps1
# manual curl chain:
curl -X POST http://localhost:3001/api/v1/employment -H "Authorization: Bearer <traineeToken>" -H "Content-Type: application/json" -d "{\"trainee_id\":\"<traineeId>\",\"employer_id\":\"<employerId>\",\"job_role\":\"Solar Technician\",\"employment_type\":\"full_time\",\"current_salary\":18000}"
# → 201 confidence_score=20 level=LOW
curl -X POST http://localhost:3001/api/v1/employment/<employmentId>/verify -H "Authorization: Bearer <adminToken>"
curl -X POST http://localhost:3001/api/v1/employment/<employmentId>/evidence -H "Authorization: Bearer <adminToken>" -H "Content-Type: application/json" -d "{\"evidence_type\":\"salary_slip\",\"evidence_data\":{\"file\":\"demo-slip.pdf\"}}"
curl -X POST http://localhost:3001/api/v1/employment/<employmentId>/evidence -H "Authorization: Bearer <adminToken>" -H "Content-Type: application/json" -d "{\"evidence_type\":\"bank_statement\",\"evidence_data\":{\"file\":\"demo-bank.pdf\"}}"
curl -X POST http://localhost:3001/api/v1/employers/<employerId>/verify-employment -H "Authorization: Bearer <adminToken>" -H "Content-Type: application/json" -d "{\"employment_id\":\"<employmentId>\",\"decision\":\"confirm\",\"still_employed\":true,\"job_relevant\":true}"
```
**Expected:** final `200` `{ "confidence_score":85, "level":"HIGH", "verification_status":"employer_confirmed", "breakdown":{ total:85, level:"HIGH" } }` → `ConfidenceBadge.tsx` shows **HIGH 85%**. Math: `20(self)+40(employer)+15(salary_slip)+10(bank)=85 cap100`.

### Step 6 — Gov dashboard: retention / wage / skill-gap [3:40-5:00]

**UI:** `http://localhost:3002/login` as `gov@mh.gov.in` / `gov123456` → `http://localhost:3002/dashboard`.

**Check in order (<30s question: "which courses produce best outcomes?"):**
1. **KPIs:** `trained / certified / verified_employed / unemployed / unreachable` (seed 50/50/20/30/5 mix)
2. **Retention:** `RetentionChart.tsx` `3m/6m/12m/24m` (from `employment/follow-up` tables)
3. **Wage:** `WageChart.tsx` `start/m6/m12` progression
4. **District:** `http://localhost:3002/dashboard/district/27` (Pune) vs `2` Mumbai vs `1` Nagpur
5. **Ranking:** `http://localhost:3002/dashboard/ranking` sortable providers
6. **Skill gaps:** `http://localhost:3002/dashboard/skill-gaps` → 5 Maharashtra gaps (Automation Testing, Tally/GST, CRM, First Aid/CPR, Digital Route Planning)

**API (gov/admin only, RBAC proof):**
```powershell
curl http://localhost:3001/api/v1/analytics/dashboard -H "Authorization: Bearer <govToken>"
# → 200 { trained, certified, verified_employed, retention:{3m,6m,12m,24m}, wage_progression:{start,m6,m12} }
curl http://localhost:3001/api/v1/analytics/dashboard -H "Authorization: Bearer <traineeToken>"
# → 403 Forbidden (trainee blocked)
```
**Expected:** gov/admin `200` with Pune/Mumbai/Nagpur KPIs, non-empty arrays (seed `prisma db seed` 6 providers, 50 trainees, 20 employment 20-87, 30 follow-ups, 5 gaps). Trainee/employer `403`.

---

**If UI slow, run backend E2E fallback:** `scripts/demo-phase4-verify.ps1` prints `PASS: employer verify-employment score=85 level=HIGH` and `math=20+40+15+10=85`. Then jump to Step 6 dashboard.

**Teardown:** `docker compose down` (keeps volumes) or `docker compose down -v` fresh reseeding.
