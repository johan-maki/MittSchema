#!/usr/bin/env python3
"""
Test script to verify coverage calculation fixes
"""

# Simulate old (buggy) calculation
def old_coverage_calculation(num_days, num_shift_types):
    """Old buggy calculation - only counts shift types, not people needed"""
    total_shifts = num_days * num_shift_types
    return total_shifts

# Simulate new (correct) calculation
def new_coverage_calculation(num_days, num_shift_types, min_staff_per_shift):
    """New correct calculation - counts total person-shifts needed"""
    total_shifts = num_days * num_shift_types * min_staff_per_shift
    return total_shifts

# Test scenario from user's screenshot
# November 2025: 30 days, 3 shift types (morgon, kväll, natt), 4 people per shift (typical)
num_days = 30
num_shift_types = 3
min_staff_per_shift = 4  # This is what causes the problem!

old_total = old_coverage_calculation(num_days, num_shift_types)
new_total = new_coverage_calculation(num_days, num_shift_types, min_staff_per_shift)

print("📊 Coverage Calculation Test")
print("=" * 60)
print(f"Scenario: {num_days} days, {num_shift_types} shift types, {min_staff_per_shift} staff per shift")
print()
print(f"❌ OLD (BUGGY) calculation:")
print(f"   Total shifts needed: {old_total}")
print(f"   Formula: {num_days} days × {num_shift_types} shift types = {old_total}")
print()
print(f"✅ NEW (CORRECT) calculation:")
print(f"   Total shifts needed: {new_total}")
print(f"   Formula: {num_days} days × {num_shift_types} shift types × {min_staff_per_shift} staff = {new_total}")
print()

# Simulate user's scenario: 106 shifts filled
filled_shifts = 106
old_coverage = (filled_shifts / old_total) * 100
new_coverage = (filled_shifts / new_total) * 100

print(f"🎯 With {filled_shifts} shifts filled:")
print(f"   OLD calculation: {old_coverage:.1f}% coverage (WRONG - misleadingly high!)")
print(f"   NEW calculation: {new_coverage:.1f}% coverage (CORRECT)")
print()

# Calculate how many more shifts are actually needed
missing_shifts = new_total - filled_shifts
print(f"⚠️  Missing shifts: {missing_shifts}")
print(f"   ({missing_shifts} more person-shifts needed for 100% coverage)")
print()
print("=" * 60)
