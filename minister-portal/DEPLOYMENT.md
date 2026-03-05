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
| `DATABASE_URL` | Supabase: `postgresql://postgres:YOUR-DB-PASSWORD@db.vqlxlfbqpdujkxugbjdf.supabase.co:5432/postgres?sslmode=require` |
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
VITE_SUPABASE_URL=https://vqlxlfbqpdujkxugbjdf.supabase.co
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
