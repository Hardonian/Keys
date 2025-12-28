-- Add premium_features column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{
  "enabled": false,
  "voiceToText": false,
  "tokenLimit": 4000,
  "advancedFilters": false,
  "customPrompts": false
}'::jsonb;

-- Add index for premium users lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium 
ON user_profiles ((premium_features->>'enabled'))
WHERE (premium_features->>'enabled')::boolean = true;

-- Add comment
COMMENT ON COLUMN user_profiles.premium_features IS 'Premium feature flags and limits for the user';
