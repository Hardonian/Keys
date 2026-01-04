# KEYS Revenue Engine — QA Matrix

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Test scenarios and verification  
**Purpose**: Document test matrix for revenue system validation

---

## Test Matrix Overview

This matrix validates:
1. Money collected correctly
2. Access granted correctly
3. Access revoked correctly
4. Upgrades charged fairly
5. Webhooks replay-safe
6. No client-only access path exists

---

## Test Scenario 1: First Purchase

### Setup
- New user (no entitlements)
- Stripe test mode
- Test card: `4242 4242 4242 4242`

### Steps
1. User browses marketplace
2. User selects KEY (`stripe-webhook-entitlement`, $149)
3. User clicks "Purchase"
4. User completes Stripe Checkout
5. Webhook `checkout.session.completed` fires
6. User redirected to success page

### Verification
- [ ] Stripe payment succeeded
- [ ] Webhook received and processed
- [ ] Entitlement created in database
- [ ] User can download KEY
- [ ] Analytics event recorded (`purchase`)

### Expected Results
- Payment: $149 charged
- Entitlement: `status='active'`, `source='stripe'`, `ends_at=null`
- Access: User can download KEY
- Analytics: `event_type='purchase'` recorded

---

## Test Scenario 2: Repeat Purchase

### Setup
- User with 1 existing entitlement
- Stripe test mode

### Steps
1. User purchases second KEY
2. Complete checkout
3. Webhook fires

### Verification
- [ ] Second entitlement created
- [ ] First entitlement unchanged
- [ ] User has access to both KEYS
- [ ] No duplicate entitlements

### Expected Results
- Two entitlements in database
- User can download both KEYS
- No duplicates (upsert logic prevents)

---

## Test Scenario 3: Bundle Upgrade

### Setup
- User owns 2 KEYS in bundle (worth $198)
- Bundle price: $399
- Expected final price: $201

### Steps
1. User views bundle
2. System calculates discount ($399 - $198 = $201)
3. User purchases bundle
4. Complete checkout
5. Webhook fires

### Verification
- [ ] Discount calculated correctly
- [ ] User charged $201 (not $399)
- [ ] All bundle KEYS granted (including owned ones)
- [ ] No duplicate entitlements for owned KEYS

### Expected Results
- Payment: $201 charged
- Entitlements: All 4 bundle KEYS granted
- Upsert: Owned KEYS not duplicated

---

## Test Scenario 4: Subscription Start

### Setup
- New user
- Subscription price: $999/year

### Steps
1. User subscribes to catalog access
2. Complete checkout
3. Webhook fires
4. User browses marketplace

### Verification
- [ ] Subscription created in Stripe
- [ ] User profile updated (`subscription_status='active'`)
- [ ] User can access all KEYS
- [ ] Subscription entitlements created

### Expected Results
- Subscription: Active in Stripe
- Profile: `subscription_status='active'`, `subscription_tier='catalog_access'`
- Access: User can download any KEY
- Entitlements: Subscription-derived entitlements created

---

## Test Scenario 5: Subscription Cancel

### Setup
- User with active subscription
- Subscription period ends: 2024-12-31

### Steps
1. User cancels subscription (via Stripe portal)
2. Webhook `customer.subscription.deleted` fires
3. Wait until period end

### Verification
- [ ] Subscription marked `canceled`
- [ ] Access continues until period end
- [ ] Access revoked after period end
- [ ] Individual KEY entitlements NOT revoked

### Expected Results
- Subscription: `status='canceled'` in database
- Access: Continues until `current_period_end`
- After period end: Subscription entitlements revoked
- Individual KEYS: Still accessible (perpetual)

---

## Test Scenario 6: Expired Payment

### Setup
- User with active subscription
- Payment method fails

### Steps
1. Stripe attempts payment
2. Payment fails
3. Webhook `invoice.payment_failed` fires (first attempt)
4. Wait 7 days (grace period)
5. Webhook fires again (after grace period)

### Verification
- [ ] First failure: Subscription marked `past_due`, access continues
- [ ] After grace period: Access revoked, subscription `inactive`
- [ ] Individual KEY entitlements NOT revoked

### Expected Results
- First failure: `subscription_status='past_due'`, access continues
- After grace: `subscription_status='inactive'`, access revoked
- Individual KEYS: Still accessible

---

## Test Scenario 7: Refund

### Setup
- User purchased KEY ($149)
- User has entitlement

### Steps
1. Admin issues refund (via Stripe Dashboard)
2. Webhook `charge.refunded` fires
3. User attempts download

### Verification
- [ ] Refund processed in Stripe
- [ ] Entitlement revoked (`status='inactive'`)
- [ ] User cannot download KEY
- [ ] Refund recorded in database

### Expected Results
- Refund: Processed in Stripe
- Entitlement: `status='inactive'`
- Access: Denied (403 error)
- Audit: Refund logged

---

## Test Scenario 8: Webhook Replay

### Setup
- User completed purchase
- Entitlement granted
- Webhook event ID: `evt_1234567890`

### Steps
1. Stripe replays webhook (same event ID)
2. Webhook handler receives duplicate event

### Verification
- [ ] Duplicate detected (event ID check)
- [ ] Event skipped (not processed again)
- [ ] Entitlement unchanged (no duplicate)
- [ ] Response: `200 OK` with `duplicate: true`

