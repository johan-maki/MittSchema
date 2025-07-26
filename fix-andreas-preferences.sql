-- Check Andreas work_preferences and fix if needed
-- Run this in Supabase SQL Editor

-- First, check Andreas current work_preferences
SELECT 
  id, 
  first_name, 
  last_name, 
  role, 
  experience_level,
  work_preferences
FROM employees 
WHERE first_name = 'Andreas' 
  AND last_name = 'Lundquist';

-- If work_preferences is null, update it with default preferences
-- (Uncomment and run if needed)
/*
UPDATE employees 
SET work_preferences = '{
  "max_shifts_per_week": 5,
  "day_constraints": {
    "monday": {"available": true, "strict": false},
    "tuesday": {"available": true, "strict": false},
    "wednesday": {"available": true, "strict": false},
    "thursday": {"available": true, "strict": false},
    "friday": {"available": true, "strict": false},
    "saturday": {"available": true, "strict": false},
    "sunday": {"available": true, "strict": false}
  },
  "shift_constraints": {
    "day": {"preferred": true, "strict": false},
    "evening": {"preferred": true, "strict": false},
    "night": {"preferred": true, "strict": false}
  }
}'::jsonb
WHERE first_name = 'Andreas' 
  AND last_name = 'Lundquist'
  AND (work_preferences IS NULL OR work_preferences = 'null'::jsonb);
*/

-- Verify the update
SELECT 
  id, 
  first_name, 
  last_name, 
  role, 
  work_preferences
FROM employees 
WHERE first_name = 'Andreas' 
  AND last_name = 'Lundquist';
