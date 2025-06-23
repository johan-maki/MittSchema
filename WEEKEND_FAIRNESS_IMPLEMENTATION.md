# Weekend Fairness Implementation in Gurobi Optimizer

## Overview

The Gurobi-based schedule optimizer now includes a **quaternary objective** for fair distribution of weekend shifts among employees. This ensures that weekend work is distributed as evenly as possible across all team members.

## Implementation Details

### Objective Function Hierarchy

The optimizer uses a multi-objective approach with the following priority order:

1. **Primary (Weight: 100)**: Maximize total shift coverage
2. **Secondary (Weight: 10)**: Minimize unfairness in total shift distribution  
3. **Tertiary (Weight: 5)**: Minimize unfairness in shift type distribution
4. **Quaternary (Weight: 2)**: Minimize unfairness in weekend shift distribution

### Technical Implementation

#### 1. Weekend Detection
```python
def _is_weekend(self, date):
    """Check if a given date is a weekend (Saturday or Sunday)."""
    # weekday() returns 0-6 where Monday=0, Sunday=6
    # So Saturday=5, Sunday=6
    return date.weekday() >= 5
```

#### 2. Weekend Fairness Variables
```python
# Count weekend shifts per employee
emp_weekend_counts = []
for emp in self.employees:
    emp_weekend_total = gp.quicksum(
        self.shifts[(emp['id'], d, shift)]
        for d in range(len(self.dates))
        for shift in self.shift_types
        if self._is_weekend(self.dates[d])
    )
    emp_weekend_counts.append(emp_weekend_total)

# Create fairness constraint variables
max_weekend_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="max_weekend_shifts")
min_weekend_shifts = self.model.addVar(vtype=GRB.CONTINUOUS, name="min_weekend_shifts")

# Add constraints to track min/max weekend shifts
for emp_weekend_count in emp_weekend_counts:
    self.model.addConstr(max_weekend_shifts >= emp_weekend_count)
    self.model.addConstr(min_weekend_shifts <= emp_weekend_count)

weekend_unfairness = max_weekend_shifts - min_weekend_shifts
```

#### 3. Updated Objective Function
```python
self.model.setObjective(
    100 * total_coverage - 10 * total_unfairness - 5 * shift_type_unfairness - 2 * weekend_unfairness,
    GRB.MAXIMIZE
)
```

### Fairness Metrics

The optimizer tracks and reports weekend fairness statistics:

```python
"weekend_shifts": {
    "min": min(weekend_shifts_per_employee),
    "max": max(weekend_shifts_per_employee), 
    "avg": round(sum(weekend_shifts_per_employee) / len(weekend_shifts_per_employee), 1),
    "range": max(weekend_shifts_per_employee) - min(weekend_shifts_per_employee)
}
```

## Test Results

### September 2025 Schedule (30 days, 8 weekend days)

**Weekend Distribution:**
- All 6 employees: **4 weekend shifts each**
- Range: **0** (perfect fairness)
- Total weekend shifts: **24** (8 weekend days × 3 shifts per day)

**Fairness Quality:**
- ✅ **Excellent**: Range ≤ 1
- ✅ **Perfect**: Range = 0 (no employee works more weekend shifts than others)

### Key Benefits

1. **Fair Distribution**: Weekend work is distributed evenly among all employees
2. **Lower Priority**: Weekend fairness doesn't compromise shift coverage or critical fairness goals
3. **Flexible Weighting**: The weight (2) can be adjusted if needed
4. **Comprehensive Statistics**: Detailed reporting of weekend fairness metrics

### Example Output

For a typical month with 8 weekend days and 6 employees:
```
Weekend shifts per employee:
  Erik Eriksson: 4 weekend shifts
  Maria Johansson: 4 weekend shifts  
  Lars Larsson: 4 weekend shifts
  Karin Karlsson: 4 weekend shifts
  Anna Andersson: 4 weekend shifts
  David Davidsson: 4 weekend shifts

Range: 0 shifts (Perfect fairness!)
```

## Configuration

The weekend fairness objective is automatically enabled when using the Gurobi optimizer. The relative weight (2) balances weekend fairness against other objectives:

- **Higher weight**: More emphasis on weekend fairness
- **Lower weight**: Less emphasis on weekend fairness

The current weight of 2 provides good weekend distribution without compromising shift coverage or critical fairness requirements.
