-- Create prompt_atoms table
CREATE TABLE prompt_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  name TEXT NOT NULL,  -- e.g., "tone.playful", "stack.web_app", "perspective.founder", "phase.implementation"
  category TEXT NOT NULL,  -- 'tone', 'stack', 'perspective', 'phase', 'domain', 'constraint', 'example', 'goal', 'risk'
  version INT DEFAULT 1,
  
  -- Content
  system_prompt TEXT,  -- LLM system instruction snippet
  constraints JSONB,  -- {"max_tokens": 500, "style": "conversational"}
  examples JSONB,  -- Few-shot examples
  
  -- Weighting & Compatibility
  weight FLOAT DEFAULT 1.0,
  compatible_atoms TEXT[],
  target_roles TEXT[],
  target_verticals TEXT[],
  
  -- Telemetry
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0.5,  -- How often outputs are accepted
  active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_prompt_atoms_category ON prompt_atoms(category);
CREATE INDEX idx_prompt_atoms_active ON prompt_atoms(active);
CREATE INDEX idx_prompt_atoms_name ON prompt_atoms(name);

-- Create unique constraint on name + version
CREATE UNIQUE INDEX idx_prompt_atoms_name_version ON prompt_atoms(name, version);
