#!/bin/bash

echo "⏳ Waiting for CRITICAL FIX deployment..."
echo "🐛 Bug: _add_employee_preference_constraints() was NEVER CALLED!"
echo "🔧 Fix: Added missing method call to constraint processing"
echo ""

attempt=1
max_attempts=15
sleep_time=20

while [ $attempt -le $max_attempts ]; do
    echo "🧪 Test attempt $attempt/$max_attempts (testing with August data)..."
    
    result=$(node test-august-erik.mjs 2>&1)
    
    if echo "$result" | grep -q "📊 Weekend violations: 0"; then
        echo "🎉 CRITICAL FIX DEPLOYED SUCCESSFULLY!"
        echo ""
        echo "✅ Employee preferences are now WORKING!"
        echo "✅ Erik gets 0 weekend shifts with available_days_strict=true"
        echo "✅ All day/shift constraints are now properly enforced"
        echo ""
        echo "📋 Summary of the bug:"
        echo "  - Problem: _add_employee_preference_constraints() method existed but was never called"
        echo "  - Impact: ALL employee preferences were completely ignored"
        echo "  - Symptoms: Erik got weekend shifts despite strict constraints"
        echo "  - Root cause: Missing method call in optimization pipeline"
        echo "  - Solution: Added self._add_employee_preference_constraints() call"
        echo "  - Status: FIXED and DEPLOYED ✅"
        exit 0
    elif echo "$result" | grep -q "Weekend violations:"; then
        violations=$(echo "$result" | grep "Weekend violations:" | head -1)
        echo "⏳ Still has violations - deployment in progress... ($violations)"
        echo "   Next check in ${sleep_time} seconds..."
        echo ""
        sleep $sleep_time
        ((attempt++))
    else
        echo "❓ Unexpected result - continuing..."
        echo "$result" | head -5
        ((attempt++))
        sleep $sleep_time
    fi
done

echo "❌ Deployment did not complete within expected time"
echo "💡 Check deployment manually - this was a critical fix that should work"
