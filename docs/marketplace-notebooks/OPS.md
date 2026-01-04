# Marketplace Operations Guide

**Version**: 1.0.0  
**Last Updated**: 2024-12-19

This guide covers operational procedures for managing the Notebook Pack Library marketplace.

## Prerequisites

1. **Supabase Storage Bucket**: Create `marketplace` bucket
   ```sql
   -- Run in Supabase SQL editor
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('marketplace', 'marketplace', false);
   ```

2. **Stripe Products**: Create products/prices for packs (see CONTRACT.md)

3. **Admin Access**: Ensure admin role is configured for publishing

## Publishing a New Pack

### Step 1: Prepare Assets

Ensure you have:
- Pack ZIP archive (`pack.zip`)
- Preview HTML (`preview.html`) - optional but recommended
- Cover image (`cover.png`) - optional but recommended
- Changelog (`changelog.md`) - optional

### Step 2: Upload Assets to Storage

**Via Supabase Dashboard**:
1. Go to Storage → `marketplace` bucket
2. Create folder structure: `packs/<slug>/<version>/`
3. Upload files

**Via Supabase CLI**:
```bash
supabase storage upload marketplace/packs/<slug>/<version>/pack.zip ./pack.zip
supabase storage upload marketplace/packs/<slug>/<version>/preview.html ./preview.html
supabase storage upload marketplace/packs/<slug>/<version>/cover.png ./cover.png
```

**Via API** (programmatic):
```typescript
import { uploadFile } from '@/lib/marketplace/storage';
await uploadFile(
  `packs/${slug}/${version}/pack.zip`,
  zipBuffer,
  'application/zip'
);
```

### Step 3: Generate library.json

Create or update `library.json`:

```json
{
  "version": "1.0.0",
  "generated_at": "2024-12-19T00:00:00Z",
  "packs": [
    {
      "slug": "my-pack",
      "title": "My Pack",
      "description": "Description here",
      "version": "1.0.0",
      "license_spdx": "MIT",
      "assets": {
        "zip": "pack.zip"
      }
    }
  ]
}
```

### Step 4: Validate (Dry Run)

POST to `/marketplace/admin/publish` with `dryRun: true`:

```bash
curl -X POST http://localhost:3001/marketplace/admin/publish \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "libraryJson": { /* library.json object */ },
    "dryRun": true
  }'
```

Review results for validation errors.

### Step 5: Publish

Set `dryRun: false` and publish:

```bash
curl -X POST http://localhost:3001/marketplace/admin/publish \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "libraryJson": { /* library.json object */ },
    "dryRun": false
  }'
```

### Step 6: Verify

1. **Check Listing**: `GET /marketplace/packs`
2. **Check Detail**: `GET /marketplace/packs/<slug>`
3. **Test Preview**: `GET /marketplace/packs/<slug>/preview`
4. **Test Download** (with entitlement): `POST /marketplace/packs/<slug>/download`

## Updating a Pack

### New Version

1. Upload new assets to `packs/<slug>/<new-version>/`
2. Update `library.json` with new version
3. Publish (upsert will create new version record)

### Metadata Update

1. Update `library.json` (same version)
2. Publish (upsert will update pack metadata)

## Rolling Back a Pack

### Option 1: Delete Pack (Nuclear)

```sql
DELETE FROM marketplace_packs WHERE slug = '<slug>';
-- Cascades to versions and download events
-- Entitlements remain (users keep access)
```

### Option 2: Hide Pack

```sql
UPDATE marketplace_packs 
SET preview_public = false 
WHERE slug = '<slug>';
-- Pack still exists but preview hidden
```

### Option 3: Revoke Entitlements

```sql
UPDATE marketplace_entitlements 
SET status = 'inactive' 
WHERE pack_id = (SELECT id FROM marketplace_packs WHERE slug = '<slug>');
-- Users lose access but pack remains
```

## Monitoring

### Download Analytics

Query download events:

