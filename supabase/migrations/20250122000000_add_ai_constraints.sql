-- Migration: Add AI Constraints Table (Gurobi-Ready Format)
-- This table stores natural language constraints parsed by ChatGPT
-- Format is ready for direct use by Gurobi optimizer (no conversion needed!)

CREATE TABLE IF NOT EXISTS ai_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee identification (Gurobi-ready)
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Dates array (already expanded by ChatGPT!)
  dates DATE[] NOT NULL,
  
  -- Shifts array (Gurobi-ready)
  shifts TEXT[] DEFAULT '{}',  -- Empty array = all shifts, or ['dag', 'kväll', 'natt']
  
  -- Constraint type (Gurobi format)
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('hard_unavailable', 'soft_preference', 'hard_required')),
  
  -- Priority weight for Gurobi
  priority INTEGER NOT NULL DEFAULT 1000,  -- 1000 = must respect, 100 = nice to have
  
  -- Original user input & friendly response
  original_text TEXT NOT NULL,
  natural_language TEXT,  -- ChatGPT's user-friendly confirmation
  
  -- Metadata
  organization_id UUID,
  department TEXT DEFAULT 'Akutmottagning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tracking
  used_in_schedule BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_constraints_employee ON ai_constraints(employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_constraints_dates ON ai_constraints USING GIN(dates);  -- GIN index for array
CREATE INDEX IF NOT EXISTS idx_ai_constraints_org ON ai_constraints(organization_id);
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

COMMENT ON TABLE ai_constraints IS 'Natural language constraints parsed by ChatGPT in Gurobi-ready format (no conversion needed!)';
COMMENT ON COLUMN ai_constraints.dates IS 'Array of dates already expanded by ChatGPT (e.g., [2025-12-20, 2025-12-21, ...])';
COMMENT ON COLUMN ai_constraints.shifts IS 'Empty array = all shifts affected, or specific shifts ["dag", "kväll", "natt"]';
COMMENT ON COLUMN ai_constraints.constraint_type IS 'Gurobi format: hard_unavailable, soft_preference, hard_required';
COMMENT ON COLUMN ai_constraints.priority IS 'Weight for Gurobi optimizer: 1000 = must respect, 100 = nice to have';
COMMENT ON COLUMN ai_constraints.original_text IS 'Original Swedish text entered by user';
COMMENT ON COLUMN ai_constraints.natural_language IS 'ChatGPT friendly confirmation with HTML tags';
COMMENT ON COLUMN ai_constraints.used_in_schedule IS 'Tracks if this constraint was used in the latest schedule generation';
