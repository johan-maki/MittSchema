-- Migration: Change experience system from years (0-10) to experience points (1-5)
-- This script helps convert existing experience values and update constraints

-- First, let's see what experience values exist currently
-- SELECT experience_level, COUNT(*) FROM employees GROUP BY experience_level ORDER BY experience_level;

-- Convert existing experience values to new 1-5 scale
-- This is a rough mapping - you may want to review manually
UPDATE employees 
SET experience_level = CASE 
    WHEN experience_level <= 0.5 THEN 1  -- 0-6 months -> 1 (Nybörjare)
    WHEN experience_level <= 1.5 THEN 2  -- 6-18 months -> 2 (Erfaren)
    WHEN experience_level <= 3 THEN 3    -- 1.5-3 years -> 3 (Välerfaren)
    WHEN experience_level >= 4 THEN 4    -- 3+ years -> 4 (Senior)
    ELSE 3  -- Default to 3 for any edge cases
END
WHERE experience_level IS NOT NULL;

-- Update any NULL values to default 1
UPDATE employees 
SET experience_level = 1 
WHERE experience_level IS NULL;

-- Add constraint to ensure experience_level is between 1 and 5
-- Note: You may need to drop existing constraints first if they exist
-- ALTER TABLE employees DROP CONSTRAINT IF EXISTS chk_experience_level;

ALTER TABLE employees 
ADD CONSTRAINT chk_experience_level 
CHECK (experience_level >= 1 AND experience_level <= 5);

-- Verify the changes
SELECT 
    experience_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM employees 
WHERE experience_level IS NOT NULL
GROUP BY experience_level 
ORDER BY experience_level;

-- Show some examples of the updated data
SELECT first_name, last_name, role, experience_level 
FROM employees 
ORDER BY experience_level, first_name 
LIMIT 10;
