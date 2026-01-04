/**
 * Stripe Keys: Subscription Management
 * 
 * Complete subscription lifecycle management for Stripe.
 * Unlocks subscription creation, plan management, customer management,
 * proration, upgrades/downgrades, and webhook handling.
 */

export {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscription,
  listSubscriptions,
} from './handlers/subscription.js';

export {
  createPlan,
  updatePlan,
  getPlan,
  listPlans,
  archivePlan,
} from './handlers/plan.js';

export {
  createCustomer,
  updateCustomer,
  getCustomer,
  listCustomers,
  getCustomerSubscriptions,
} from './handlers/customer.js';

export {
  handleWebhook,
  verifyWebhookSignature,
} from './handlers/webhook.js';

export type {
  SubscriptionOptions,
  PlanOptions,
  CustomerOptions,
  WebhookEvent,
} from './types.js';
