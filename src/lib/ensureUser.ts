import { prisma } from "@/lib/prisma";

/** Ensures a Prisma User row exists for Supabase auth IDs. */
export async function ensureUser(
  userId: string,
  email?: string,
  name?: string
) {
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: email ?? `${userId}@users.local`,
      name: name ?? null,
    },
    update: {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    },
  });
}
