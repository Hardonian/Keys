-- Failure Memory System: Institutional memory that prevents repeat mistakes
-- This is a core defensive moat that accumulates irreversible value over time

-- Failure Patterns: Track what didn't work and why
CREATE TABLE IF NOT EXISTS failure_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pattern Classification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'security',           -- Security vulnerability detected
    'quality',            -- Code quality issue
    'compliance',         -- Compliance violation (GDPR, SOC 2, etc.)
    'performance',        -- Performance issue
    'architecture',      -- Architecture anti-pattern
    'best_practice',     -- Best practice violation
    'user_rejection',    -- User explicitly rejected output
    'user_revision'      -- User had to significantly revise output
  )),
  
  -- Pattern Details
  pattern_description TEXT NOT NULL,  -- Human-readable description
  pattern_signature TEXT NOT NULL,    -- Machine-readable signature for matching
  detected_in TEXT,                   -- Project/repo/context where detected
  original_output TEXT,               -- The output that failed
  failure_reason TEXT,                -- Why it failed
  
  -- Prevention Rule
  prevention_rule TEXT NOT NULL,      -- How to prevent this failure
  prevention_prompt_addition TEXT,    -- Additional prompt text to prevent
  
  -- Context
  context_snapshot JSONB,              -- Full context when failure occurred
  template_id TEXT,                   -- Template used (if applicable)
  vibe_config_snapshot JSONB,         -- Vibe config used
  
  -- Metadata
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,     -- Has this been resolved?
  resolved_at TIMESTAMPTZ,
  
  -- Analytics
  occurrence_count INT DEFAULT 1,     -- How many times this pattern occurred
  last_occurrence TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_patterns_user_id ON failure_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_type ON failure_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_signature ON failure_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_detected_in ON failure_patterns(detected_in);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_severity ON failure_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_resolved ON failure_patterns(resolved);

-- Success Patterns: Track what worked and why
CREATE TABLE IF NOT EXISTS success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pattern Classification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'security',           -- Security best practice
    'quality',            -- High-quality output
    'compliance',         -- Compliance success
    'performance',        -- Performance optimization
    'architecture',      -- Good architecture pattern
    'best_practice',     -- Best practice followed
    'user_approval',     -- User explicitly approved
    'production_ready'   -- Used in production successfully
  )),
  
  -- Pattern Details
  pattern_description TEXT NOT NULL,
  pattern_signature TEXT NOT NULL,
  context TEXT NOT NULL,              -- Where it succeeded
  outcome TEXT NOT NULL,               -- What the outcome was
  
  -- Success Factors
  success_factors TEXT[],             -- What made this successful
  template_id TEXT,
  vibe_config_snapshot JSONB,
  
  -- Context
  context_snapshot JSONB,
  output_example TEXT,                -- Example of successful output
  
  -- Analytics
  usage_count INT DEFAULT 1,          -- How many times this pattern was used
  success_rate FLOAT DEFAULT 1.0,     -- Success rate when applied
  last_used TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_patterns_user_id ON success_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_success_patterns_type ON success_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_success_patterns_signature ON success_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_success_patterns_context ON success_patterns(context);

-- Pattern Matches: Track when patterns are detected/matched
CREATE TABLE IF NOT EXISTS pattern_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Match Details
  pattern_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('failure', 'success')),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'similar', 'prevented')),
  
  -- Context
  matched_against TEXT NOT NULL,      -- What was matched against
  match_confidence FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  context_snapshot JSONB,
  
  -- Outcome
  action_taken TEXT,                  -- 'warned', 'blocked', 'suggested', 'applied'
  outcome TEXT                        -- What happened as a result
);

CREATE INDEX IF NOT EXISTS idx_pattern_matches_user_id ON pattern_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_pattern_id ON pattern_matches(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_type ON pattern_matches(pattern_type);

-- Enable RLS
ALTER TABLE failure_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own patterns
CREATE POLICY "Users can view own failure patterns"
  ON failure_patterns
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own failure patterns"
  ON failure_patterns
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own failure patterns"
  ON failure_patterns
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own success patterns"
  ON success_patterns
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own success patterns"
  ON success_patterns
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own success patterns"
  ON success_patterns
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own pattern matches"
  ON pattern_matches
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own pattern matches"
  ON pattern_matches
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Add failure tracking to agent_runs
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS failure_pattern_id UUID REFERENCES failure_patterns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS success_pattern_id UUID REFERENCES success_patterns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS safety_checks_passed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS safety_check_results JSONB;

CREATE INDEX IF NOT EXISTS idx_agent_runs_failure_pattern ON agent_runs(failure_pattern_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_success_pattern ON agent_runs(success_pattern_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_safety_checks ON agent_runs(safety_checks_passed);
