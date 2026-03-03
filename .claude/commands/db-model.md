# New Prisma Model

Add a new database model following the HCM-Office Prisma conventions.

**Usage:** `/db-model <ModelName> [description of the model and its fields]`

## Instructions

Modify `minister-portal/backend/prisma/schema.prisma` to add the new model, then run the migration.

### Model Conventions

**Naming:**
- Model name: `PascalCase` (e.g., `StakeholderMapping`, `AuditLog`)
- Field names: `camelCase` (e.g., `citizenId`, `createdAt`, `updatedAt`)
- Enum names: `PascalCase` (e.g., `CaseStatus`, `Priority`)
- Enum values: `SCREAMING_SNAKE_CASE` (e.g., `PENDING_APPROVAL`, `IN_PROGRESS`)

**Standard Fields (include on every model):**
```prisma
id        String   @id @default(cuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Relation Fields Pattern:**
```prisma
// On the "many" side — always include both the FK and the relation
userId    String
user      User     @relation(fields: [userId], references: [id])

caseId    String?
case      Case?    @relation(fields: [caseId], references: [id])
```

**On the "one" side — always add the back-relation:**
```prisma
// In the User model:
<ModelName>s  <ModelName>[]
```

### Example Model Template
```prisma
model <ModelName> {
  id          String        @id @default(cuid())
  // --- Enum field example ---
  status      <StatusEnum>  @default(ACTIVE)
  // --- String fields ---
  name        String
  description String?
  // --- Numeric fields ---
  count       Int           @default(0)
  amount      Decimal?      @db.Decimal(10, 2)
  // --- Boolean fields ---
  isActive    Boolean       @default(true)
  // --- Relations ---
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  caseId      String?
  case        Case?         @relation(fields: [caseId], references: [id])
  // --- Timestamps ---
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("<model_name>s")  // optional: explicit table name in snake_case plural
}
```

### Example Enum Template
```prisma
enum <EnumName> {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### Steps After Editing Schema

1. **Add the model** to `schema.prisma`
2. **Add back-relations** to any referenced models (User, Case, Citizen, etc.)
3. **Run migration:**
   ```bash
   cd minister-portal/backend
   npx prisma migrate dev --name add_<model_name>
   ```
4. **Regenerate Prisma client** (happens automatically with migrate dev):
   ```bash
   npx prisma generate
   ```
5. **Seed data if needed** — edit `prisma/seed.ts`

### Relation Patterns in Use (for reference)

```prisma
// Case has many of these:
//   comments, files, assignments, stakeholders, auditLogs, communications

// User has many of these:
//   assignments, comments, auditLogs

// Citizen is linked to Case:
//   citizen  Citizen  @relation(...)
```

### Rules
- Always include `id`, `createdAt`, `updatedAt` on every model
- Use `cuid()` for IDs (matches existing models)
- Nullable relations use `String?` and `<Model>?`
- Required relations use `String` and `<Model>`
- Always add `@updatedAt` to `updatedAt` field
- Use `@default(now())` for `createdAt`
- Enum values are always `SCREAMING_SNAKE_CASE`
- Model names are always `PascalCase` singular
- After schema changes, ALWAYS run `prisma migrate dev` — never `prisma db push` in production
- Check if back-relations are needed in referenced models and add them
