# SOIS Frontend Admin — Member 2 (M4 Employer + M5 Analytics)

**Port:** :3002 · **Next.js 14** · **Proxy:** `/api/v1` → `http://localhost:3001/api/v1` (next.config.mjs)

## Phase 1 (fe/2-foundation) — merged to master@c1d64cb

- Next scaffold + proxy rewrite (I1.4)
- Login for `government` + `employer` → `POST /api/v1/auth/login` → stores JWT + role
- RBAC: `government/admin` sees /dashboard, employer blocked (API-CONTRACT.md 8)
- Health: GET /api/v1/health

## Phase 2 (fe/2-employer) — idle/UI prep per WORKFLOW-FLOW.md:117 (mocked)

- Employer dashboard `/employer/[id]` — pending 5 rows via `GET /employers/:id/verify-pending` (mock)
- `VerifyCard` — Confirm/Deny + Still employed? + Job relevant? one-click <30s, ConfidenceBadge HIGH/MED/LOW
- Mocked `POST /employers/:id/verify-employment` (`VerifyEmploymentReq` frozen) — Phase 4 wires live after `Checkpoint 4.1`
- RBAC notice, timing badge `last verify: 0.3s`, responded table — `PHASE-CHECKLIST.md:102` rows 13-16 mocked

## Run

```bash
cd D:\ARCHITECTURE\Frontend_P-2\frontend-admin
npm install
npm run dev    # :3002
# needs backend :3001 running (docker-compose up backend postgres redis)
```

## API Contract

Frozen v1.0.0 — API-CONTRACT.md in repo root. Never mismatch endpoint shapes.

```
POST /api/v1/auth/login {identifier,password} -> {accessToken,refreshToken,role,userId}
GET  /api/v1/health
GET  /api/v1/employers/:id/verify-pending    (employer)
POST /api/v1/employers/:id/verify-employment {employment_id,decision,still_employed,job_relevant} (employer)
GET  /api/v1/analytics/dashboard            (government/admin only)
```

## Docker

Add to root docker-compose.yml when M6 merges:

```yaml
frontend-admin:
  build: ./frontend-admin
  ports: ["3002:3002"]
  depends_on: [backend]
```
