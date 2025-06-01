
import Stripe from 'https://esm.sh/stripe@12.18.0';

export async function createStripeSession(
  stripe: Stripe,
  worksheetId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  console.log('Creating Stripe checkout session for worksheet:', worksheetId.substring(0, 8) + '...');

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    allow_promotion_codes: true, // Enable discount codes including 1CENT
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Worksheet Export Access',
            description: 'One-time payment for downloading HTML version of your worksheet',
          },
          unit_amount: 100, // $1.00 in cents
        },
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      worksheetId,
      userId,
    },
    // Enable customer email collection in Stripe
    customer_creation: 'always',
    billing_address_collection: 'auto',
  });
}
