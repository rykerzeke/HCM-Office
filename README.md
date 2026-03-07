# HCM Office

A full-stack **Minister Portal** for citizen case intake, triage, scheduling, and assignment—built as a multi-app monorepo with a clear separation between API, classic SPA, and an optional Next.js BFF.

---

## Overview

The system supports end-to-end workflows: citizens submit requests → office staff review and authorize → meetings are scheduled and assigned → post-meeting outcomes are recorded. It includes:

- **Backend API** — Fastify + Prisma, JWT auth, case lifecycle, assignments, file uploads
- **Admin frontend** — React + Vite SPA talking to the API (login, cases, dashboards)
- **Next.js BFF** (optional) — App Router + Server Actions that proxy to the API and use Drizzle for UI-local data

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Users (browser)                                                        │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│  React + Vite        │            │  Next.js BFF         │
│  (frontend)         │            │  (next-app)          │
│  Port 5173          │            │  Port 3000           │
└──────────┬──────────┘            └──────────┬───────────┘
           │                                  │
           │  VITE_API_URL                    │  Server Actions
           │  (REST)                          │  → BACKEND_API_URL
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Fastify API (backend) — Port 4000                                      │
│  Auth · Cases · Assignments · Uploads · Prisma → PostgreSQL              │
└─────────────────────────────────────────────────────────────────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐            ┌─────────────────────┐
│  PostgreSQL          │            │  PostgreSQL          │
│  (Prisma — core DB)  │            │  (Drizzle — BFF-only │
│  Supabase / Neon     │            │   e.g. example table)│
└─────────────────────┘            └─────────────────────┘
```

**Design choices:**

- **Single source of truth:** Core domain (cases, citizens, users, assignments) lives in the Fastify backend and Prisma. No duplicate business logic in the BFF.
- **BFF as orchestrator:** The Next.js app calls the Fastify API for case/triage/assignment flows and uses Drizzle only for auxiliary, UI-owned tables (e.g. saved filters, preferences).
- **Two frontends:** The React SPA is the main admin UI; the Next.js BFF is an alternative entry point with Server Actions and can be deployed independently (e.g. Vercel).

---

## Tech stack

| Layer        | Tech |
|-------------|------|
| **Backend** | Node.js, Fastify, Prisma, PostgreSQL (Supabase/Neon), JWT, bcrypt, multipart uploads |
| **Frontend**| React 18, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind, Recharts |
| **BFF**     | Next.js 16 (App Router), Server Actions, Drizzle ORM, postgres.js |

---

## Repository structure

```
HCM-Office/
├── minister-portal/
│   ├── backend/          # Fastify API (Prisma, routes, auth, uploads)
│   ├── frontend/         # React + Vite admin SPA
│   ├── next-app/         # Next.js BFF (Server Actions, Drizzle)
│   ├── DEPLOYMENT.md     # Local setup + production (Render, Vercel, next-app)
│   └── architecture-explainer.html
├── README.md             # This file
└── ...
```

Each app has its own `package.json`, `.env` (or `.env.local`), and run scripts. See [minister-portal/DEPLOYMENT.md](minister-portal/DEPLOYMENT.md) for setup and deployment.

---

## Quick start

**Prerequisites:** Node.js 18+, PostgreSQL (e.g. Supabase).

1. **Backend**
   ```bash
   cd minister-portal/backend
   cp .env.example .env    # set DATABASE_URL, DIRECT_URL, JWT_SECRET, ENCRYPTION_KEY, CORS_ORIGIN
   npm install
   npx prisma generate && npx prisma migrate deploy
   npx ts-node prisma/seed.ts
   npm run dev             # → http://localhost:4000
   ```

2. **Frontend**
   ```bash
   cd minister-portal/frontend
   # Create .env with VITE_API_URL=http://localhost:4000/api
   npm install
   npm run dev             # → http://localhost:5173
   ```
   Demo login: `admin@portal.gov` / `admin123` (if seed was run).

3. **Next.js BFF** (optional)
   ```bash
   cd minister-portal/next-app
   cp .env.local.example .env.local   # BACKEND_API_URL, DATABASE_URL
   npm install
   npm run db:generate && npm run db:migrate
   npm run dev             # → http://localhost:3000
   ```

Full details, env vars, and production deployment (Render, Vercel): **[minister-portal/DEPLOYMENT.md](minister-portal/DEPLOYMENT.md)**.

---

## Documentation

| Document | Description |
|----------|-------------|
| [minister-portal/DEPLOYMENT.md](minister-portal/DEPLOYMENT.md) | Local setup, env vars, production deploy (backend, frontend, next-app) |
| [minister-portal/next-app/README.md](minister-portal/next-app/README.md) | BFF architecture, Drizzle, Server Actions, pages |

---

## Architecture & code notes

- **Clear boundaries:** Backend owns all core domain logic and data; the BFF does not reimplement it. That keeps one source of truth and avoids Prisma/Drizzle schema drift.
- **Typed API contract:** The Next.js BFF uses a shared HTTP client and TypeScript types that mirror Fastify responses (`types/backend.ts`), so the contract is explicit and easier to maintain.
- **Security:** Auth is centralized in Fastify (JWT); the BFF forwards the cookie. Env files (`.env`, `.env.local`) are gitignored; docs use placeholders (`[ref]`, `YOUR-PASSWORD`) so no real credentials are committed.
- **Scalability:** You can run only the React frontend + backend, or add the Next.js BFF for a different UX (e.g. server-rendered pages, Server Actions). The backend stays the same.
- **Operational clarity:** Deployment docs spell out Render (backend), Vercel (frontend/BFF), CORS, and Drizzle migrations, so production setup is repeatable.

---

## License

Proprietary / see repository settings.
