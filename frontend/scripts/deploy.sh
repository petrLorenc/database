#!/bin/bash

# Deployment script for AWS S3 with CloudFront
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-staging}
BUILD_DIR="build"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration based on environment
case $ENVIRONMENT in
  production)
    S3_BUCKET="your-production-bucket"
    CLOUDFRONT_DISTRIBUTION="YOUR_PRODUCTION_DISTRIBUTION_ID"
    DOMAIN="https://your-domain.com"
    ;;
  staging)
    S3_BUCKET="your-staging-bucket"
    CLOUDFRONT_DISTRIBUTION="YOUR_STAGING_DISTRIBUTION_ID"
    DOMAIN="https://staging.your-domain.com"
    ;;
  *)
    echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: ./scripts/deploy.sh [production|staging]"
    exit 1
    ;;
esac

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}⚠️  Build directory not found. Running build first...${NC}"
    npm run build
fi

echo -e "${BLUE}📊 Build summary:${NC}"
echo "  - React app built: $(ls -la $BUILD_DIR/static/js/*.js | wc -l) JS files"
echo "  - Static pages: $(ls -la $BUILD_DIR/activities/*.html 2>/dev/null | wc -l) HTML files"
echo "  - Target S3 bucket: $S3_BUCKET"
echo "  - Target domain: $DOMAIN"

# Ask for confirmation
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}📤 Uploading to S3...${NC}"

# Sync build directory to S3
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET --delete \
  --cache-control "max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML files with no-cache headers
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET \
  --cache-control "no-cache" \
  --include "*.html" \
  --include "*.json"

# Upload static activity pages with specific headers
if [ -d "$BUILD_DIR/activities" ]; then
  aws s3 sync $BUILD_DIR/activities/ s3://$S3_BUCKET/activities/ \
    --cache-control "max-age=86400" \
    --content-type "text/html"
fi

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# Invalidate CloudFront cache
if [ ! -z "$CLOUDFRONT_DISTRIBUTION" ]; then
    echo -e "${BLUE}🔄 Invalidating CloudFront cache...${NC}"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_DISTRIBUTION \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text)
    
    echo "  - Invalidation ID: $INVALIDATION_ID"
    echo "  - Status: Initiated"
    echo -e "${GREEN}✅ CloudFront invalidation started${NC}"
else
    echo -e "${YELLOW}⚠️  No CloudFront distribution configured${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${BLUE}🌍 Your site is available at: $DOMAIN${NC}"

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $HTTP_STATUS -eq 200 ]; then
    echo -e "${GREEN}✅ Site is responding correctly${NC}"
else
    echo -e "${RED}❌ Site returned HTTP $HTTP_STATUS${NC}"
fi

echo ""
echo -e "${BLUE}📋 Post-deployment checklist:${NC}"
echo "  □ Test main page: $DOMAIN"
echo "  □ Test activity page: $DOMAIN/activity/1"
echo "  □ Test static page: $DOMAIN/activities/1.html"
echo "  □ Check Google Search Console for indexing"
echo "  □ Verify social media previews"
echo ""

# Optional: Open browser
read -p "Open site in browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open $DOMAIN
    elif command -v open &> /dev/null; then
        open $DOMAIN
    else
        echo "Please open $DOMAIN in your browser"
    fi
fi