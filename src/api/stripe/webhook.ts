import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).send('Missing webhook signature or secret');

  const buf = await buffer(req);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Expand line_items if not present
        const fullSession = session.line_items
          ? session
          : await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });

        const appUserId = session.metadata?.app_user_id || null;
        const stripeCustomerId = session.customer as string;
        const customerEmail = session.customer_details?.email || session.customer_email || null;

        const purchasedPriceId =
          // @ts-expect-error Stripe types allow nullable
          fullSession?.line_items?.data?.[0]?.price?.id || null;

        const subscriptionId = session.subscription as string | null;
        let status = 'active';
        let current_period_end: string | null = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = (sub.status as string) || 'active';
          current_period_end = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
        }

        if (appUserId) {
          await supabaseAdmin.from('profiles').upsert(
            {
              id: appUserId,
              email: customerEmail,
              stripe_customer_id: stripeCustomerId,
              subscription_price_id: purchasedPriceId,
              subscription_status: status,
              current_period_end,
            },
            { onConflict: 'id' }
          );
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const stripeCustomerId = sub.customer as string;
        const purchasedPriceId = sub.items?.data?.[0]?.price?.id || null;
        const status = sub.status as string;
        const current_period_end = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_price_id: purchasedPriceId,
            current_period_end,
          })
          .eq('stripe_customer_id', stripeCustomerId);
        break;
      }

      default:
        // ignore other events
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).end();
  }
}

