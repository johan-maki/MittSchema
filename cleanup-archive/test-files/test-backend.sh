#!/bin/bash

echo "🔍 Testing backend health after deployment..."

# Test health endpoint
echo "Testing health endpoint..."
curl -s https://mittschema-gurobi-backend.onrender.com/health | python3 -m json.tool

echo ""
echo "🎯 Backend should be ready for the hard/soft constraints feature!"
echo "Now you can:"
echo "1. Go to https://mitt-schema.vercel.app/employees"
echo "2. Edit Erik Eriksson settings"
echo "3. Check 'Hårt krav' for available days"
echo "4. Generate new schedule"