### Expected Results
- Duplicate: Detected by event ID
- Processing: Skipped
- Entitlement: Unchanged
- Response: `{ received: true, duplicate: true }`

---

## Test Scenario 9: Partial Failure

### Setup
- User purchases bundle
- Bundle contains 4 KEYS
- Database error occurs during entitlement grant (KEY 3)

### Steps
1. User completes checkout
2. Webhook fires
3. Entitlement grant fails for KEY 3
4. Other entitlements succeed

### Verification
- [ ] Error logged
- [ ] Partial entitlements granted (KEYS 1, 2, 4)
- [ ] Retry mechanism handles failure
- [ ] User notified of partial success

### Expected Results
- Entitlements: 3 of 4 granted
- Error: Logged for KEY 3
- Retry: Background job retries KEY 3
- User: Notified of partial success

---

## Test Scenario 10: Client-Only Access Attempt

### Setup
- User has no entitlements
- User attempts direct download URL

### Steps
1. User guesses download URL
2. User attempts download without entitlement

### Verification
- [ ] Download endpoint checks entitlement
- [ ] Access denied (403 error)
- [ ] No signed URL generated
- [ ] Attempt logged

### Expected Results
- Access: Denied
- Response: `403 Forbidden`
- Signed URL: Not generated
- Log: Access attempt recorded

---

## Test Scenario 11: Upgrade with Credits

### Setup
- User owns KEY A ($149) and KEY B ($49)
- Bundle contains KEY A, KEY B, KEY C ($99), KEY D ($49)
- Bundle price: $399
- Expected credits: $198
- Expected final price: $201

### Steps
1. User views bundle
2. System calculates credits
3. User purchases bundle
4. Complete checkout

### Verification
- [ ] Credits calculated correctly ($149 + $49 = $198)
- [ ] Final price correct ($399 - $198 = $201)
- [ ] User charged $201
- [ ] All KEYS granted (including owned ones)

### Expected Results
- Credits: $198
- Final price: $201
- Payment: $201 charged
- Entitlements: All 4 KEYS granted

---

## Test Scenario 12: Bundle to Subscription Upgrade

### Setup
- User owns bundles worth $598
- Subscription price: $999/year
- Max credit: 50% = $499.50
- Expected final price: $499.50

### Steps
1. User upgrades to subscription
2. System calculates bundle credits
3. User completes checkout

### Verification
- [ ] Credits calculated correctly ($598, capped at $499.50)
- [ ] Final price correct ($999 - $499.50 = $499.50)
- [ ] User charged $499.50
- [ ] Subscription activated

### Expected Results
- Credits: $499.50 (capped at 50%)
- Final price: $499.50
- Payment: $499.50 charged
- Subscription: Active

---

## Verification Checklist

### Money Collected Correctly
- [ ] First purchase charges correct amount
- [ ] Bundle purchases charge correct amount (with discounts)
- [ ] Subscription charges correct amount
- [ ] Upgrades charge correct amount (with credits)
- [ ] Refunds processed correctly

### Access Granted Correctly
- [ ] Individual KEY purchases grant access
- [ ] Bundle purchases grant access to all KEYS
- [ ] Subscriptions grant access to all KEYS
- [ ] Upgrades grant additional access
- [ ] No duplicate entitlements

### Access Revoked Correctly
- [ ] Refunds revoke access
- [ ] Subscription cancellations revoke access (after period end)
- [ ] Payment failures revoke access (after grace period)
- [ ] Individual KEY entitlements NOT revoked on subscription cancel

### Upgrades Charged Fairly
- [ ] Owned KEYS reduce bundle price
- [ ] Owned bundles reduce subscription price (capped at 50%)
- [ ] No double charging
- [ ] Credits calculated correctly

### Webhooks Replay-Safe
- [ ] Duplicate events detected
- [ ] Duplicate events skipped
- [ ] No duplicate entitlements
- [ ] Idempotent operations

### No Client-Only Access Path
- [ ] Download endpoint checks entitlement
- [ ] Signed URLs require entitlement
- [ ] No enumeration without entitlement
- [ ] No IDOR vulnerabilities

---

## Test Execution

### Manual Testing

Run each scenario manually:
1. Set up test environment
2. Execute steps
3. Verify results
4. Document outcomes

### Automated Testing

Create test suite:
```typescript
describe('Revenue Engine', () => {
  it('grants entitlement on purchase', async () => {
    // Test scenario 1
  });
  
  it('revokes entitlement on refund', async () => {
    // Test scenario 7
  });
  
  // ... more tests
});
```

---

## Known Limitations

### Current Limitations

1. **Partial Bundle Failure**: If entitlement grant fails for one KEY in bundle, other KEYS still granted (may need retry mechanism)
2. **Credit Calculation**: Bundle credits use individual KEY prices, may not match bundle discount logic
3. **Subscription Auto-Grant**: New KEYS not automatically granted to active subscribers (requires background job)

### Future Improvements

1. **Retry Mechanism**: Automatic retry for failed entitlement grants
2. **Credit Refinement**: More sophisticated credit calculation
3. **Auto-Grant Job**: Background job to grant new KEYS to subscribers

---

## Version History

- **1.0.0** (2024-12-30): Initial QA matrix
