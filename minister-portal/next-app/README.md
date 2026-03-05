# Minister Portal — Next.js BFF

Backend-for-Frontend layer using **Next.js App Router**, **Server Actions**, and **Drizzle ORM**.

## Architecture

- **Fastify backend** (`minister-portal/backend`) remains the system of record for core
  entities: cases, citizens, assignments, users, audit logs, etc.
- **This Next.js app** acts as a BFF:
  - Server Actions call the Fastify API for all case/triage/assignment workflows.
  - Drizzle + Supabase is used **only** for the `example` table and any future
    UI-local auxiliary tables (saved filters, preferences, etc.).
- If a new table represents **core HCM domain data**, add it in Fastify/Prisma instead.
  Drizzle is reserved for frontend-owned concerns.

## Setup

```bash
cd minister-portal/next-app
npm install
```

Copy and fill in `.env.local`:

```bash
cp .env.local.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `BACKEND_API_URL` | Fastify API base URL (e.g. `http://localhost:4000/api`) |
| `DATABASE_URL` | Supabase Postgres connection string (for Drizzle tables only) |

## Drizzle migrations

Generate and apply migrations for Drizzle-owned tables:

```bash
npm run db:generate
npm run db:migrate
```

## Development

```bash
npm run dev
```

Make sure the Fastify backend is also running (`cd ../backend && npm run dev`).

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — links to cases and examples |
| `/login` | Login form (authenticates via Fastify, stores JWT cookie) |
| `/cases` | Paginated case list (calls Fastify) |
| `/cases/[id]` | Case detail with triage/assignment action panels |
| `/examples` | Drizzle CRUD playground (direct DB, no Fastify) |

## Helpful links

- [Supabase Docs](https://supabase.com)
- [Drizzle Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle with Supabase Quickstart](https://orm.drizzle.team/learn/tutorials/drizzle-with-supabase)
