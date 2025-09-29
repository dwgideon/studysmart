import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const fullSession = session.line_items
          ? session
          : await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });

        const appUserId = session.metadata?.app_user_id || null;
        const stripeCustomerId = session.customer;
        const customerEmail = session.customer_details?.email || session.customer_email || null;

        const purchasedPriceId = fullSession?.line_items?.data?.[0]?.price?.id || null;

        const subscriptionId = session.subscription;
        let status = 'active';
        let current_period_end = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = sub.status || 'active';
          current_period_end = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
        }

        await supabaseAdmin.from('profiles').upsert(
          {
            id: appUserId,  // matches auth.users.id
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            subscription_price_id: purchasedPriceId,
            subscription_status: status,
            current_period_end,
          },
          { onConflict: 'id' }
        );
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const stripeCustomerId = sub.customer;
        const purchasedPriceId = sub.items?.data?.[0]?.price?.id || null;
        const status = sub.status;
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
        // Ignore other events for now
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).end();
  }
}

