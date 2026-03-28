import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    })
  }

  return stripeClient
}

export function getPlanPriceId(plan: 'pro' | 'elite') {
  return plan === 'elite' ? process.env.STRIPE_ELITE_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID
}
