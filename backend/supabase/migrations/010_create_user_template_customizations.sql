-- Create table for user template customizations
CREATE TABLE IF NOT EXISTS user_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  
  -- Customization data
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one customization per user per template
  UNIQUE(user_id, template_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_user_id 
  ON user_template_customizations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_template_customizations_template_id 
  ON user_template_customizations(template_id);

-- Enable RLS
ALTER TABLE user_template_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own template customizations"
  ON user_template_customizations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template customizations"
  ON user_template_customizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template customizations"
  ON user_template_customizations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template customizations"
  ON user_template_customizations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_template_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_template_customizations_updated_at
  BEFORE UPDATE ON user_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_template_customizations_updated_at();
