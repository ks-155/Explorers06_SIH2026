# SOIS Backend API

NestJS + Prisma + PostgreSQL backend for the **Skilling Outcomes Intelligence System (SOIS)** — PS ID 26135, Govt of Maharashtra.

Owned by **Member 5 (Database + API)**.

## Requirements

- Node.js 18+ (tested on v24)
- PostgreSQL 16 (via `docker compose up -d postgres` or local)
- Redis (optional for follow-up queue later)

## Setup

```bash
npm install
cp .env.example .env        # set DATABASE_URL
npx prisma generate         # generate Prisma client
npx prisma migrate dev      # apply migrations (creates all 11 tables)
npx prisma db seed          # seed demo users
```

## Run

```bash
npm run start:dev           # watch mode → http://localhost:3001
```

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /api/v1/health` | Health check (incl. DB connectivity) — public |
| `POST /api/v1/auth/login` | JWT login — public |
| `GET /api/v1` | Root banner — public |
| `GET /docs` | Swagger / OpenAPI docs |

Full endpoint contract: see **`../API-CONTRACT.md`** (frozen in Phase 1).

## Scripts

```bash
npm run prisma:generate   # regenerate client
npm run prisma:migrate    # create + apply a migration in dev
npm run prisma:deploy     # apply migrations in production/CI
npm run prisma:seed       # seed demo data
npm run prisma:studio     # browse the DB in a GUI
```

## Architecture

- **JWT + RBAC:** global `JwtAuthGuard` + `RolesGuard`. 5 roles: `trainee`, `employer`, `provider`, `government`, `admin`. Public routes use the `@Public()` decorator.
- **Privacy:** aggregate analytics guarded to `government`/`admin` only.
- **Audit:** every create/update → `audit_log`.

## Scopes added per phase

- **Phase 1 (this branch):** scaffold, schema (11 tables), auth, RBAC, Swagger, `/health`, frozen API contract.
- Phase 2+: trainees, identity, follow-ups, employment, analytics, seed (see `MEMBER-5-IMPLEMENTATION-PLAN.md`).
