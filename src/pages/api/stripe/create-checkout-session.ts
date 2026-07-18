import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaidPlanKey, PLAN_CATALOG, stripePriceMap } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

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
    const priceKey = req.body?.priceKey;
    const price = isPaidPlanKey(priceKey) ? stripePriceMap()[priceKey] : undefined;
    if (!isPaidPlanKey(priceKey) || typeof price !== "string" || !price.startsWith("price_")) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }
    if (!authUser.email) {
      return res.status(409).json({ error: "A verified account email is required for billing." });
    }

    const account = await prisma.user.findUniqueOrThrow({ where: { id: authUser.id } });
    const requestedBeneficiaryId = typeof req.body?.beneficiaryUserId === "string"
      ? req.body.beneficiaryUserId
      : authUser.id;
    let beneficiaryId = authUser.id;
    if (requestedBeneficiaryId !== authUser.id) {
      if (account.accountRole !== "GUARDIAN") {
        return res.status(403).json({ error: "Only a connected guardian can purchase for another learner." });
      }
      const link = await prisma.guardianStudent.findFirst({
        where: {
          guardianId: authUser.id,
          studentId: requestedBeneficiaryId,
          status: "ACTIVE",
          student: { accountRole: "STUDENT" },
        },
        select: { studentId: true },
      });
      if (!link) {return res.status(403).json({ error: "That learner is not connected to this guardian account." });}
      beneficiaryId = link.studentId;
    } else if (account.accountRole === "STUDENT" && account.ageGroup !== "ADULT") {
      return res.status(403).json({
        error: "A connected parent or guardian must manage paid plans for learners under 18.",
      });
    }
    const existing = await prisma.billingSubscription.findFirst({
      where: {
        beneficiaryUserId: beneficiaryId,
        status: { in: ["active", "trialing"] },
      },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "This learner already has an active plan. Manage it from billing instead." });
    }
    const stripePrice = await stripe.prices.retrieve(price);
    const expected = PLAN_CATALOG[priceKey];
    if (
      !stripePrice.active ||
      stripePrice.currency !== "usd" ||
      stripePrice.unit_amount !== expected.monthlyPriceCents ||
      stripePrice.recurring?.interval !== "month"
    ) {
      return res.status(503).json({ error: "This plan is temporarily unavailable because billing configuration needs attention." });
    }
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
      client_reference_id: authUser.id,
      metadata: {
        app_user_id: authUser.id,
        beneficiary_user_id: beneficiaryId,
        plan_key: priceKey,
      },
      subscription_data: {
        metadata: {
          app_user_id: authUser.id,
          beneficiary_user_id: beneficiaryId,
          plan_key: priceKey,
        },
      },
    });
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: "The payment provider could not create a checkout session." });
  }
}

export default withApiMonitoring("api.stripe.checkout", handler);
