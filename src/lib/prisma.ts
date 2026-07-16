import { Prisma, PrismaClient } from "@prisma/client";

const RETRYABLE_DATABASE_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

function runtimeDatabaseUrl() {
  const configured = process.env.DATABASE_URL;
  if (!configured) {return undefined;}
  try {
    const url = new URL(configured);
    if (!url.searchParams.has("connection_limit")) {
      // Each Next.js process gets its own Prisma pool. A single connection per
      // process avoids exhausting or churning Supabase/PgBouncer connections.
      url.searchParams.set("connection_limit", "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    return url.toString();
  } catch {
    return configured;
  }
}

function isRetryableDatabaseError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    RETRYABLE_DATABASE_CODES.has(error.code);
}

const createPrismaClient = (): PrismaClient => (
  new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: runtimeDatabaseUrl(),
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error) {
            if (!isRetryableDatabaseError(error)) {throw error;}
            await new Promise((resolve) => setTimeout(resolve, 150));
            return query(args);
          }
        }
      },
    },
  }) as unknown as PrismaClient
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
