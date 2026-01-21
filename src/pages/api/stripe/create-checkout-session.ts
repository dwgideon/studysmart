import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_ID_STARTER!,
  pro: process.env.STRIPE_PRICE_ID_PRO!,
  unlimited: process.env.STRIPE_PRICE_ID_UNLIMITED!,
} as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceKey, user } = req.body as {
      priceKey?: keyof typeof PRICE_MAP;
      user?: { id?: string; email?: string };
    };

    if (!user?.id || !user?.email) {
      return res.status(401).json({ error: 'Login required' });
    }

    if (!priceKey || !(priceKey in PRICE_MAP)) {
  return res.status(400).json({ error: "Invalid plan selected" });
}

const price = PRICE_MAP[priceKey];


if (typeof price !== 'string') {
  return res.status(400).json({ error: 'Invalid plan selected' });
}

    // Find or create Stripe customer
    const existing = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId = existing.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { app_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: customerId,
  payment_method_types: ['card'],
  line_items: [{ price, quantity: 1 }],
  allow_promotion_codes: true,
  success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?status=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?status=cancel`,
  metadata: {
    app_user_id: user.id,
    plan_key: priceKey,
  },
});


    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session error:', e);
    return res.status(500).json({ error: 'Stripe error' });
  }
}
