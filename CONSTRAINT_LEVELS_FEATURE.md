# 3-Level Constraint System - Complete Implementation

## Overview
Implemented a comprehensive 3-level constraint system for employee work preferences, allowing graduated control from soft preferences to absolute impossibilities.

## Constraint Levels

### 🟢 Level 1: Soft Preferences (Green/Blue)
- **UI**: Toggle switches in main WorkPreferences card
- **Backend**: Penalty weight 8-12 in Gurobi objective function
- **Behavior**: Optimizer respects when possible, but can override for coverage
- **Examples**: 
  - Preferred shift types (Day, Evening, Night)
  - Available days (Monday-Sunday)
- **User Intent**: "I prefer to work these shifts/days"

### 🟡 Level 2: Medium Blocks (Yellow/Amber)
- **UI**: Calendar dialog with amber theme
- **Icon**: AlertTriangle
- **Limit**: Max 3 slots per employee per month
- **Backend**: Penalty weight 30 in Gurobi objective function
- **Implementation**:
  ```python
  # Creates penalty variables linked to shift assignments
  penalty_var = model.addVar(vtype=GRB.BINARY)
  model.addConstr(penalty_var >= shifts[(emp_id, day, shift)])
  # Added to objective: -30 * sum(medium_penalties)
  ```
- **Behavior**: Strong preference to avoid, but CAN be scheduled if needed for coverage
- **Examples**: 
  - "I have a dentist appointment this day - prefer to avoid but can reschedule if needed"
  - "Family event but not critical"
- **User Intent**: "I really prefer not to work this shift, but it's not impossible"

### 🔴 Level 3: Hard Blocks (Red)
- **UI**: Calendar dialog with red theme
- **Icon**: Calendar with X
- **Limit**: Max 3 slots per employee per month
- **Backend**: Hard constraint (== 0) in Gurobi
- **Implementation**:
  ```python
  model.addConstr(
      shifts[(emp_id, day_index, shift)] == 0,
      name=f"hard_blocked_{emp_id}_{day}_{shift}"
  )
  ```
- **Behavior**: Absolutely CANNOT be scheduled - optimizer enforces mathematically
- **Examples**: 
  - Medical appointment
  - Vacation
  - Legal obligations
- **User Intent**: "I cannot work this shift under any circumstances"

## Data Structure

### TypeScript Types
```typescript
export type MediumBlockedSlot = {
  date: string; // "YYYY-MM-DD"
  shift_types: ('day' | 'evening' | 'night' | 'all_day')[];
};

export interface WorkPreferences {
  hard_blocked_slots?: HardBlockedSlot[];
  medium_blocked_slots?: MediumBlockedSlot[];
  // ... other fields
}
```

### Pydantic Models
```python
class MediumBlockedSlot(BaseModel):
    """Medium blocked - strongly prefers not to work but can if needed"""
    date: str
    shift_types: List[str]

class EmployeePreference(BaseModel):
    hard_blocked_slots: Optional[List[HardBlockedSlot]] = None
    medium_blocked_slots: Optional[List[MediumBlockedSlot]] = None
    # ... other fields
```

## Gurobi Integration

### Objective Function Weights (Priority Order)
1. **Coverage**: 100x (most important)
2. **Total fairness**: 50x (spread shifts evenly)
3. **Medium blocks**: 30x ⭐ (new)
4. **Weekend fairness**: 20x
5. **Preferred days**: 12x (soft)
6. **Shift type fairness**: 8x
7. **Preferred shifts**: 8x (soft)

### Section 7: Medium Blocked Time Slots
Located in `_add_employee_preference_constraints()` after Section 6 (Hard Blocks):

1. **Parse dates**: Convert "YYYY-MM-DD" to day indices
2. **Create penalty variables**: Binary variables for each medium-blocked shift
3. **Link constraints**: `penalty_var >= shift_assignment`
   - If shift assigned → penalty must be 1
   - If shift not assigned → penalty can be 0 (optimizer minimizes)
4. **Store in dict**: `self.medium_penalty_vars` for objective function
5. **Add to objective**: `-30 * sum(medium_penalty_vars)`

## UI/UX Design

### Compact Calendar (max-w-3xl)
- Date boxes: `h-10` instead of `aspect-square`
- Reduced padding: `p-3` instead of `p-4`
- Grid: 7 columns (one per weekday)
- Less scrolling required

