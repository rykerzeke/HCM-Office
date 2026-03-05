# Minister Portal — Deployment & Setup

**Stack:** Fastify (backend) · React + Vite (frontend) · PostgreSQL (Supabase / Neon).

---

## Local development (one-time setup)

### 1. Backend `.env`

In `minister-portal/backend/`, copy the example and fill in real values:

```bash
cd minister-portal/backend
cp .env.example .env
```

Edit `.env` and set:

| Variable | What to set |
|----------|-------------|
| `JWT_SECRET` | Long random string (e.g. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `ENCRYPTION_KEY` | 64 hex chars (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `DATABASE_URL` | Supabase: `postgresql://postgres:YOUR-DB-PASSWORD@db.[ref].supabase.co:5432/postgres?sslmode=require` |
| `DIRECT_URL` | Same as `DATABASE_URL` (required by Prisma for migrations/seed) |
| `CORS_ORIGIN` | `http://localhost:5173` |

**Do not commit `.env`** — it is gitignored.

### 2. Run migrations and seed

From `minister-portal/backend/`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

### 3. Frontend `.env`

In `minister-portal/frontend/`, create `.env` (or `.env.local`):

```bash
cd minister-portal/frontend
# Create .env with:
VITE_API_URL=http://localhost:4000/api
```

Optional (only if you add Supabase client features later):

```env
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

### 4. Start dev servers

- Backend: from `minister-portal/backend/` run `npm run dev` (port 4000).
- Frontend: from `minister-portal/frontend/` run `npm run dev` (port 5173).

Open `http://localhost:5173`, use **Fill demo admin credentials** then **Sign In** (`admin@portal.gov` / `admin123`).

---

## Production deployment (manual steps)

### Backend (Render)

1. **Render.com** → New → Web Service → connect this repo.
2. **Root Directory:** `minister-portal/backend`.
3. **Build:** `npm install && npx prisma generate && npx prisma migrate deploy`
4. **Start:** `npx ts-node src/index.ts` (or your production start command).
5. **Environment variables** (set in Render dashboard):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | Your Supabase (or Neon) connection string with `?sslmode=require` |
   | `DIRECT_URL` | Same as `DATABASE_URL` |
   | `JWT_SECRET` | Strong random secret (64+ chars) |
   | `ENCRYPTION_KEY` | 64 hex characters |
   | `CORS_ORIGIN` | Your frontend origin, e.g. `https://your-app.vercel.app` (no trailing slash) |
   | `UPLOADS_DIR` | `/var/data/uploads` (if you add a persistent disk) |

6. **Optional:** Add a disk (e.g. 1 GB) at `/var/data/uploads` for file uploads.
7. After first deploy, open **Shell** and run: `npx ts-node prisma/seed.ts` if you need seed data.
8. Note the backend URL (e.g. `https://minister-portal-backend.onrender.com`).

### Frontend (Vercel)

1. **Vercel.com** → New Project → import this repo.
2. **Root Directory:** `minister-portal/frontend`.
3. **Framework:** Vite. Build: `npm run build`. Output: `dist`.
4. **Environment variable:**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |

5. Deploy. Note the frontend URL (e.g. `https://minister-portal.vercel.app`).

### Link CORS

In **Render** → your backend service → Environment → set `CORS_ORIGIN` to your **exact** Vercel URL (e.g. `https://minister-portal.vercel.app`). Redeploy if needed.

---

## Summary: what you must do manually

| Task | Where | Action |
|------|--------|--------|
| Create backend `.env` | `minister-portal/backend/` | Copy `.env.example` → `.env`, set `JWT_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGIN` |
| Create frontend `.env` | `minister-portal/frontend/` | Add `VITE_API_URL=http://localhost:4000/api` (and optional Supabase vars) |
| Run DB migrations | From `minister-portal/backend/` | `npx prisma migrate deploy` |
| Seed database | From `minister-portal/backend/` | `npx ts-node prisma/seed.ts` |
| Deploy backend | Render dashboard | Create Web Service, set env vars, add disk if needed, run seed in Shell once |
| Deploy frontend | Vercel dashboard | Set Root Directory, add `VITE_API_URL` |
| Set CORS | Render dashboard | Set `CORS_ORIGIN` to your Vercel URL |

All secrets (passwords, keys, `DATABASE_URL`) stay in `.env` or in the hosting dashboards — **never commit them**.

---

## Next.js BFF (next-app)

The BFF at `minister-portal/next-app` can be deployed **after** the Fastify backend is deployed. The BFF calls the backend API and uses Supabase only for Drizzle-owned tables (e.g. `example`).

### Pre-deploy checklist

1. **Backend is live** — You have a production Fastify URL (e.g. `https://minister-portal-backend.onrender.com/api`).
2. **Supabase** — You have a Postgres connection string (use the **pooled** URL for serverless: port `6543`, `?pgbouncer=true`).
3. **Drizzle migrations** — Run once (locally or in CI) so the `example` table exists:
   ```bash
   cd minister-portal/next-app
   npm install
   cp .env.local.example .env.local   # set DATABASE_URL and BACKEND_API_URL
   npm run db:generate
   npm run db:migrate
   ```

### Environment variables (production)

| Variable | Value |
|----------|--------|
| `BACKEND_API_URL` | Production Fastify API base URL, e.g. `https://minister-portal-backend.onrender.com/api` |
| `DATABASE_URL` | Supabase pooled connection string, e.g. `postgresql://postgres:PASSWORD@db.xxx.supabase.co:6543/postgres?pgbouncer=true` |

### Option A: Vercel (recommended for Next.js)

1. **Vercel** → New Project → import this repo.
2. **Root Directory:** `minister-portal/next-app`.
3. **Framework:** Next.js (auto-detected). Build: `npm run build`. No overrides needed.
4. **Environment variables:** Add `BACKEND_API_URL` and `DATABASE_URL` in the Vercel dashboard (Production).
5. **Migrations:** Run `npm run db:migrate` once (e.g. from your machine with production `DATABASE_URL`, or add a one-off build step). Vercel does not run migrations automatically.
6. Deploy. Note the BFF URL (e.g. `https://minister-portal-bff.vercel.app`).
7. **CORS:** In Render → backend service → set `CORS_ORIGIN` to this BFF URL (or include it if you have multiple origins). Redeploy backend if needed.

### Option B: Docker (self-hosted or any cloud)

1. In `minister-portal/next-app/`, add a `Dockerfile` (see example below).
2. Build: `docker build -t minister-portal-bff .`
3. Run migrations once against production DB, then start:  
   `docker run -p 3000:3000 -e BACKEND_API_URL=... -e DATABASE_URL=... minister-portal-bff`

Example `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM base AS run
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Option C: Render (Node Web Service)

1. **Render** → New → Web Service → connect repo.
2. **Root Directory:** `minister-portal/next-app`.
3. **Build:** `npm install && npm run build`
4. **Start:** `npm run start`
5. Set `BACKEND_API_URL` and `DATABASE_URL` in Environment. Run `npm run db:migrate` once (e.g. via Shell).

### Summary: next-app deployment

| Task | Action |
|------|--------|
| Run Drizzle migrations | Once, with production `DATABASE_URL` (locally or in Shell/CI) |
| Set env vars | `BACKEND_API_URL`, `DATABASE_URL` in the host (Vercel/Render/Docker) |
| Set backend CORS | Add the BFF origin to Fastify `CORS_ORIGIN` when the BFF is the main UI |
| Deploy | Use Vercel (recommended), Docker, or Render as above |
