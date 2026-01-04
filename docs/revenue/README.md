# KEYS Revenue Engine — Documentation Index

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Complete revenue system documentation

---

## Overview

This directory contains comprehensive documentation for the KEYS revenue engine. The revenue system supports:
- Individual KEY purchases
- Bundles (starter / operator / pro)
- Subscription tier (catalog access)
- Upgrade paths with credit
- Revocation and renewal correctness

---

## Documentation Structure

### Core Revenue Documentation

1. **[PRICING_MODEL.md](./PRICING_MODEL.md)**
   - SKU catalog (individual KEYS, bundles, subscriptions)
   - Pricing tiers and justification
   - Value framework
   - Revenue leakage prevention

2. **[STRIPE_SETUP.md](./STRIPE_SETUP.md)**
   - Stripe product/price creation
   - Checkout session configuration
   - Customer management
   - Test vs live mode handling

3. **[WEBHOOK_FLOW.md](./WEBHOOK_FLOW.md)**
   - Webhook event handling
   - Idempotency implementation
   - Error handling
   - Replay safety

4. **[ENTITLEMENTS.md](./ENTITLEMENTS.md)**
   - Entitlement types and rules
   - Access enforcement
   - Revocation logic
   - Security considerations

5. **[UPGRADES.md](./UPGRADES.md)**
   - Upgrade paths (KEY → Bundle → Subscription)
   - Credit calculation
   - Fairness rules
   - Audit trail

6. **[ANALYTICS.md](./ANALYTICS.md)**
   - Revenue tracking
   - Conversion metrics
   - Churn tracking
   - Privacy considerations

7. **[QA_MATRIX.md](./QA_MATRIX.md)**
   - Test scenarios
   - Verification checklist
   - Known limitations

8. **[VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md)**
   - System verification
   - What was tested
   - What passed
   - Sales readiness assessment

---

## Sales Documentation

See `/docs/sales/` directory:

1. **[PROOF_PACK.md](../sales/PROOF_PACK.md)**
   - Value justification
   - ROI examples
   - Risk reduction
   - Time saved

2. **[ENABLEMENT.md](../sales/ENABLEMENT.md)**
   - Sales pitch
   - Objection handling
   - Buyer personas
   - Conversation flow

---

## Quick Reference

### Revenue Principles

1. **Access is granted only by server-verified entitlement**
2. **UI reflects entitlement; it never defines it**
3. **Stripe is the source of truth for payment events**
4. **KEYS is the source of truth for access state**
5. **Revocation must work as reliably as granting**
6. **Pricing must be explainable to a buyer in one sentence**

### Key Endpoints

- `POST /billing/checkout` — Create checkout session
- `POST /billing/webhook` — Stripe webhook handler
- `GET /billing/portal` — Customer portal
- `GET /marketplace/keys/:slug/download` — Download KEY (requires entitlement)
- `GET /marketplace/entitlements` — List user entitlements

### Database Tables

- `marketplace_keys` — KEY catalog
- `marketplace_bundles` — Bundle definitions
- `marketplace_entitlements` — User/org entitlements
- `marketplace_bundle_entitlements` — Bundle purchases
- `stripe_webhook_events` — Webhook idempotency
- `upgrade_transactions` — Upgrade audit trail
- `marketplace_analytics` — Revenue analytics

---

## Implementation Status

### ✅ Complete

- Pricing model
- Stripe integration
- Webhook processing (all events)
- Entitlement system
- Upgrade logic
- Cancellation & refunds
- Sales materials
- Analytics tracking
- QA matrix

### 🔄 Future Enhancements

- Retry mechanism for failed entitlement grants
- More sophisticated credit calculation
- Auto-grant job for new KEYS to subscribers
- Usage metering
- Trial periods

---

## Getting Started

### For Developers

1. Read [PRICING_MODEL.md](./PRICING_MODEL.md) to understand pricing structure
2. Read [STRIPE_SETUP.md](./STRIPE_SETUP.md) to configure Stripe
3. Read [WEBHOOK_FLOW.md](./WEBHOOK_FLOW.md) to understand webhook processing
4. Read [ENTITLEMENTS.md](./ENTITLEMENTS.md) to understand access enforcement

### For Sales

1. Read [PROOF_PACK.md](../sales/PROOF_PACK.md) for value justification
2. Read [ENABLEMENT.md](../sales/ENABLEMENT.md) for sales conversation guide
3. Use [PRICING_MODEL.md](./PRICING_MODEL.md) for pricing details

### For QA

1. Read [QA_MATRIX.md](./QA_MATRIX.md) for test scenarios
2. Read [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) for verification status

---

## Support

For questions or issues:
- Review relevant documentation above
- Check [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) for known limitations
- Review code in `/backend/src/routes/billing.ts` and `/backend/src/lib/marketplace/`

---

## Version History

- **1.0.0** (2024-12-30): Initial revenue engine documentation
