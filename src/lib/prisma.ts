// Prisma client singleton for Next.js
// Run `npx prisma generate` after configuring DATABASE_URL in .env
// to enable this module.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any;

try {
  // Dynamic import to avoid build errors before prisma generate
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");

  const globalForPrisma = globalThis as unknown as {
    prisma: typeof PrismaClient | undefined;
  };

  prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} catch {
  // PrismaClient not generated yet — server actions will use fallback data
  prisma = null;
}

export { prisma };
