import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import type { Readable } from "stream";
import type Stripe from "stripe";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { isPaidPlanKey, planKeyForPriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const config = { api: { bodyParser: false } };

function buffer(readable: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

function periodEnd(subscription: Stripe.Subscription) {
  const value = (subscription as unknown as { current_period_end?: unknown }).current_period_end;
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function metadataId(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  fallback?: { payerUserId?: string | null; beneficiaryUserId?: string | null; plan?: string | null }
) {
  const priceId = subscription.items.data[0]?.price.id;
  const payerUserId = metadataId(subscription.metadata.app_user_id) ?? fallback?.payerUserId ?? null;
  const beneficiaryUserId = metadataId(subscription.metadata.beneficiary_user_id)
    ?? fallback?.beneficiaryUserId
    ?? payerUserId;
  const metadataPlan = subscription.metadata.plan_key || fallback?.plan || null;
  const plan = planKeyForPriceId(priceId) ?? (isPaidPlanKey(metadataPlan) ? metadataPlan : null);
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  if (!priceId || !payerUserId || !beneficiaryUserId || !plan) {
    throw new Error("Subscription metadata is incomplete.");
  }
  const users = await prisma.user.count({
    where: { id: { in: [...new Set([payerUserId, beneficiaryUserId])] } },
  });
  if (users !== new Set([payerUserId, beneficiaryUserId]).size) {
    throw new Error("Subscription references an unknown account.");
  }
  await prisma.billingSubscription.upsert({
    where: { id: subscription.id },
    create: {
      id: subscription.id,
      payerUserId,
      beneficiaryUserId,
      stripeCustomerId: customerId,
      priceId,
      plan,
      status: subscription.status,
      currentPeriodEnd: periodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      payerUserId,
      beneficiaryUserId,
      stripeCustomerId: customerId,
      priceId,
      plan,
      status: subscription.status,
      currentPeriodEnd: periodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
  const active = await prisma.billingSubscription.findFirst({
    where: {
      beneficiaryUserId,
      status: { in: ["active", "trialing"] },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
    orderBy: { updatedAt: "desc" },
    select: { plan: true },
  });
  await prisma.user.update({
    where: { id: beneficiaryUserId },
    data: { plan: active?.plan ?? null },
  });
}

async function processEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
    if (!subscriptionId) {return;}
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(subscription, {
      payerUserId: metadataId(session.metadata?.app_user_id),
      beneficiaryUserId: metadataId(session.metadata?.beneficiary_user_id),
      plan: session.metadata?.plan_key ?? null,
    });
    return;
  }
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }
}

async function claimEvent(event: Stripe.Event) {
  try {
    await prisma.billingWebhookEvent.create({
      data: { id: event.id, type: event.type, processingAt: new Date() },
    });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const stale = new Date(Date.now() - 10 * 60_000);
    const claimed = await prisma.billingWebhookEvent.updateMany({
      where: {
        id: event.id,
        processedAt: null,
        OR: [{ processingAt: null }, { processingAt: { lt: stale } }],
      },
      data: { processingAt: new Date(), failedAt: null },
    });
    return claimed.count === 1;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }
  const signature = Array.isArray(req.headers["stripe-signature"])
    ? req.headers["stripe-signature"][0]
    : req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature) {return res.status(400).send("Missing Stripe signature");}
  if (!secret) {return res.status(503).send("Stripe webhook is not configured");}
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await buffer(req), signature, secret);
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }
  try {
    const claimed = await claimEvent(event);
    if (!claimed) {return res.status(200).json({ received: true, duplicate: true });}
    await processEvent(event);
    await prisma.billingWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date(), processingAt: null, failedAt: null },
    });
    return res.status(200).json({ received: true });
  } catch (error) {
    await prisma.billingWebhookEvent.updateMany({
      where: { id: event.id },
      data: { failedAt: new Date(), processingAt: null },
    });
    console.error("Stripe webhook processing failed:", error instanceof Error ? error.message : "unknown");
    return res.status(500).end();
  }
}

export default withApiMonitoring("api.stripe.webhook", handler);
