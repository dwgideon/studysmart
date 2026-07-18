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
  const code = error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code
    : (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && RETRYABLE_DATABASE_CODES.has(code);
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

export async function databaseTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, options);
    } catch (error) {
      if (!isRetryableDatabaseError(error) || attempt === 3) {throw error;}
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }
  throw new Error("Database transaction retry limit reached.");
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
