-- Migration: 014_trigger_migration_system.sql
-- Description: This migration triggers the automated migration system
-- This file ensures all existing migrations are detected and run

-- This is a no-op migration that serves as a trigger
-- The migration system will detect this and all other untracked migrations

-- Add a comment to ensure file is not empty
SELECT 'Migration system trigger - all migrations will be processed' AS status;
