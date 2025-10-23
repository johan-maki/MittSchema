#!/usr/bin/env python3
"""
Debug script to analyze why only morning shifts are being assigned
"""

# Simulate the problem
print("🔍 Analyzing shift distribution problem")
print("=" * 60)
print()

# From the screenshot:
# - 106 total pass (person-shifts)
# - But only morning shifts are being assigned
# - No evening or night shifts

print("📊 Observed behavior:")
print("  - Morgon (day): ALL shifts filled with Camilla & Amanda")
print("  - Kväll (evening): ZERO shifts filled")
print("  - Natt (night): ZERO shifts filled")
print()

print("🤔 Possible causes:")
print()
print("1. Employee preferences blocking evening/night:")
print("   - Check if employees have 'preferred_shifts' = ['day'] STRICT")
print("   - Check if 'excluded_shifts' blocks evening/night")
print()
print("2. Objective function prioritizing morning shifts:")
print("   - If work_percentage targets are met with just morning shifts")
print("   - System won't assign more shifts")
print()
print("3. Max shifts per week constraint:")
print("   - If employees already hit their weekly limit with morning shifts")
print("   - No capacity left for evening/night")
print()
print("4. Cost optimization issue:")
print("   - If optimize_for_cost=False but constraints prevent spreading")
print()

print("=" * 60)
print()
print("💡 Recommendations:")
print()
print("1. Check employee preferences in database:")
print("   SELECT employee_id, preferred_shifts, excluded_shifts, ")
print("   preferred_shifts_strict FROM employee_preferences;")
print()
print("2. Check if min_staff_per_shift constraint is being enforced")
print("   for ALL shift types (day, evening, night)")
print()
print("3. Verify objective function is maximizing coverage")
print("   across ALL shift types, not just filling work_percentage")
print()
print("4. Add explicit constraint: Each day must have ALL 3 shift types filled")
print()
