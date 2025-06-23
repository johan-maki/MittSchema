# Salary Implementation Guide

## Step 1: Database Migration (REQUIRED)

**You must run this SQL in Supabase SQL Editor before the salary features will work:**

```sql
-- Add hourly_rate column to employees table
ALTER TABLE employees ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;

-- Update all existing employees to have 1000 SEK hourly rate
UPDATE employees SET hourly_rate = 1000.00;

-- Verify the migration worked
SELECT first_name, last_name, hourly_rate FROM employees;
```

### To run this SQL:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Paste the SQL above
5. Click "Run" to execute

## Step 2: Verify Migration

After running the SQL, you can verify it worked by running:

```bash
node check-employee-structure.mjs
```

This should now show that the `hourly_rate` column exists and all employees have 1000 SEK.

## Step 3: Frontend Implementation

Once the database migration is complete, the following features will be implemented:

### 1. Employee Salary Management
- Managers can edit employee salaries in the "Personal" view
- Default salary is 1000 SEK/hour for all employees
- Salary editing is restricted to managers only

### 2. Schedule Cost Calculation
- Total schedule cost is calculated based on:
  - Number of hours per shift (day: 8h, evening: 8h, night: 12h)
  - Employee hourly rate
  - Number of shifts assigned
- Cost is displayed in schedule summaries
- Cost breakdown by employee and shift type

### 3. Backend Integration
- Gurobi optimizer now includes salary data in shift assignments
- API returns cost information with schedule data
- Cost calculations are done server-side for accuracy

## Implementation Status

✅ **Completed:**
- Backend Gurobi optimizer updated to include hourly_rate
- Employee type definitions updated to include salary field
- Cost calculation logic added to shift assignment

⏳ **Pending Database Migration:**
- Run the SQL above to add hourly_rate column

🔄 **Next Steps (after migration):**
- Update frontend employee management UI
- Add cost display to schedule views
- Test end-to-end salary and cost functionality

## Files Modified

- `scheduler-api/services/gurobi_optimizer_service.py` - Added cost calculation
- `src/types/profile.ts` - Added hourly_rate to employee type
- `src/types/shift.ts` - Added cost to shift type
- Database schema - Added hourly_rate column (pending manual execution)

## Testing

After the migration, you can test the full functionality:

1. **Verify salary data:** `node check-employee-structure.mjs`
2. **Generate schedule:** Should now include cost calculations
3. **Check API response:** Should include cost data in shift assignments
4. **Frontend display:** Schedule should show total cost

## Support

If you encounter any issues with the migration or implementation, please check:
1. Supabase permissions for running DDL statements
2. Database connection and credentials
3. Frontend type definitions match backend response structure
