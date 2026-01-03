import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error('Missing Stripe signature');
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Checkout session completed:', session.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
