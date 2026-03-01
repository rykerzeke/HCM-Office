# 🚀 HCM Portal — Cloud Deployment Guide

**Stack:** Fastify (Node.js) backend · React + Vite frontend · PostgreSQL

---

## Architecture

```
[Browser] → [Vercel] (frontend CDN)
                ↓ API calls (HTTPS)
          [Render.com] (backend Node.js)
                ↓ Prisma ORM
            [Neon / Supabase] (PostgreSQL)
```

---

## Prerequisites

- GitHub account with this repo pushed
- Accounts on: [Neon](https://neon.tech) · [Render](https://render.com) · [Vercel](https://vercel.com) *(all free)*

---

## Step 1 — Set Up PostgreSQL Database

### Option A: Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Click **New Project** → choose a region → create
3. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Keep this for Step 2

### Option B: Supabase

1. Sign up at [supabase.com](https://supabase.com) → New Project
2. Go to **Settings → Database** → copy the **URI** connection string
3. Keep this for Step 2

---

## Step 2 — Deploy the Backend (Render)

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:

   | Field | Value |
   |---|---|
   | **Root Directory** | `minister-portal/backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy` |
   | **Start Command** | `npx ts-node src/index.ts` |
   | **Health Check Path** | `/health` |

4. Scroll down to **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | *(paste your Neon/Supabase connection string)* |
   | `JWT_SECRET` | *(generate a random 64-char string — use [this tool](https://generate-secret.vercel.app/64))* |
   | `ENCRYPTION_KEY` | *(generate a 64-char hex string — `openssl rand -hex 32` in any terminal)* |
   | `CORS_ORIGIN` | *(leave blank for now — fill in after Step 3 gives you the Vercel URL)* |
   | `UPLOADS_DIR` | `/var/data/uploads` |

5. Under **Advanced → Disks**, add:
   - Name: `uploads`
   - Mount Path: `/var/data/uploads`
   - Size: `1 GB`

6. Click **Create Web Service** → wait for first deploy (~3-5 mins)
7. Note your Render URL: `https://hcm-portal-backend.onrender.com` (or similar)
8. ✅ Verify: open `https://your-render-url.onrender.com/health` — should return `{"status":"OK"}`

> **Note:** After first deploy succeeds, run the seed script if you need initial data:
> In Render Dashboard → your service → **Shell** tab → run:
> ```bash
> npx ts-node prisma/seed.ts
> ```

---

## Step 3 — Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Configure:

   | Field | Value |
   |---|---|
   | **Root Directory** | `minister-portal/frontend` |
   | **Framework** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-render-url.onrender.com/api` *(your Render URL + /api)* |

5. Click **Deploy** → wait ~2 mins
6. Note your Vercel URL: `https://hcm-portal.vercel.app` (or similar)
7. ✅ Verify: open the URL and try logging in

---

## Step 4 — Link Backend CORS to Frontend URL

1. Go back to your **Render** dashboard → your backend service
2. Go to **Environment** → find `CORS_ORIGIN`
3. Set it to: `https://hcm-portal.vercel.app` *(your Vercel URL from Step 3)*
4. Render will **auto-redeploy** with the new variable

---

## Step 5 — Verify Everything Works

- [ ] `https://your-render-url.onrender.com/health` returns `{"status":"OK"}`
- [ ] Frontend loads at Vercel URL
- [ ] Can log in successfully
- [ ] Can create / view cases
- [ ] File uploads work (they go to Render's persistent disk)

---

## Updating Your Deployment

Every time you push to your **main branch** on GitHub:
- Render **auto-deploys the backend** ✓
- Vercel **auto-deploys the frontend** ✓

No manual steps needed after initial setup.

---

## Generating Secure Keys

```bash
# JWT_SECRET (run in any terminal with Node.js):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (must be 32 bytes = 64 hex chars):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| CORS errors in browser | Check `CORS_ORIGIN` in Render matches your exact Vercel URL (no trailing slash) |
| 500 on login | Check `JWT_SECRET` and `ENCRYPTION_KEY` are set in Render env vars |
| Database errors | Verify `DATABASE_URL` is correct and the DB allows connections from Render IPs |
| File uploads broken | Ensure `UPLOADS_DIR=/var/data/uploads` is set and disk is mounted |
| Frontend shows blank page | Open browser console; likely `VITE_API_URL` is wrong in Vercel settings |
| Render free tier sleeping | Free tier spins down after 15 min idle → first request takes ~30s to wake up |

---

## Cost Summary (Free Tier)

| Service | Cost | Limits |
|---|---|---|
| Neon (DB) | Free | 0.5 GB storage |
| Render (backend) | Free | Sleeps after 15min idle |
| Vercel (frontend) | Free | 100 GB bandwidth/mo |

To avoid Render sleeping, upgrade to the **$7/month Starter** plan.
