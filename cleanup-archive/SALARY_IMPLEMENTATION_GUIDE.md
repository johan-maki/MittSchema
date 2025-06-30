# 💰 Adding Salary Support to Employee Scheduling System

## Step 1: Add hourly_rate column to employees table

You'll need to run this SQL in your Supabase SQL editor:

```sql
-- Add hourly_rate column to employees table
ALTER TABLE employees 
ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;

-- Update all existing employees to have 1000 SEK hourly rate
UPDATE employees 
SET hourly_rate = 1000.00 
WHERE hourly_rate IS NULL;
```

## Step 2: Features to implement

1. **Employee Salary Management (Manager View)**
   - Add salary editing in employee profile view
   - Only managers can edit salaries
   - Input validation for salary ranges

2. **Schedule Cost Calculation**
   - Calculate total cost per schedule
   - Show cost breakdown by employee
   - Display in schedule summary

3. **Cost Display in Schedule Views**
   - Show total monthly cost
   - Cost per employee breakdown
   - Cost comparison between different schedule periods

## Implementation Plan

1. Update employee types to include hourly_rate
2. Add salary editing component for managers
3. Update Gurobi optimizer to include salary data
4. Add cost calculation logic
5. Update UI to show schedule costs

Let me know once you've added the database column and I'll implement the features!