### Color Theming
```typescript
const colors = variant === 'hard' ? {
  icon: <Calendar className="text-red-600" />,
  title: 'Arbetstillfällen jag ej kan jobba',
  badgeBg: 'bg-red-600',
  badgeText: 'text-red-600',
  hoverBg: 'hover:bg-red-50'
} : {
  icon: <AlertTriangle className="text-amber-600" />,
  title: 'Arbetstillfällen jag helst avstår',
  badgeBg: 'bg-amber-600',
  badgeText: 'text-amber-600',
  hoverBg: 'hover:bg-amber-50'
};
```

### Variant Prop Pattern
Single component (`HardBlockedSlotsDialog`) serves both use cases:
- `variant="hard"` → Red theme, hard constraints
- `variant="medium"` → Amber theme, medium penalties

## User Flow

1. Employee opens WorkPreferences
2. Sees merged "Önskade arbetspass" card with:
   - Passtyper (shift type toggles)
   - Tillgängliga dagar (day toggles)
3. For stronger preferences:
   - "Arbetstillfällen jag helst avstår" (amber) → Medium blocks
   - "Arbetstillfällen jag ej kan jobba" (red) → Hard blocks
4. Clicks "Välj datum" → Opens calendar dialog
5. Selects date → Chooses shift types
6. Badge appears showing blocked slot
7. Can have max 3 of each type

## Testing Strategy

### Manual Testing
1. Create employee with all 3 constraint levels
2. Soft: Prefer day shifts, available Mon-Fri
3. Medium: Block 2 specific dates (amber)
4. Hard: Block 1 specific date (red)
5. Generate schedule
6. Verify:
   - Hard blocks: Never scheduled
   - Medium blocks: Scheduled only if absolutely needed
   - Soft prefs: Respected when possible

### Console Logging
```typescript
// Frontend
console.log(`🚫 Hard blocked slots for ${name}:`, [...]); 
console.log(`⚠️ Medium blocked slots for ${name}:`, [...]); 

// Backend
logger.info(f"Employee {emp_id} has {len(hard_blocked_slots)} hard blocked time slots")
logger.info(f"Employee {emp_id} has {len(medium_blocked_slots)} medium blocked time slots")
logger.info(f"✓ Created {medium_blocked_count} medium blocked penalty variables")
```

## Deployment Status

### Frontend ✅
- Committed: ce0bee9 + 25e6872
- Pushed to GitHub
- Auto-deploying to Vercel

### Backend ✅
- Committed: 9fc48bf
- Pushed to GitHub
- Ready for Render deployment

## Mathematical Foundation

### Why Penalty-Based for Medium?
Hard constraints using `== 0` are absolute - optimizer cannot violate them.
Penalty-based constraints are *preferences* - optimizer weighs them against coverage needs.

**Medium penalty weight (30)** is:
- **Stronger** than soft preferences (8-12): Medium blocks are more important
- **Weaker** than coverage (100): Can be overridden if needed for staffing
- **Between** soft and hard: Creates graduated preference scale

### Optimization Trade-offs
When faced with staffing crisis:
1. Optimizer tries to maintain coverage (100x)
2. Avoids medium blocks if possible (30x penalty)
3. But will schedule medium block if necessary to fill shift
4. Never schedules hard block (mathematical constraint)

## Key Benefits

1. **Graduated Control**: Users can express nuance (prefer vs impossible)
2. **Flexibility**: System adapts to staffing levels
3. **Fair Compromise**: Balances individual preferences with organizational needs
4. **Clear Communication**: Color coding makes constraint strength obvious
5. **Optimal Schedules**: Gurobi can find better solutions when given flexibility

## Future Enhancements

- [ ] Analytics dashboard showing how often medium blocks are violated
- [ ] Notification to employees when medium block is scheduled
- [ ] Manager override notes for medium block assignments
- [ ] Seasonal adjustment of penalty weights based on staffing levels
- [ ] Export constraint violation report

## Related Documentation
- `HARD_BLOCKED_SLOTS_FEATURE.md` - Original hard blocks implementation
- `GUROBI_INTEGRATION.md` - General Gurobi optimization details
- `STAFFING_EXPERIENCE_GUIDE.md` - Experience-based constraints

---
**Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Status**: ✅ Complete and deployed
