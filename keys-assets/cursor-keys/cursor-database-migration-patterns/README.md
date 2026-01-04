# Cursor Keys: Database Migration Patterns

**Version**: 1.0.0  
**Tool**: Cursor  
**Maturity**: Operator  
**Outcome**: Automation

---

## What This Key Unlocks

Database migration generation patterns for Cursor. This key unlocks:

- **Schema Change Patterns**: CREATE, ALTER, DROP operations
- **Data Migration Patterns**: Data transformation and migration
- **Rollback Procedures**: Complete rollback SQL
- **Migration Testing**: Testing patterns for migrations
- **Idempotent Migrations**: Safe, repeatable migrations

---

## Installation

1. **Copy the key** to your Cursor workspace:
   ```bash
   cp -r cursor-database-migration-patterns /path/to/your/project/.cursor/keys/
   ```

2. **Use in Cursor**:
   - Open Cursor Composer
   - Reference the prompt files when generating migrations
   - Use the composer instructions for guided generation

---

## Usage

### Using the Mega Prompt

1. **Open Cursor Composer**
2. **Reference the prompt**:
   ```
   Use the database migration patterns from prompts/migration-patterns.yaml
   ```
3. **Describe your migration**:
   ```
   Generate a migration to add a "bio" column to the users table
   ```

---

## Included Patterns

### Add Column Pattern
- Add column as nullable first
- Populate existing rows
- Add constraints after population
- Idempotent with IF NOT EXISTS

### Create Table Pattern
- Include primary key and foreign keys
- Add indexes for performance
- Enable RLS if needed
- Add timestamps

### Data Migration Pattern
- Backup data first
- Validate before commit
- Use transactions
- Handle edge cases

### Rollback Pattern
- Complete rollback SQL
- Restore data if needed
- Test rollback

---

## Best Practices

1. **Always use transactions** for atomicity
2. **Make migrations idempotent** with IF EXISTS/IF NOT EXISTS
3. **Add indexes after data migration** for performance
4. **Test migrations on staging first**
5. **Never drop columns without backup**
6. **Add columns as nullable, then populate, then make NOT NULL**
7. **Use CHECK constraints** for validation
8. **Document breaking changes**

---

## Requirements

- Cursor IDE
- PostgreSQL/Supabase database
- Migration tool (Supabase Migrations, Flyway, etc.)

---

## License

MIT
