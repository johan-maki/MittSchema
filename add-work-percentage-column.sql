-- Add work_percentage column to employees table
-- This column stores the employee's work percentage (0-100)

ALTER TABLE employees 
ADD COLUMN work_percentage INTEGER DEFAULT 100 CHECK (work_percentage >= 0 AND work_percentage <= 100);

-- Add comment to document the column
COMMENT ON COLUMN employees.work_percentage IS 'Work percentage (0-100): 100 = full-time, 80 = 80%, 20 = 20%, etc.';

-- Update existing employees to have 100% work percentage by default
UPDATE employees 
SET work_percentage = 100 
WHERE work_percentage IS NULL;

-- Verify the changes
SELECT id, first_name, last_name, work_percentage 
FROM employees 
ORDER BY first_name, last_name;
