# System Prompts - Cursor Companion - Backend

## Background Event Loop Service

The background event loop service monitors external events (Shopify webhooks, Supabase schema changes) and generates proactive suggestions for users.

### Architecture

1. **Webhook Endpoints** (`/webhooks/shopify`, `/webhooks/supabase`)
   - Receive real-time webhooks from external services
   - Verify signatures and store events
   - Trigger async processing

2. **Polling Service** (`backgroundEventLoop.ts`)
   - Polls external services as fallback if webhooks aren't configured
   - Runs on configurable intervals (default: 1 minute)
   - Supports multiple users with separate loops

3. **Event Processing** (`eventProcessor.ts`)
   - Determines if events warrant suggestions
   - Generates proactive suggestions using prompt assembly
   - Logs agent runs and updates events

### Setup

1. **Environment Variables**
   ```env
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Shopify Webhook Configuration**
   - In Shopify Admin, go to Settings > Notifications > Webhooks
   - Create webhook: `POST https://your-domain.com/webhooks/shopify`
   - Subscribe to events:
     - `products/create`
     - `products/update`
     - `collections/create`
     - `orders/create`
     - `inventory_levels/update`

3. **Supabase Webhook Configuration**
   - Configure Supabase webhooks to POST to `/webhooks/supabase`
   - Or rely on polling for schema changes

4. **Start Background Loops**
   ```typescript
   import { backgroundEventLoop } from './services/backgroundEventLoop';
   
   // Start for specific user
   await backgroundEventLoop.start('user-id');
   
   // Or start for all users
   await backgroundEventLoop.startForAllUsers();
   ```

### API Endpoints

#### POST /webhooks/shopify
Receives Shopify webhooks. Verifies HMAC signature and processes events.

**Headers:**
- `X-Shopify-Hmac-Sha256`: Webhook signature
- `X-Shopify-Topic`: Event topic (e.g., `products/create`)
- `X-Shopify-Shop-Domain`: Shop domain

#### POST /webhooks/supabase
Receives Supabase database webhooks.

**Body:**
```json
{
  "event_type": "INSERT",
  "table": "products",
  "record": { ... },
  "old_record": null
}
```

### Event Types

**Shopify Events:**
- `shopify.product.created`
- `shopify.product.updated`
- `shopify.collection.created`
- `shopify.inventory.low`
- `shopify.order.created`

**Supabase Events:**
- `supabase.schema.changed`
- `supabase.table.created`
- `supabase.column.added`
- `supabase.column.updated`

### Monitoring

Events are stored in the `background_events` table with:
- `event_type`: Type of event
- `source`: Source system (shopify, supabase, etc.)
- `event_data`: Full event payload
- `suggestion_generated`: Whether a suggestion was created
- `suggestion_id`: Reference to agent_run if suggestion was generated
- `user_actioned`: Whether user acted on the suggestion
