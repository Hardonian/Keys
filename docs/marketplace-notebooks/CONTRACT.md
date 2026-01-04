# Marketplace Contract - Notebook Pack Library Integration

**Version**: 1.0.0  
**Last Updated**: 2024-12-19

This document defines the contract between the Notebook Library repository and the Keys marketplace host for publishing and serving notebook packs.

## Overview

The Notebook Library repository produces a `library.json` index file that describes available packs. Keys marketplace ingests this file and serves packs to entitled users via Stripe-gated downloads.

## library.json Schema

The `library.json` file must conform to the following structure:

```json
{
  "version": "1.0.0",
  "generated_at": "2024-12-19T00:00:00Z",
  "packs": [
    {
      "slug": "data-analysis-basics",
      "title": "Data Analysis Basics",
      "description": "A comprehensive pack for learning data analysis...",
      "category": "data-science",
      "difficulty": "beginner",
      "runtime_minutes": 120,
      "tags": ["python", "pandas", "data-analysis"],
      "version": "1.0.0",
      "license_spdx": "MIT",
      "preview_public": true,
      "assets": {
        "cover": "cover.png",
        "preview_html": "preview.html",
        "zip": "pack.zip",
        "changelog_md": "CHANGELOG.md"
      },
      "sha256": "abc123..."
    }
  ]
}
```

### Field Specifications

#### Root Level
- `version` (string, required): Schema version (e.g., "1.0.0")
- `generated_at` (ISO 8601 datetime, optional): When the index was generated
- `packs` (array, required): Array of pack objects (min 1)

#### Pack Object
- `slug` (string, required): URL-safe identifier (lowercase alphanumeric + hyphens, max 100 chars)
- `title` (string, required): Display name (max 200 chars)
- `description` (string, optional, max 5000 chars): Full description
- `category` (string, optional, max 100 chars): Category name
- `difficulty` (enum, optional): `"beginner" | "intermediate" | "advanced" | "expert"`
- `runtime_minutes` (integer, optional, positive): Estimated runtime
- `tags` (array of strings, default: []): Searchable tags
- `version` (string, required, max 50 chars): Pack version (semver recommended)
- `license_spdx` (string, required): SPDX license identifier (e.g., "MIT", "Apache-2.0")
- `preview_public` (boolean, default: true): Whether preview HTML is publicly accessible
- `assets` (object, required):
  - `cover` (string, optional): Path to cover image (relative to pack root or URL)
  - `preview_html` (string, optional): Path to preview HTML file
  - `zip` (string, required): Path to ZIP archive
  - `changelog_md` (string, optional): Path to changelog markdown
- `sha256` (string, optional): SHA256 hash of ZIP file (64 hex characters)

## Asset Expectations

### Storage Layout

Assets are stored in Supabase Storage under the `marketplace` bucket:

```
marketplace/
  packs/
    <slug>/
      <version>/
        pack.zip
        preview.html
        cover.png
        changelog.md
```

### Asset Requirements

1. **ZIP Archive** (`pack.zip`):
   - Must contain all pack files
   - Recommended: Include README.md, requirements.txt, LICENSE
   - SHA256 hash should match `sha256` field if provided

2. **Preview HTML** (`preview.html`):
   - Self-contained HTML file (can include inline CSS/JS)
   - Should showcase pack contents without requiring download
   - If `preview_public: false`, requires entitlement to view

3. **Cover Image** (`cover.png`):
   - Recommended: 1200x630px (Open Graph standard)
   - Formats: PNG, JPG, WebP
   - Used in marketplace listings

4. **Changelog** (`changelog.md`):
   - Markdown format
   - Version history and updates

## Publishing Workflow

### Step 1: Prepare library.json

Generate `library.json` in the Notebook Library repository with all pack metadata.

### Step 2: Upload Assets

Upload pack assets to Supabase Storage (or provide URLs if hosted externally):

```bash
# Example: Upload via Supabase CLI or API
supabase storage upload marketplace/packs/<slug>/<version>/pack.zip ./pack.zip
supabase storage upload marketplace/packs/<slug>/<version>/preview.html ./preview.html
supabase storage upload marketplace/packs/<slug>/<version>/cover.png ./cover.png
```

### Step 3: Publish via Admin API

POST to `/marketplace/admin/publish`:

```json
{
  "libraryJson": { /* library.json object */ },
  "dryRun": false
}
```

**Response**:
```json
{
  "dryRun": false,
  "total": 5,
  "results": [
    { "slug": "pack-1", "status": "success" },
    { "slug": "pack-2", "status": "error", "message": "..." }
  ]
}
```

### Step 4: Verify

- Check marketplace listing: `GET /marketplace/packs`
- Verify pack detail: `GET /marketplace/packs/<slug>`
- Test download flow (with entitlement)

## Versioning

- Each pack can have multiple versions (tracked in `marketplace_pack_versions`)
- New versions are upserted based on `(pack_id, version)` unique constraint
- Latest version is shown in listings; users download the version they're entitled to

## Stripe Integration

### Product Setup

1. Create Stripe Product for each pack (or bundle)
2. Set product metadata: `type: "marketplace_pack"`
3. Set price metadata: `packSlug: "<slug>"` or `packId: "<uuid>"`

### Checkout Flow

1. User clicks "Purchase Pack" on pack detail page
2. Frontend calls `POST /billing/checkout` with:
   ```json
   {
     "priceId": "price_...",
     "successUrl": "https://keys.app/marketplace/<slug>?purchased=true",
     "cancelUrl": "https://keys.app/marketplace/<slug>"
   }
   ```
3. Stripe redirects to checkout
4. On success, webhook grants entitlement automatically

### Webhook Handling

Keys webhook (`POST /billing/webhook`) handles:
- `checkout.session.completed` → Grants entitlement if `packSlug`/`packId` in metadata
- `customer.subscription.updated` → Updates entitlement status
- `customer.subscription.deleted` → Revokes entitlement

## Error Handling

### Validation Errors

If `library.json` fails validation:
- Returns 400 with error details
- Lists all validation errors per pack
- Dry run mode validates without publishing

### Asset Missing Errors

If referenced assets don't exist in storage:
- Pack metadata is still published
- Download/preview endpoints return 500 with friendly error
- Admin should verify assets before publishing

## Rollback

To rollback a pack version:

1. Delete from `marketplace_packs` (cascades to versions)
2. Remove assets from storage
3. Entitlements remain (users keep access to purchased packs)

## Next Steps

- Add bundle pricing (multiple packs in one purchase)
- Add "Pro Library" subscription (access to all packs)
- Add pack ratings/reviews
- Add pack dependencies
