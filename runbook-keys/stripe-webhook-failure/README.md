# Stripe Webhook Failure Runbook

## Scope

This runbook covers:
- Stripe webhook endpoint returning 500 errors
- Stripe webhook signature verification failures
- Stripe webhook events not being processed
- Webhook delivery failures shown in Stripe dashboard
- Subscription updates not reflecting in application

This runbook does NOT cover:
- Stripe API failures (see: Stripe API Failure Runbook)
- Stripe subscription creation failures (see: Subscription Creation Failure Runbook)
- Stripe payment processing failures (see: Payment Processing Failure Runbook)
- Webhook endpoint unreachable (see: Service Outage Runbook)
- Database connection failures affecting webhooks (see: Database Connection Failure Runbook)

---

## When to Use This Runbook

Use this runbook when:
- Stripe dashboard shows webhook delivery failures
- Application logs show "Stripe webhook signature verification failed"
- Alert: "stripe_webhook_failure_rate > 5%"
- Users report subscription updates not reflecting in app
- Monitoring shows webhook endpoint returning 500 errors
- Webhook endpoint health check fails

---

## When NOT to Use This Runbook

Do NOT use this runbook for:
- Stripe API calls failing (use: Stripe API Failure Runbook)
- Subscription creation failing (use: Subscription Creation Failure Runbook)
- Payment processing failing (use: Payment Processing Failure Runbook)
- Webhook endpoint unreachable (use: Service Outage Runbook)
- Database connection failures (use: Database Connection Failure Runbook)

If you're unsure, start with this runbook's diagnosis flow.

---

## Immediate Safety Checks (First 2 Minutes)

**DO THESE FIRST:**

1. **Check if webhook endpoint is responding**
   ```bash
   curl -X POST https://your-app.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
   - If returns 500: Continue with this runbook
   - If returns 404: Check deployment (use: Deployment Failure Runbook)
   - If returns 200: Issue may be resolved, verify with Stripe dashboard

2. **Verify environment variables are set**
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   echo $STRIPE_SECRET_KEY
   ```
   - If empty: Set immediately (see: Environment Configuration Runbook)
   - If set: Continue

3. **Check recent deployments**
   - If deployed in last 15 minutes: Consider rollback
   - If no recent deployments: Continue with diagnosis

4. **Check Stripe dashboard for webhook status**
   - Navigate: Stripe Dashboard → Developers → Webhooks → [Your Endpoint]
   - Check: Recent delivery status
   - If all recent deliveries failed: Continue with diagnosis
   - If some succeeded: Issue may be intermittent

**DO NOT:**
- Restart services without checking logs first
- Change webhook secret without verifying current value
- Disable webhooks entirely (breaks subscription updates)
- Make configuration changes without documenting them

---

## Diagnosis Flow

### Step 1: Check Webhook Endpoint Health

**Action**: Verify endpoint is responding

```bash
curl -X POST https://your-app.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

**Expected**: 200 OK or 401 Unauthorized (signature required)

**If 500 Error**:
- Check application logs (see: Log Analysis Jupyter KEY)
- Check database connectivity (see: Database Health Check Runbook)
- Continue to Step 2

**If 200 OK**:
- Issue may be intermittent
- Check Stripe dashboard for recent failures
- If failures exist, continue to Step 2

**If 404 Error**:
- Endpoint not deployed or misconfigured
- See: Deployment Failure Runbook

---

### Step 2: Verify Webhook Secret

**Action**: Compare configured secret with Stripe dashboard

```bash
# Get configured secret (from environment)
echo $STRIPE_WEBHOOK_SECRET

