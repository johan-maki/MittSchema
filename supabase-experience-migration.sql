-- ========================================================================
-- SUPABASE MIGRATION: Experience Points System (1-5)
-- Run this in Supabase SQL Editor to migrate from years (0-10) to points (1-5)
-- ========================================================================

-- Step 1: Check current state
SELECT 
    'Current experience level distribution' as info,
    experience_level,
    COUNT(*) as count
FROM employees 
GROUP BY experience_level 
ORDER BY experience_level;

-- Step 2: Migrate existing data
-- Convert experience levels to new 1-5 point system
UPDATE employees 
SET experience_level = CASE 
    WHEN experience_level IS NULL THEN 1
    WHEN experience_level <= 0.5 THEN 1  -- 0-6 months -> 1 (Nybörjare)
    WHEN experience_level <= 1.5 THEN 2  -- 6-18 months -> 2 (Erfaren)
    WHEN experience_level <= 3 THEN 3    -- 1.5-3 years -> 3 (Välerfaren)
    WHEN experience_level >= 4 THEN 4    -- 3+ years -> 4 (Senior)
    ELSE 3  -- Default to 3 for edge cases
END
WHERE experience_level IS NULL OR experience_level < 1 OR experience_level > 5;

-- Step 3: Update any NULL values to default 1
UPDATE employees 
SET experience_level = 1 
WHERE experience_level IS NULL;

-- Step 4: Remove old constraints (if they exist)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS chk_experience_level;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_experience_level_check;

-- Step 5: Add new constraint for 1-5 range
ALTER TABLE employees 
ADD CONSTRAINT chk_experience_level 
CHECK (experience_level >= 1 AND experience_level <= 5);

-- Step 6: Verify the migration
SELECT 
    'Final experience level distribution' as info,
    experience_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM employees 
WHERE experience_level IS NOT NULL
GROUP BY experience_level 
ORDER BY experience_level;

-- Step 7: Check for any remaining invalid values
SELECT 
    'Invalid values check' as info,
    COUNT(*) as invalid_count
FROM employees 
WHERE experience_level < 1 OR experience_level > 5 OR experience_level IS NULL;

-- Step 8: Show some examples of migrated data
SELECT 
    'Sample migrated employees' as info,
    first_name,
    last_name,
    experience_level,
    CASE experience_level
        WHEN 1 THEN 'Nybörjare (0-6 mån)'
        WHEN 2 THEN 'Erfaren (6-18 mån)'
        WHEN 3 THEN 'Välerfaren (1,5-3 år)'
        WHEN 4 THEN 'Senior (3+ år)'
        WHEN 5 THEN 'Expert/specialist'
        ELSE 'Unknown'
    END as level_description
FROM employees 
ORDER BY experience_level, first_name
LIMIT 10;
