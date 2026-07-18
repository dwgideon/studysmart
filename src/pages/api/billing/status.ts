import type { NextApiRequest, NextApiResponse } from "next";
import { getAiEntitlement } from "@/lib/aiCredits";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
    select: {
      id: true,
      accountRole: true,
      ageGroup: true,
      stripeCustomerId: true,
      subscriptionsPaid: {
        where: { status: { in: ["active", "trialing", "past_due"] } },
        select: { id: true },
      },
      guardianLinks: {
        where: { status: "ACTIVE" },
        select: {
          student: {
            select: {
              id: true,
              name: true,
              learnerProfile: { select: { gradeLevel: true } },
            },
          },
        },
      },
    },
  });
  const selfPurchaseAllowed = user.accountRole === "STUDENT" && user.ageGroup === "ADULT";
  const learnerIds = user.accountRole === "GUARDIAN"
    ? user.guardianLinks.map((link) => link.student.id)
    : [user.id];
  const entitlements = await Promise.all(learnerIds.map(async (userId) => ({
    userId,
    ...(await getAiEntitlement(userId)),
  })));
  return res.status(200).json({
    canPurchase: selfPurchaseAllowed || (user.accountRole === "GUARDIAN" && learnerIds.length > 0),
    purchaseRequiresGuardian: user.accountRole === "STUDENT" && !selfPurchaseAllowed,
    canManageBilling: Boolean(user.stripeCustomerId && user.subscriptionsPaid.length),
    learners: user.accountRole === "GUARDIAN"
      ? user.guardianLinks.map((link) => ({
          id: link.student.id,
          name: link.student.name ?? "Learner",
          gradeLevel: link.student.learnerProfile?.gradeLevel ?? null,
          entitlement: entitlements.find((item) => item.userId === link.student.id),
        }))
      : [{ id: user.id, name: "My account", gradeLevel: null, entitlement: entitlements[0] }],
  });
}

export default withApiMonitoring("api.billing.status", handler);