# Compare with Stripe Dashboard:
# Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Signing secret
```

**Expected**: Secrets match exactly

**If Mismatch**:
- Update secret in environment
- Restart application
- Verify webhook delivery resumes
- **STOP HERE** - Issue resolved

**If Match**:
- Continue to Step 3

---

### Step 3: Analyze Recent Webhook Events

**Action**: Use Jupyter KEY to analyze webhook event patterns

- **KEY**: `jupyter-webhook-event-analysis`
- **Input**: Last 24 hours of webhook logs (export from Stripe dashboard)
- **Review**: Failure patterns, error types, timing

**Steps**:
1. Export webhook logs from Stripe dashboard:
   - Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Export logs
   - Save as: `webhook_logs_$(date +%Y%m%d).csv`

2. Run Jupyter KEY:
   - Open: `/jupyter-keys/webhook-event-analysis/webhook-event-analysis.ipynb`
   - Input: `webhook_logs_YYYYMMDD.csv`
   - Execute all cells

3. Review output:
   - Delivery success rate (should be > 95%)
   - Failure patterns (which events fail most)
   - Timing patterns (when failures occur)
   - Error types (signature, timeout, processing)

**Expected**: Clear pattern of failures

**If Pattern Found**:
- Follow pattern-specific resolution steps
- Document pattern for future prevention

**If No Pattern**:
- Continue to Step 4

---

### Step 4: Check Application Logs

**Action**: Review application logs for webhook processing errors

```bash
# Filter logs for webhook errors
grep -i "webhook" /var/log/app.log | tail -100

# Or use log aggregation tool
# Filter: endpoint="/api/webhooks/stripe" AND status=500
```

**Expected**: Specific error messages

**If Database Errors**:
- See: Database Connection Failure Runbook

**If Signature Errors**:
- See: Webhook Signature Verification Runbook

**If Processing Errors**:
- Continue to Step 5

**If No Errors Found**:
- Check if logs are being written
- Verify log level is set correctly
- Continue to Step 5

---

### Step 5: Test Webhook Processing

**Action**: Send test webhook event

```bash
# Use Stripe CLI to send test event
stripe trigger payment_intent.succeeded \
  --override webhook-endpoint-url=https://your-app.com/api/webhooks/stripe
```

**Expected**: Event processed successfully

**If Fails**:
- Check error message
- Follow error-specific resolution steps
- See Action Steps section

**If Succeeds**:
- Issue may be resolved
- Monitor for recurrence
- **STOP HERE** - Issue resolved

---

## Action Steps

### Action 1: Update Webhook Secret (REVERSIBLE)

**Precondition**: Verified secret mismatch in Step 2

**Action**:
```bash
# 1. Get new secret from Stripe Dashboard
# Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Reveal signing secret

# 2. Update environment variable
export STRIPE_WEBHOOK_SECRET="whsec_new_secret_here"

# 3. Update in your environment configuration
# For Vercel: Vercel Dashboard → Settings → Environment Variables
# For Railway: Railway Dashboard → Variables
# For local: .env.local file

# 4. Restart application
pm2 restart app
# OR
systemctl restart your-app
# OR (Vercel)
# Redeploy automatically triggers restart
```

**Expected**: Webhook endpoint accepts new signatures

**Verification**:
```bash
# Send test webhook
stripe trigger payment_intent.succeeded \
  --override webhook-endpoint-url=https://your-app.com/api/webhooks/stripe

# Check logs for successful processing
tail -f /var/log/app.log | grep "webhook.*processed"
```

**Rollback**: Restore previous secret if issue persists

---

### Action 2: Replay Failed Webhook Events (REVERSIBLE)

**Precondition**: Identified failed events in Step 3

**Automated (Preferred)**:
- **KEY**: `node-stripe-webhook-replay`
- **Location**: `/node-keys/stripe-webhook-replay/src/index.ts`

**Execution**:
```typescript
import { replayFailedWebhooks } from '@/node-keys/stripe-webhook-replay/src';

// Replay events from last 24 hours
await replayFailedWebhooks({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endpoint: '/api/webhooks/stripe',
  dryRun: false, // Set to true to preview without executing
});
```

**Manual Alternative (If Automation Fails)**:
```bash
# 1. Get failed events from Stripe Dashboard
# Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Failed events

# 2. Replay each event manually
stripe events resend evt_1234567890
stripe events resend evt_0987654321
# ... repeat for each failed event ...

# 3. Verify events were processed
# Check application logs for successful processing
tail -f /var/log/app.log | grep "webhook.*processed"
```

**Expected**: Failed events are replayed and processed

**Verification**: Check Stripe dashboard for successful deliveries

**Rollback**: Events are idempotent, no rollback needed

---

### Action 3: Restart Webhook Processing Service (REVERSIBLE)

**Precondition**: Identified service hang or memory leak

**Action**:
```bash
# Graceful restart
pm2 restart app
# OR
systemctl restart your-app

