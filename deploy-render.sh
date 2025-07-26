#!/bin/bash

# Render Deploy Script
# Sätt din API token och service ID här

RENDER_API_TOKEN="rnd_Bqe3dcVzC7UP560kPpMdhiikpl8U"
SERVICE_ID="srv-d1a08195pdvs73aa5vu0"

echo "🚀 Triggering Render deployment..."

curl -X POST \
  "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "✅ Deployment triggered! Check https://dashboard.render.com for progress."
