-- Add hourly_rate column to employees table
ALTER TABLE employees 
ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;

-- Update all existing employees to have 1000 SEK hourly rate
UPDATE employees 
SET hourly_rate = 1000.00 
WHERE hourly_rate IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN employees.hourly_rate IS 'Hourly rate in SEK for calculating schedule costs';
