#!/bin/bash

echo "⏳ Waiting for Render deployment to complete..."
echo "🔧 Fix commit: 9560ff9 - Add missing mathematical constraints for available_days_strict"
echo ""

attempt=1
max_attempts=20
sleep_time=15

while [ $attempt -le $max_attempts ]; do
    echo "🧪 Test attempt $attempt/$max_attempts..."
    
    # Test the fix
    result=$(node test-deployed-fix.mjs 2>&1)
    
    if echo "$result" | grep -q "SUCCESS! Fix is deployed"; then
        echo "🎉 DEPLOYMENT COMPLETE! Fix is working!"
        echo ""
        echo "✅ Erik constraint bug is now FIXED on production backend"
        echo "✅ available_days_strict=true now properly blocks weekend shifts"
        echo ""
        echo "📋 Summary:"
        echo "  - Problem: Erik received weekend shifts despite available_days_strict=true"
        echo "  - Root cause: Missing mathematical constraints in Gurobi backend"
        echo "  - Solution: Added model.addConstr loop in _add_employee_preference_constraints"
        echo "  - Status: DEPLOYED and WORKING ✅"
        exit 0
    elif echo "$result" | grep -q "Fix not deployed yet"; then
        echo "⏳ Deployment still in progress... (attempt $attempt/$max_attempts)"
        echo "   Next check in ${sleep_time} seconds..."
        echo ""
        sleep $sleep_time
        ((attempt++))
    else
        echo "❌ Unexpected result:"
        echo "$result"
        ((attempt++))
        sleep $sleep_time
    fi
done

echo "❌ Deployment did not complete within expected time"
echo "💡 Check https://dashboard.render.com manually for deployment status"
