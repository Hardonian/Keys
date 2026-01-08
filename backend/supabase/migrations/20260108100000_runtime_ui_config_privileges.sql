-- Runtime UI config: tighten public privileges
-- Goal: keep config publicly readable while preventing leakage of admin identifiers
-- (e.g. updated_by UUID) to anon/authenticated clients.

DO $$
BEGIN
  -- Ensure table exists before applying grants.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'runtime_ui_config'
  ) THEN
    RAISE NOTICE 'public.runtime_ui_config does not exist; skipping privilege hardening';
    RETURN;
  END IF;
END $$;

-- Revoke broad table privileges from public roles, then re-grant only the safe columns.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.runtime_ui_config FROM anon;
    GRANT SELECT (id, public_config, updated_at) ON TABLE public.runtime_ui_config TO anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.runtime_ui_config FROM authenticated;
    GRANT SELECT (id, public_config, updated_at) ON TABLE public.runtime_ui_config TO authenticated;
  END IF;

  -- Service role is used by the backend for writes; ensure it can read/write.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.runtime_ui_config TO service_role;
  END IF;
END $$;

