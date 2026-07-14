import type { NextApiRequest, NextApiResponse } from "next";
import type { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../../lib/stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const config = {
  api: { bodyParser: false },
};

// Helper to read raw body
function buffer(readable: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const value = (
    subscription as unknown as { current_period_end?: unknown }
  ).current_period_end;
  return typeof value === "number" ? value : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {return res.status(405).end("Method not allowed");}

  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {return res.status(400).send("Missing Stripe signature");}

  const buf = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: unknown) {
    const message = errorMessage(err);
    console.error("Webhook signature verification failed:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const fullSession =
          session.line_items
            ? session
            : await stripe.checkout.sessions.retrieve(session.id, {
                expand: ["line_items"],
              });

        const appUserId = session.metadata?.app_user_id || null;
        const stripeCustomerId = session.customer as string | null;
        const customerEmail =
          session.customer_details?.email ||
          session.customer_email ||
          null;

        const purchasedPriceId =
          fullSession?.line_items?.data?.[0]?.price?.id || null;

        const subscriptionId = session.subscription as string | null;

        let status = "active";
        let current_period_end: string | null = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = subscriptionPeriodEnd(sub);

          status = sub.status || "active";
          current_period_end = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null;
        }

        await supabaseAdmin.from("profiles").upsert(
          {
            id: appUserId,
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            subscription_price_id: purchasedPriceId,
            subscription_status: status,
            current_period_end,
          },
          { onConflict: "id" }
        );

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const purchasedPriceId =
          sub.items?.data?.[0]?.price?.id || null;

        const status = sub.status;

        const periodEnd = subscriptionPeriodEnd(sub);
        const current_period_end = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_price_id: purchasedPriceId,
            current_period_end,
          })
          .eq("stripe_customer_id", stripeCustomerId);

        break;
      }

      default:
        // Ignore other events
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).end();
  }
}
