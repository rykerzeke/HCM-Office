# New Fastify Route

Scaffold a new backend route file following the HCM-Office conventions.

**Usage:** `/new-route <feature-name>`

## Instructions

Create a new route file at `minister-portal/backend/src/routes/<feature-name>.ts` following these exact patterns:

### File Structure
```typescript
import { FastifyInstance } from 'fastify'
import { prisma } from '../data/prisma'
import { authenticate } from '../middleware/authenticate'
import { z } from 'zod/v4'
import { logAudit } from '../services/audit'

const auth = [authenticate]

export default async function <featureName>Routes(fastify: FastifyInstance) {
  // GET list with pagination
  fastify.get('/<feature-plural>', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const { page = '1', limit = '10', search = '' } = request.query as any
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const take = parseInt(limit)

      const where = search
        ? { /* add relevant search filter */ }
        : {}

      const [items, total] = await Promise.all([
        prisma.<model>.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { /* relevant relations */ }
        }),
        prisma.<model>.count({ where })
      ])

      return reply.send({
        data: items,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to fetch <feature-plural>', details: err.message })
    }
  })

  // GET single by id
  fastify.get('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const item = await prisma.<model>.findUnique({
        where: { id },
        include: { /* relevant relations */ }
      })
      if (!item) return reply.status(404).send({ error: '<Feature> not found' })
      return reply.send(item)
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to fetch <feature>', details: err.message })
    }
  })

  // POST create
  fastify.post('/<feature-plural>', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const schema = z.object({
        // define fields here
      })
      const data = schema.parse(request.body)

      const item = await prisma.<model>.create({
        data: { ...data, /* userId: user.id if needed */ }
      })

      await logAudit('CREATE_<FEATURE>', { itemId: item.id }, undefined, user.id)
      return reply.status(201).send(item)
    } catch (err: any) {
      if (err.name === 'ZodError') return reply.status(400).send({ error: 'Validation failed', details: err.errors })
      return reply.status(500).send({ error: 'Failed to create <feature>', details: err.message })
    }
  })

  // PUT update
  fastify.put('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const { id } = request.params as any
      const schema = z.object({
        // define updatable fields here
      })
      const data = schema.parse(request.body)

      const item = await prisma.<model>.update({
        where: { id },
        data
      })

      await logAudit('UPDATE_<FEATURE>', { itemId: id, changes: data }, undefined, user.id)
      return reply.send(item)
    } catch (err: any) {
      if (err.name === 'ZodError') return reply.status(400).send({ error: 'Validation failed', details: err.errors })
      return reply.status(500).send({ error: 'Failed to update <feature>', details: err.message })
    }
  })

  // DELETE
  fastify.delete('/<feature-plural>/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const user = request.user as any
      const { id } = request.params as any
      await prisma.<model>.delete({ where: { id } })
      await logAudit('DELETE_<FEATURE>', { itemId: id }, undefined, user.id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to delete <feature>', details: err.message })
    }
  })
}
```

### After creating the file, register the route in `minister-portal/backend/src/index.ts`:
```typescript
import <featureName>Routes from './routes/<feature-name>'
// Add inside the server setup:
server.register(<featureName>Routes, { prefix: '/api' })
```

### Rules
- Always use `const auth = [authenticate]` and `{ preValidation: auth }` for protected routes
- Always use `request.user as any` to access JWT user
- Always use `try/catch` with descriptive error messages
- Always call `logAudit()` on create/update/delete
- Zod errors return 400, internal errors return 500
- Pagination always returns `{ data, meta: { total, page, limit, totalPages } }`
- Use `Promise.all` for concurrent list + count queries
- Import `z` from `'zod/v4'`
