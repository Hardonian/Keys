# Quick Start: Cursor Database Migration Patterns

Generate database migrations in Cursor in 2 minutes.

---

## Step 1: Copy Key to Cursor

Copy the key to your Cursor workspace:

```bash
cp -r cursor-database-migration-patterns ~/.cursor/keys/
```

---

## Step 2: Open Cursor Composer

Open Cursor Composer (Cmd/Ctrl + I)

---

## Step 3: Generate Migration

```
Use the database migration patterns from prompts/migration-patterns.yaml

Generate a migration to:
- Add a "bio" column (TEXT, nullable) to the users table
- Include up and down migrations
- Make it idempotent
```

---

## Step 4: Review Generated Migration

Cursor will generate:
- ✅ Up migration (forward)
- ✅ Down migration (rollback)
- ✅ Idempotent SQL (IF EXISTS/IF NOT EXISTS)
- ✅ Comments explaining changes

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Test migration on staging first
- Customize patterns for your database

---

**That's it!** You have a production-ready migration.
