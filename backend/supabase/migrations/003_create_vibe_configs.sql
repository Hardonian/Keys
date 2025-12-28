-- Create vibe_configs table
CREATE TABLE vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Snapshot of current vibe state
  name TEXT,  -- e.g., "Q1 Feature Launch", "Tech Debt Sprint"
  
  -- Filter Sliders (0-100)
  playfulness INT DEFAULT 50 CHECK (playfulness >= 0 AND playfulness <= 100),  -- Writing tone: 0 = formal, 100 = playful
  revenue_focus INT DEFAULT 60 CHECK (revenue_focus >= 0 AND revenue_focus <= 100),  -- Business-outcome focus: 0 = exploratory, 100 = ROI-obsessed
  investor_perspective INT DEFAULT 40 CHECK (investor_perspective >= 0 AND investor_perspective <= 100),  -- Framing: 0 = pure operator/tech, 100 = investor/CFO framing
  
  -- Selected Atoms & Instructions
  selected_atoms UUID[],
  custom_instructions TEXT,
  
  -- System Preferences
  auto_suggest BOOLEAN DEFAULT true,
  approval_required BOOLEAN DEFAULT true,
  logging_level TEXT DEFAULT 'standard'
);

-- Create indexes
CREATE INDEX idx_vibe_configs_user_id ON vibe_configs(user_id);
CREATE INDEX idx_vibe_configs_created_at ON vibe_configs(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_vibe_configs_updated_at
  BEFORE UPDATE ON vibe_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
