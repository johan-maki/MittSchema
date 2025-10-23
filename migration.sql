-- Fix RLS policy to allow deletion of constraints without created_by
DROP POLICY IF EXISTS "Users can delete own ai_constraints" ON ai_constraints;

CREATE POLICY "Users can delete ai_constraints" ON ai_constraints
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    (created_by IS NULL OR auth.uid() = created_by)
  );
