-- Fix RLS policy to allow deletion of constraints without created_by
-- This handles legacy constraints created before the fix

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can delete own ai_constraints" ON ai_constraints;

-- Create new policy that allows deletion of own constraints OR constraints without created_by
CREATE POLICY "Users can delete ai_constraints" ON ai_constraints
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    (created_by IS NULL OR auth.uid() = created_by)
  );

-- Optional: Set created_by for existing NULL constraints to current user
-- This is commented out because it could assign ownership incorrectly
-- UPDATE ai_constraints SET created_by = auth.uid() WHERE created_by IS NULL;

COMMENT ON POLICY "Users can delete ai_constraints" ON ai_constraints IS 
  'Allow authenticated users to delete their own constraints or legacy constraints without created_by';
