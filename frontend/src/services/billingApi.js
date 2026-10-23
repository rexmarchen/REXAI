import apiClient from './apiClient'

/**
 * Fetch verified backend subscription status and entitlement details
 */
export async function fetchSubscription() {
  const res = await apiClient.get('/billing/subscription')
  return res.data
}

/**
 * Fetch plan tier catalogue
 */
export async function fetchPlans() {
  const res = await apiClient.get('/billing/plans')
  return res.data
}

/**
 * Initiates Stripe checkout for upgrade or subscription renewal
 */
export async function createCheckout({ planId, billingCycle = 'monthly', successUrl, cancelUrl }) {
  const res = await apiClient.post('/billing/checkout', {
    planId,
    billingCycle,
    successUrl,
    cancelUrl
  })
  return res.data
}

/**
 * Creates Stripe customer billing portal session to manage cards & cancellation
 */
export async function openCustomerPortal({ returnUrl } = {}) {
  const res = await apiClient.post('/billing/customer-portal', { returnUrl })
  return res.data
}

/**
 * Fetch LinkedIn automation jobs including upcoming, published, and paused_subscription
 */
export async function fetchAutomationJobs() {
  const res = await apiClient.get('/linkedin-automation/jobs')
  return res.data
}

/**
 * Reschedule paused posts after subscription renewal
 */
export async function reschedulePausedPosts() {
  const res = await apiClient.post('/linkedin-automation/reschedule-paused')
  return res.data
}

/**
 * Enable LinkedIn automation
 */
export async function enableAutomation() {
  const res = await apiClient.post('/linkedin-automation/enable')
  return res.data
}

/**
 * Disable LinkedIn automation
 */
export async function disableAutomation() {
  const res = await apiClient.post('/linkedin-automation/disable')
  return res.data
}
