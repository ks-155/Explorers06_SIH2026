# SOIS Frontend Admin — Member 2 (M4 Employer + M5 Analytics)

**Port:** :3002 · **Next.js 14** · **Proxy:** `/api/v1` → `http://localhost:3001/api/v1` (next.config.mjs)

## Phase 1 (fe/2-foundation)

- Next scaffold + proxy rewrite (I1.4)
- Login for `government` + `employer` → `POST /api/v1/auth/login` → stores JWT + role
- RBAC: `government/admin` sees /dashboard, employer blocked (API-CONTRACT.md 8)
- Health: GET /api/v1/health

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
