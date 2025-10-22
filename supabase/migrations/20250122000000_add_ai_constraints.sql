-- Migration: Add AI Constraints Table
-- This table stores natural language constraints parsed by ChatGPT

CREATE TABLE IF NOT EXISTS ai_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee identification
  employee_name TEXT NOT NULL,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Constraint details
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('unavailable_day', 'unavailable_shift', 'preferred_day', 'preferred_shift')),
  shift_type TEXT CHECK (shift_type IN ('dag', 'kväll', 'natt') OR shift_type IS NULL),
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CHECK (end_date >= start_date),
  
  -- Constraint strength
  is_hard BOOLEAN NOT NULL DEFAULT true,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  
  -- Original user input
  original_text TEXT NOT NULL,
  
  -- Metadata
  department TEXT DEFAULT 'Akutmottagning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tracking
  used_in_schedule BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_constraints_employee ON ai_constraints(employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_constraints_dates ON ai_constraints(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ai_constraints_department ON ai_constraints(department);
CREATE INDEX IF NOT EXISTS idx_ai_constraints_created_at ON ai_constraints(created_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE ai_constraints ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all constraints in their department
CREATE POLICY "Users can view ai_constraints" ON ai_constraints
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert constraints
CREATE POLICY "Users can insert ai_constraints" ON ai_constraints
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to delete their own constraints
CREATE POLICY "Users can delete own ai_constraints" ON ai_constraints
  FOR DELETE
  USING (auth.uid() = created_by);

-- Allow users to update their own constraints
CREATE POLICY "Users can update own ai_constraints" ON ai_constraints
  FOR UPDATE
  USING (auth.uid() = created_by);

COMMENT ON TABLE ai_constraints IS 'Natural language constraints parsed by ChatGPT for schedule generation';
COMMENT ON COLUMN ai_constraints.original_text IS 'Original Swedish text entered by user';
COMMENT ON COLUMN ai_constraints.is_hard IS 'true = hard constraint (must respect), false = soft preference (nice to have)';
COMMENT ON COLUMN ai_constraints.used_in_schedule IS 'Tracks if this constraint was used in the latest schedule generation';
