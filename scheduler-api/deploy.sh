#!/bin/bash

# Scheduler API Deployment Script
# This script helps deploy the scheduler API to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
SERVICE_NAME="scheduler-api"
REGION=${REGION:-"europe-north2"}
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}🚀 Scheduler API Deployment Script${NC}"
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo

# Check if required environment variables are set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${RED}❌ Please set PROJECT_ID environment variable${NC}"
    echo "Example: export PROJECT_ID=my-gcp-project"
    exit 1
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}❌ Please set SUPABASE_URL and SUPABASE_KEY environment variables${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $IMAGE_NAME .

echo -e "${YELLOW}📤 Pushing to Google Container Registry...${NC}"
docker push $IMAGE_NAME

echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="SUPABASE_URL=${SUPABASE_URL},SUPABASE_KEY=${SUPABASE_KEY}" \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10 \
    --timeout=300

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo
echo -e "${GREEN}📋 Service Information:${NC}"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
