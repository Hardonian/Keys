-- Dashboard metrics RPC + marketplace keyset pagination indexes

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_user_id uuid,
  p_include_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  period_start timestamptz := date_trunc('month', now());
  subscription_tier text;
  subscription_status text;
  guarantee_coverage jsonb;
  prevented_failures_count int;
  runs_usage int := 0;
  tokens_usage int := 0;
  templates_usage int := 0;
  exports_usage int := 0;
  total_prompts bigint := 0;
  total_templates bigint := 0;
  admin_total_users bigint := null;
BEGIN
  SELECT
    user_profiles.subscription_tier,
    user_profiles.subscription_status,
    user_profiles.guarantee_coverage,
    user_profiles.prevented_failures_count
  INTO
    subscription_tier,
    subscription_status,
    guarantee_coverage,
    prevented_failures_count
  FROM user_profiles
  WHERE user_profiles.user_id = p_user_id;

  SELECT COALESCE(metric_value, 0)
  INTO runs_usage
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = 'runs'
    AND period_start = period_start;

  SELECT COALESCE(metric_value, 0)
  INTO tokens_usage
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = 'tokens'
    AND period_start = period_start;

  SELECT COALESCE(metric_value, 0)
  INTO templates_usage
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = 'templates'
    AND period_start = period_start;

  SELECT COALESCE(metric_value, 0)
  INTO exports_usage
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = 'exports'
    AND period_start = period_start;

  SELECT COUNT(*)
  INTO total_prompts
  FROM agent_runs
  WHERE user_id = p_user_id;

  SELECT COUNT(*)
  INTO total_templates
  FROM user_template_customizations
  WHERE user_id = p_user_id;

  IF p_include_admin THEN
    SELECT COUNT(*)
    INTO admin_total_users
    FROM user_profiles;
  END IF;

  RETURN jsonb_build_object(
    'profile',
    jsonb_build_object(
      'subscription_tier', COALESCE(subscription_tier, 'free'),
      'subscription_status', COALESCE(subscription_status, 'free'),
      'guarantee_coverage', COALESCE(guarantee_coverage, '[]'::jsonb),
      'prevented_failures_count', COALESCE(prevented_failures_count, 0)
    ),
    'usage',
    jsonb_build_object(
      'runs', runs_usage,
      'tokens', tokens_usage,
      'templates', templates_usage,
      'exports', exports_usage
    ),
    'totals',
    jsonb_build_object(
      'prompts', total_prompts,
      'templates', total_templates
    ),
    'admin_total_users', admin_total_users
  );
END;
$$;

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_created_at_id_desc
  ON marketplace_keys (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tool_created_at_id
  ON marketplace_keys (tool, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_key_type_created_at_id
  ON marketplace_keys (key_type, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_category_created_at_id
  ON marketplace_keys (category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_difficulty_created_at_id
  ON marketplace_keys (difficulty, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_outcome_created_at_id
  ON marketplace_keys (outcome, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_maturity_created_at_id
  ON marketplace_keys (maturity, created_at DESC, id DESC);
