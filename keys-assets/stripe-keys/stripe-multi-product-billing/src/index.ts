/**
 * Stripe Keys: Multi-Product Billing
 * 
 * Multi-product subscription management with complex pricing models,
 * usage-based billing, and revenue recognition.
 */

export {
  createMultiProductSubscription,
  updateSubscriptionProducts,
  addProductToSubscription,
  removeProductFromSubscription,
} from './handlers/multi-product.js';

export type {
  MultiProductSubscriptionOptions,
} from './types.js';
