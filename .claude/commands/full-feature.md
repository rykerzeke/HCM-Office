# Full-Stack Feature Scaffold

Scaffold a complete end-to-end feature — Prisma model, Fastify route, API service, and React page — all wired together.

**Usage:** `/full-feature <FeatureName> [describe what this feature manages]`

## Instructions

Use this skill to build a complete feature from database to UI. Follow each step in order.

---

## Step 1 — Database Model

Add to `minister-portal/backend/prisma/schema.prisma`:

```prisma
model <FeatureName> {
  id          String   @id @default(cuid())
  // Add relevant fields based on the description
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Then run:
```bash
cd minister-portal/backend && npx prisma migrate dev --name add_<feature_name>
```

---

## Step 2 — Fastify Route

Create `minister-portal/backend/src/routes/<feature-name>.ts`:

```typescript
import { FastifyInstance } from 'fastify'
import { prisma } from '../data/prisma'
import { authenticate } from '../middleware/authenticate'
import { z } from 'zod/v4'
import { logAudit } from '../services/audit'

const auth = [authenticate]

export default async function <featureName>Routes(fastify: FastifyInstance) {
  fastify.get('/<feature-plural>', { preValidation: auth }, async (request, reply) => {
    try {
      const { page = '1', limit = '10', search = '' } = request.query as any
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const take = parseInt(limit)
      const where = search ? { /* search filter */ } : {}

      const [items, total] = await Promise.all([
        prisma.<featureName>.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
        prisma.<featureName>.count({ where })
      ])

      return reply.send({ data: items, meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to fetch', details: err.message })
    }
  })

  fastify.get('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const item = await prisma.<featureName>.findUnique({ where: { id } })
      if (!item) return reply.status(404).send({ error: 'Not found' })
      return reply.send(item)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to fetch', details: err.message })
    }
  })

  fastify.post('/<feature-plural>', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const schema = z.object({ /* fields */ })
      const data = schema.parse(request.body)
      const item = await prisma.<featureName>.create({ data })
      await logAudit('CREATE_<FEATURE>', { id: item.id }, undefined, user.id)
      return reply.status(201).send(item)
    } catch (err: any) {
      if (err.name === 'ZodError') return reply.status(400).send({ error: 'Validation failed', details: err.errors })
      return reply.status(500).send({ error: 'Failed to create', details: err.message })
    }
  })

  fastify.put('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const { id } = request.params as any
      const schema = z.object({ /* updatable fields */ })
      const data = schema.parse(request.body)
      const item = await prisma.<featureName>.update({ where: { id }, data })
      await logAudit('UPDATE_<FEATURE>', { id, changes: data }, undefined, user.id)
      return reply.send(item)
    } catch (err: any) {
      if (err.name === 'ZodError') return reply.status(400).send({ error: 'Validation failed', details: err.errors })
      return reply.status(500).send({ error: 'Failed to update', details: err.message })
    }
  })

  fastify.delete('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const { id } = request.params as any
      await prisma.<featureName>.delete({ where: { id } })
      await logAudit('DELETE_<FEATURE>', { id }, undefined, user.id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to delete', details: err.message })
    }
  })
}
```

Register in `minister-portal/backend/src/index.ts`:
```typescript
import <featureName>Routes from './routes/<feature-name>'
server.register(<featureName>Routes, { prefix: '/api' })
```

---

## Step 3 — Frontend API Service

Add to `minister-portal/frontend/src/services/api.ts`:

```typescript
// <FeatureName> API
export const <featureName>Api = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/<feature-plural>', { params }),
  get: (id: string) =>
    api.get(`/<feature-plural>/${id}`),
  create: (data: Create<FeatureName>Input) =>
    api.post('/<feature-plural>', data),
  update: (id: string, data: Partial<Create<FeatureName>Input>) =>
    api.put(`/<feature-plural>/${id}`, data),
  delete: (id: string) =>
    api.delete(`/<feature-plural>/${id}`)
}
```

---

## Step 4 — React List Page

Create `minister-portal/frontend/src/pages/<FeatureName>ListPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { <featureName>Api } from '../services/api'
import { Icons } from '../components/icons'

export const <FeatureName>ListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['<feature-plural>', page, search],
    queryFn: () => <featureName>Api.list({ page, limit: 10, search }).then(r => r.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white"><FeatureName>s</h1>
        <button
          onClick={() => navigate('/<feature-plural>/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors text-sm font-medium"
        >
          <Icons.Add className="w-4 h-4" /> New <FeatureName>
        </button>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {!data?.data?.length ? (
          <div className="p-12 text-center">
            <Icons.Document className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No <feature-plural> found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.data.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/<feature-plural>/${item.id}`)}>
                <div>
                  <p className="text-sm font-medium text-white">{item.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.meta?.totalPages > 1 && (
        <div className="flex items-center justify-between glass rounded-2xl p-4">
          <p className="text-sm text-slate-400">Total: {data.meta.total}</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl glass hover:bg-white/10 disabled:opacity-40 transition-colors">
              <Icons.ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-sm text-slate-300">{page} / {data.meta.totalPages}</span>
            <button disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl glass hover:bg-white/10 disabled:opacity-40 transition-colors">
              <Icons.ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Step 5 — Wire Up Routes

In `minister-portal/frontend/src/App.tsx`, add inside `<ProtectedRoute>`:
```tsx
import { <FeatureName>ListPage } from './pages/<FeatureName>ListPage'

<Route path="/<feature-plural>" element={<<FeatureName>ListPage />} />
```

Add a nav link in `minister-portal/frontend/src/components/Layout.tsx` if this is a top-level section.

---

## Checklist

- [ ] Prisma model added and migration run
- [ ] Backend route file created with full CRUD
- [ ] Route registered in `index.ts`
- [ ] API service helpers added to `api.ts`
- [ ] List page created with search + pagination
- [ ] Route registered in `App.tsx`
- [ ] Nav link added if needed (Layout.tsx)
- [ ] TypeScript types are accurate (no `any` where avoidable)
- [ ] All mutations call `logAudit()`
- [ ] Zod validation covers all required fields
