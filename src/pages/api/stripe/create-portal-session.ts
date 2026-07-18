import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const account = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { stripeCustomerId: true },
  });
  if (!account?.stripeCustomerId) {
    return res.status(404).json({ error: "No billing account is connected." });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (!siteUrl) {return res.status(503).json({ error: "The billing return URL is not configured." });}
  const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
  if (!configuration) {return res.status(503).json({ error: "The billing portal is not configured." });}
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      configuration,
      return_url: `${siteUrl.replace(/\/$/, "")}/pricing`,
    });
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: "The billing portal is temporarily unavailable." });
  }
}

export default withApiMonitoring("api.stripe.portal", handler);
