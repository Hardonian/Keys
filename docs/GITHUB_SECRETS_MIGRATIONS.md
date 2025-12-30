# GitHub Secrets for Migrations

## Required Secrets

To enable automatic migrations, add these secrets to your GitHub repository:

### Option 1: Direct Database Connection (Recommended)

**Secret Name:** `SUPABASE_DB_URL`

**Value Format:**
```
postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**How to Get:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Find "Connection string" → "Connection pooling"
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password

### Option 2: Alternative Database URL

**Secret Name:** `DATABASE_URL`

**Value Format:**
```
postgresql://user:password@host:port/database
```

### Option 3: Supabase Credentials (Fallback)

If you don't have direct DB URL, you can use:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from API settings)
- `SUPABASE_DB_PASSWORD` - Database password (from Database settings)

**Note:** Option 1 is recommended as it's most reliable.

## Setting Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `SUPABASE_DB_URL`
   - Value: Your connection string
5. Click **Add secret**

## Security Notes

- ✅ **Never commit secrets** to the repository
- ✅ **Use service role key** (not anon key) for migrations
- ✅ **Rotate secrets** periodically
- ✅ **Limit access** to who can view secrets
- ✅ **Use environment-specific secrets** for staging/production

## Testing Secrets

After adding secrets, test the migration workflow:

1. Go to **Actions** → **Database Migrations**
2. Click **Run workflow**
3. Select `main` branch
4. Enable **Force run all migrations** (for testing)
5. Click **Run workflow**
6. Check logs for connection success

## Troubleshooting

### "No database connection configured"

**Solution:** Add `SUPABASE_DB_URL` or `DATABASE_URL` secret

### "Connection refused" or "Authentication failed"

**Solutions:**
1. Verify connection string format
2. Check database password is correct
3. Ensure IP allowlist includes GitHub Actions IPs (if applicable)
4. Verify database is accessible from internet

### "Migration already applied"

**Solution:** This is normal - migrations are tracked. Use force mode to re-run if needed.

---

**For help, check migration logs in GitHub Actions or contact DevOps team.**
