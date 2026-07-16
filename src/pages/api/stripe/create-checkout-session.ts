import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_ID_STARTER ?? process.env.PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO ?? process.env.PRICE_PRO,
  unlimited: process.env.STRIPE_PRICE_ID_UNLIMITED ?? process.env.PRICE_UNLIMITED,
} as const;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}

  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("PASTE_NEW")) {
      return res.status(503).json({ error: "Payments are not configured." });
    }
    const priceKey = req.body?.priceKey as keyof typeof PRICE_MAP | undefined;
    const price = priceKey ? PRICE_MAP[priceKey] : undefined;
    if (!priceKey || typeof price !== "string" || !price.startsWith("price_")) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }
    if (!authUser.email) {
      return res.status(409).json({ error: "A verified account email is required for billing." });
    }

    const account = await prisma.user.findUniqueOrThrow({ where: { id: authUser.id } });
    let customerId = account.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: authUser.email, limit: 1 });
      customerId = existing.data[0]?.id;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authUser.email,
        metadata: { app_user_id: authUser.id },
      });
      customerId = customer.id;
    }
    if (account.stripeCustomerId !== customerId) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
    if (!siteUrl) {return res.status(503).json({ error: "The payment return URL is not configured." });}
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl.replace(/\/$/, "")}/?status=success`,
      cancel_url: `${siteUrl.replace(/\/$/, "")}/pricing?status=cancel`,
      metadata: { app_user_id: authUser.id, plan_key: priceKey },
    });
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: "The payment provider could not create a checkout session." });
  }
}

export default withApiMonitoring("api.stripe.checkout", handler);
