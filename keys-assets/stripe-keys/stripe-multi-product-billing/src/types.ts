export interface MultiProductSubscriptionOptions {
  customerId: string;
  products: Array<{
    priceId: string;
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
}