```sql
SELECT 
  pack_id,
  COUNT(*) as download_count,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM marketplace_download_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY pack_id;
```

### Entitlement Status

```sql
SELECT 
  mp.slug,
  COUNT(me.id) as entitlement_count,
  COUNT(CASE WHEN me.status = 'active' THEN 1 END) as active_count
FROM marketplace_packs mp
LEFT JOIN marketplace_entitlements me ON mp.id = me.pack_id
GROUP BY mp.slug;
```

### Storage Usage

Check storage bucket size in Supabase Dashboard → Storage → `marketplace`.

## Troubleshooting

### Pack Not Appearing in Listing

1. Check RLS policies: `SELECT * FROM marketplace_packs WHERE slug = '<slug>';`
2. Verify pack was inserted: Check `created_at` timestamp
3. Check for validation errors in publish response

### Download Fails

1. **403 Forbidden**: User doesn't have entitlement
   - Check `marketplace_entitlements` table
   - Verify tenant context resolution

2. **500 Storage Error**: Asset missing
   - Verify file exists in storage: `SELECT * FROM storage.objects WHERE bucket_id = 'marketplace' AND name LIKE '%<slug>%';`
   - Check path matches `zip_path` in database

3. **Signed URL Generation Fails**: Storage service issue
   - Check Supabase Storage status
   - Verify service role key has storage access

### Webhook Not Granting Entitlements

1. **Check Webhook Logs**: Stripe Dashboard → Webhooks → Events
2. **Verify Metadata**: Ensure `packSlug` or `packId` in checkout session metadata
3. **Check Database**: Query `marketplace_entitlements` after webhook fires
4. **Test Manually**: Grant entitlement via SQL for testing

```sql
INSERT INTO marketplace_entitlements (
  tenant_id, tenant_type, pack_id, source, status
) VALUES (
  '<user-id>', 'user', '<pack-id>', 'manual', 'active'
);
```

## Maintenance

### Cleanup Old Versions

```sql
-- Keep only latest 3 versions per pack
WITH ranked_versions AS (
  SELECT 
    id,
    pack_id,
    version,
    ROW_NUMBER() OVER (PARTITION BY pack_id ORDER BY created_at DESC) as rn
  FROM marketplace_pack_versions
)
DELETE FROM marketplace_pack_versions
WHERE id IN (
  SELECT id FROM ranked_versions WHERE rn > 3
);
```

### Archive Download Events

```sql
-- Archive events older than 90 days
DELETE FROM marketplace_download_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Storage Cleanup

Manually delete unused assets from Supabase Storage Dashboard.

## Backup & Recovery

### Database Backup

Supabase handles automatic backups. Manual export:

```bash
pg_dump $DATABASE_URL > marketplace_backup.sql
```

### Storage Backup

Export storage bucket:

```bash
# Via Supabase CLI (if available)
supabase storage export marketplace
```

### Recovery

1. Restore database from backup
2. Re-upload storage assets if needed
3. Re-publish `library.json` to sync metadata

## Performance

### Indexes

All critical indexes are created in migration `016_create_marketplace_tables.sql`:
- `marketplace_packs.slug` (unique)
- `marketplace_entitlements(tenant_id, tenant_type, pack_id)`
- `marketplace_download_events(pack_id, created_at)`

### Query Optimization

- Use `slug` for lookups (indexed)
- Filter by `tenant_id` + `tenant_type` for entitlements
- Limit download event queries by date range

## Security Checklist

Before going live:

- [ ] RLS policies enabled and tested
- [ ] Admin publishing requires admin role
- [ ] Stripe webhook secret configured
- [ ] Storage bucket is private (not public)
- [ ] Signed URLs expire after 1 hour
- [ ] IP addresses are hashed in download events
- [ ] Rate limiting on download endpoints (TODO)

## Support

For issues:
1. Check logs: Backend logs, Supabase logs, Stripe webhook logs
2. Query database: Verify data integrity
3. Test endpoints: Use curl/Postman to isolate issues
4. Contact: [Support channel]
