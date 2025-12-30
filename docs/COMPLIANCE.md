# Compliance & Data Protection

**Last Updated:** 2024-12-30  
**Status:** Production-ready with documented policies

## GDPR Compliance

### Data Subject Rights

We support the following GDPR rights:

1. **Right to Access**
   - Users can view all their data via the dashboard
   - Data export functionality available
   - **Implementation:** `GET /profiles/{userId}` endpoint

2. **Right to Rectification**
   - Users can update their profile data
   - **Implementation:** `PATCH /profiles/{userId}` endpoint

3. **Right to Erasure (Right to be Forgotten)**
   - Users can request account deletion
   - **Implementation:** `DELETE /profiles/{userId}` endpoint
   - **Process:** All user data is deleted within 30 days

4. **Right to Data Portability**
   - Users can export their data
   - **Implementation:** `GET /profiles/{userId}/export` endpoint
   - **Format:** JSON export of all user data

5. **Right to Object**
   - Users can opt-out of marketing communications
   - **Implementation:** Profile settings allow disabling marketing emails

### Data Processing Legal Basis

- **Contract Performance:** Processing necessary for service delivery
- **Legitimate Interest:** Analytics and service improvement
- **Consent:** Marketing communications (opt-in)

### Data Retention

- **Active Users:** Data retained while account is active
- **Inactive Users:** Data retained for 2 years after last activity
- **Deleted Users:** Data purged within 30 days of deletion request
- **Audit Logs:** Retained for 1 year (legal requirement)
- **Billing Records:** Retained for 7 years (tax requirement)

### Data Minimization

- We only collect data necessary for service delivery
- No unnecessary PII collection
- Data is scrubbed from logs and error messages

### Data Protection Measures

- **Encryption in Transit:** HTTPS/TLS for all connections
- **Encryption at Rest:** Database encryption via Supabase
- **Access Controls:** Row-Level Security (RLS) policies
- **Audit Logging:** All admin actions logged
- **Regular Backups:** Daily automated backups

## Data Processing Agreement (DPA)

### For Enterprise Customers

We provide a Data Processing Agreement covering:

- Data processing scope
- Security measures
- Sub-processors (Supabase, Stripe)
- Data breach notification procedures
- Data retention and deletion

**Contact:** [To be defined for enterprise sales]

## Data Breach Notification

### Procedure

1. **Detection:** Monitor logs and error tracking
2. **Assessment:** Determine scope and impact
3. **Containment:** Immediate action to prevent further access
4. **Notification:** 
   - Affected users notified within 72 hours
   - Relevant authorities notified if required
5. **Documentation:** All incidents logged and reviewed

### Contact for Breach Reports

- **Email:** [To be defined]
- **Response Time:** Within 24 hours

## Sub-processors

We use the following sub-processors:

1. **Supabase** (Database & Auth)
   - **Purpose:** Data storage and authentication
   - **Location:** US/EU (configurable)
   - **DPA:** Available via Supabase

2. **Stripe** (Payment Processing)
   - **Purpose:** Payment processing
   - **Location:** US
   - **DPA:** Available via Stripe

3. **Vercel** (Hosting)
   - **Purpose:** Application hosting
   - **Location:** Global CDN
   - **DPA:** Available via Vercel

## International Data Transfers

- Data may be transferred to sub-processors in different jurisdictions
- We ensure adequate safeguards (DPAs, Standard Contractual Clauses)
- EU users can request data processing in EU region

## Privacy Policy

Our privacy policy covers:

- What data we collect
- How we use data
- Data sharing practices
- User rights
- Contact information

**Location:** `/privacy` (to be implemented)

## Cookie Policy

We use:

- **Essential Cookies:** Session management, authentication
- **Analytics Cookies:** Optional, user consent required
- **No Third-Party Tracking:** Without explicit consent

## Children's Privacy

- Service is not intended for users under 16
- We do not knowingly collect data from children
- If discovered, data will be deleted immediately

## Changes to This Policy

- Policy changes will be communicated via email
- Significant changes require explicit consent
- Version history maintained

---

**Note:** This compliance documentation is accurate as of the last update date. For specific compliance questions, contact [To be defined].