# Wait for service to be healthy
sleep 10
curl https://your-app.com/health
```

**Expected**: Service restarts and webhooks resume

**Verification**: Monitor webhook delivery in Stripe dashboard

**Rollback**: Service restart is reversible (can restart again if needed)

---

### Action 4: Fix Webhook Processing Code (REVERSIBLE)

**Precondition**: Identified code bug in Step 4

**Action**:
1. Review error logs to identify bug
2. Fix code issue
3. Test locally with Stripe CLI
4. Deploy fix
5. Verify webhook processing resumes

**Expected**: Webhook processing works correctly

**Verification**: Send test webhook and verify processing

**Rollback**: Revert code change and redeploy

---

### Action 5: Disable Webhook Endpoint (IRREVERSIBLE - USE WITH CAUTION)

**Precondition**: All other actions failed, service is unstable

**Warning**: This will stop all subscription updates. Use only as last resort.

**Action**:
```bash
# Comment out webhook route temporarily
# File: app/api/webhooks/stripe/route.ts
# Comment: export const POST = stripeWebhookHandler;

# Redeploy
git commit -m "Temporarily disable webhook endpoint"
git push
```

**Expected**: Webhook endpoint returns 404

**Verification**: Stripe dashboard shows endpoint unreachable

**Rollback**: Uncomment route and redeploy immediately after fixing root cause

---

## Verification

### Immediate Verification (Within 5 Minutes)

1. **Check Webhook Endpoint Health**
   ```bash
   curl -X POST https://your-app.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"type": "test"}'
   ```
   **Success**: Returns 200 OK or 401 Unauthorized (not 500)

2. **Send Test Webhook**
   ```bash
   stripe trigger payment_intent.succeeded \
     --override webhook-endpoint-url=https://your-app.com/api/webhooks/stripe
   ```
   **Success**: Event processed successfully, no errors in logs

3. **Check Stripe Dashboard**
   - Navigate: Stripe Dashboard → Developers → Webhooks → [Your Endpoint]
   - **Success**: Recent deliveries show "Succeeded" status

### Ongoing Verification (Next 1 Hour)

1. **Monitor Webhook Delivery Rate**
   - Check: Stripe Dashboard → Webhooks → Delivery rate
   - **Success**: Delivery rate > 95%

2. **Monitor Application Logs**
   ```bash
   tail -f /var/log/app.log | grep "webhook"
   ```
   **Success**: No 500 errors, all events processed

3. **Check Error Rate**
   - Monitoring dashboard: `stripe_webhook_error_rate`
   - **Success**: Error rate < 1%

4. **Check Duplicate & Latency Dashboards**
   - Monitoring dashboard: `stripe_webhook_duplicates_rate` (based on `Stripe webhook duplicate` log events)
   - Monitoring dashboard: `stripe_webhook_latency_p95` (based on `Stripe webhook processed` latencyMs)
   - **Success**: Duplicate rate < 2%, p95 latency < 2s

### Final Verification (After 24 Hours)

1. **Review Webhook Delivery Report**
   - Use: `jupyter-webhook-delivery-report` KEY
   - **Success**: All events delivered successfully

2. **Verify Subscription Updates**
   - Check: User subscriptions match Stripe subscriptions
   - **Success**: No discrepancies

3. **Check Alert Status**
   - **Success**: No webhook-related alerts firing

4. **Confirm Alerts for New Metrics**
   - Alert: `stripe_webhook_duplicate_rate > 5% for 10m`
   - Alert: `stripe_webhook_latency_p95 > 3000ms for 10m`
   - **Success**: Alerts configured and not firing

---

## Rollback / Escalation

### When to Rollback

Rollback if:
- Actions made the situation worse
- Error rate increased after actions
- Service became unavailable
- Data corruption detected

### Rollback Procedures

**If Action 1 (Secret Update) Made Things Worse**:
```bash
# Restore previous secret
export STRIPE_WEBHOOK_SECRET="whsec_previous_secret"
pm2 restart app
```

**If Action 2 (Replay) Caused Issues**:
- Replayed events are idempotent, but check for duplicates
- Review: `jupyter-webhook-duplicate-detection` KEY

**If Action 3 (Restart) Made Things Worse**:
- Check service logs for startup errors
- See: Service Startup Failure Runbook

**If Action 4 (Code Fix) Made Things Worse**:
```bash
# Revert code change
git revert HEAD
git push
```

**If Action 5 (Disable) Was Applied**:
```bash
# Re-enable webhook endpoint immediately
# Uncomment route and redeploy
git revert HEAD
git push
```

### When to Escalate

Escalate if:
- All actions failed
- Issue persists after 30 minutes
- Data corruption detected
- Security incident suspected
- Service is completely unavailable

### Escalation Contacts

**On-Call Engineer**: [Contact Info]  
**Engineering Lead**: [Contact Info]  
**Stripe Support**: https://support.stripe.com (for Stripe-specific issues)

### Escalation Information to Provide

When escalating, provide:
1. Runbook used: Stripe Webhook Failure Runbook
2. Actions taken: [List actions attempted]
3. Current state: [Service status, error messages]
4. Evidence: [Logs, monitoring screenshots, Jupyter KEY outputs]
5. Impact: [Number of affected users, severity]

---

## Evidence & Audit Notes

### Required Audit Trail Entries

Record the following in your incident log:

1. **Incident Start Time**: [Timestamp]
2. **Trigger**: [Alert name, error message, user report]
3. **Initial Symptoms**: [What was observed]
4. **Diagnosis Steps Taken**: [List steps from Diagnosis Flow]
5. **Root Cause**: [What caused the issue]
6. **Actions Taken**: [List actions from Action Steps]
7. **Resolution Time**: [Timestamp]
8. **Verification Results**: [Results from Verification section]

### Artifacts to Save

Save these artifacts for post-incident review:

1. **Application Logs**
   ```bash
   # Export logs from incident timeframe
   grep "webhook" /var/log/app.log \
     --after-context=10 \
     --before-context=10 \
     > incident_logs_$(date +%Y%m%d_%H%M%S).txt
   ```

2. **Stripe Dashboard Screenshots**
   - Webhook delivery failures
   - Event timeline
   - Error messages

3. **Jupyter KEY Outputs**
   - Webhook event analysis results
   - Failure pattern analysis
   - Delivery report

4. **Monitoring Dashboards**
   - Error rate graphs
   - Response time graphs
   - Service health metrics

### Compliance Relevance

**SOC 2**: This incident affects availability and security controls.  
**PCI-DSS**: Webhook failures may affect payment processing audit trail.  
**GDPR**: Subscription updates affect user data accuracy.

**Required Actions**:
- Document incident in compliance log
- Review webhook processing for data accuracy
- Verify no PII was exposed in error logs

---

## Post-Incident Follow-Ups

### Within 24 Hours

1. **Post-Incident Review Meeting**
   - Review timeline of events
   - Identify root cause
   - Discuss prevention measures
   - Update runbook if needed

2. **Update Monitoring**
   - Add alert for webhook failure rate > 5%
   - Add alert for webhook secret mismatch
   - Add dashboard for webhook health

3. **Document Lessons Learned**
   - Update this runbook with any new findings
   - Document any new failure patterns
   - Share with team

### Within 1 Week

1. **Implement Preventative Measures**
   - Review: `node-webhook-health-check` KEY
   - Set up automated webhook secret rotation
   - Add webhook replay capability

2. **Update Documentation**
   - Update deployment docs with webhook secret management
   - Update onboarding docs with webhook troubleshooting
   - Update architecture docs with webhook failure modes

3. **Review Related KEYS**
   - `jupyter-webhook-event-analysis`: Improve analysis patterns
   - `node-stripe-webhook-replay`: Enhance replay capabilities
   - `node-webhook-monitoring`: Add monitoring coverage

### Related Preventative KEYS

- **Jupyter KEYS**:
  - `jupyter-webhook-event-analysis`: Analyze webhook patterns
  - `jupyter-webhook-delivery-report`: Generate delivery reports

- **Node / Next KEYS**:
  - `node-webhook-health-check`: Automated health checks
  - `node-stripe-webhook-replay`: Automated replay capability
  - `node-webhook-monitoring`: Enhanced monitoring

- **Other Runbook KEYS**:
  - Stripe API Failure Runbook
  - Database Connection Failure Runbook
  - Service Outage Runbook
