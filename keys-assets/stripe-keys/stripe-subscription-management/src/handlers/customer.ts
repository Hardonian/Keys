import Stripe from 'stripe';
import type { CustomerOptions } from '../types.js';
import { listSubscriptions } from './subscription.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

/**
 * Create a new customer
 */
export async function createCustomer(options: CustomerOptions): Promise<Stripe.Customer> {
  const customerData: Stripe.CustomerCreateParams = {
    email: options.email,
    metadata: options.metadata || {},
  };

  if (options.name) {
    customerData.name = options.name;
  }

  if (options.phone) {
    customerData.phone = options.phone;
  }

  if (options.paymentMethodId) {
    customerData.payment_method = options.paymentMethodId;
    customerData.invoice_settings = {
      default_payment_method: options.paymentMethodId,
    };
  }

  const customer = await stripe.customers.create(customerData);
  return customer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerOptions>
): Promise<Stripe.Customer> {
  const updateData: Stripe.CustomerUpdateParams = {};

  if (updates.email) {
    updateData.email = updates.email;
  }

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.phone !== undefined) {
    updateData.phone = updates.phone;
  }

  if (updates.metadata) {
    updateData.metadata = updates.metadata;
  }

  if (updates.paymentMethodId) {
    updateData.invoice_settings = {
      default_payment_method: updates.paymentMethodId,
    };
  }

  return await stripe.customers.update(customerId, updateData);
}

/**
 * Get a customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

/**
 * List customers with optional filters
 */
export async function listCustomers(options?: {
  email?: string;
  limit?: number;
  startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Customer>> {
  const params: Stripe.CustomerListParams = {
    limit: options?.limit || 10,
  };

  if (options?.email) {
    params.email = options.email;
  }

  if (options?.startingAfter) {
    params.starting_after = options.startingAfter;
  }

  return await stripe.customers.list(params);
}

/**
 * Get all subscriptions for a customer
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.ApiList<Stripe.Subscription>> {
  return await listSubscriptions({ customerId });
}
