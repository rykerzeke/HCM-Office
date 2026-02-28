import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance shared across the entire application.
// Prevents multiple connection pools and associated memory leaks.
const prisma = new PrismaClient();

export default prisma;
