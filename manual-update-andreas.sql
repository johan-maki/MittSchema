// Manual database update script for Andreas role
// Instructions: Run this in your Supabase SQL editor

-- Update Andreas Lundquist's role from "Professor" to "Läkare"
UPDATE employees 
SET role = 'Läkare'
WHERE first_name = 'Andreas' 
  AND last_name = 'Lundquist' 
  AND role = 'Professor';

-- Verify the update
SELECT id, first_name, last_name, role 
FROM employees 
WHERE first_name = 'Andreas' 
  AND last_name = 'Lundquist';

-- If Andreas doesn't exist in the backend database, add him:
-- (Uncomment these lines if needed)
/*
INSERT INTO employees (
  id,
  first_name,
  last_name,
  role,
  department,
  experience_level,
  hourly_rate,
  is_manager
) VALUES (
  gen_random_uuid(),
  'Andreas',
  'Lundquist',
  'Läkare',
  'Kirurgi',
  7,
  1200,
  false
);
*/
