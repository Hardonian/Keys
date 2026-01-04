/**
 * Type definitions for Stripe Webhook Entitlement Key
 */

export interface StripeWebhookConfig {
  stripeSecretKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

export interface EntitlementResult {
  hasAccess: boolean;
  subscriptionId?: string;
  features?: string[];
  error?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      customer?: string;
      status?: string;
      items?: {
        data: Array<{
          price: {
            metadata?: {
              features?: string;
            };
          };
        }>;
      };
    };
  };
}
