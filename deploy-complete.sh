#!/bin/bash

# Complete Vercel + AWS deployment script
# This shows the two-part deployment process

set -e

echo "🚀 Starting Vercel + AWS Lambda deployment..."
echo ""

###############################################
# PART 1: Deploy AWS Backend (Terraform)
###############################################

echo "📡 STEP 1: Deploying AWS Backend..."
cd infrastructure/terraform

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found!"
    echo "Please create it with:"
    echo "openai_api_key = \"your-key\""
    echo "s3_bucket_name = \"your-bucket-name\""
    echo "custom_domain = \"yourdomain.cz\"  # optional"
    exit 1
fi

# Deploy AWS infrastructure
echo "🔧 Initializing Terraform..."
terraform init

echo "📋 Planning AWS deployment..."
terraform plan

echo "🚀 Deploying to AWS..."
terraform apply -auto-approve

# Get API Gateway URL
API_URL=$(terraform output -raw api_stage_url)
echo ""
echo "✅ AWS Backend deployed successfully!"
echo "📡 API Gateway URL: $API_URL"
echo ""

###############################################
# PART 2: Configure and Deploy Vercel Frontend
###############################################

echo "🌐 STEP 2: Configuring Vercel Frontend..."
cd ../../frontend

# Update .env.production with actual API URL
echo "📝 Updating frontend environment variables..."
cat > .env.production << EOF
# Production environment variables for Vercel
REACT_APP_API_BASE_URL=$API_URL
REACT_APP_GA_MEASUREMENT_ID=${GA_MEASUREMENT_ID:-}
EOF

echo "✅ Frontend configured with API URL: $API_URL"
echo ""

# Test build locally
echo "🏗️ Testing frontend build..."
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT PREPARATION COMPLETE!"
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                    NEXT STEPS                               │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│                                                             │"
echo "│ 1. Go to https://vercel.com/                                │"
echo "│ 2. Import your GitHub repository                            │"
echo "│ 3. Configure Vercel project:                                │"
echo "│    - Root Directory: frontend                               │"
echo "│    - Build Command: npm run build                          │"
echo "│    - Output Directory: build                                │"
echo "│                                                             │"
echo "│ 4. Add environment variable in Vercel:                     │"
echo "│    Key:   REACT_APP_API_BASE_URL                           │"
echo "│    Value: $API_URL"
echo "│                                                             │"
echo "│ 5. Deploy!                                                  │"
echo "│                                                             │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

# Optional: If Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🤖 Vercel CLI detected! Would you like to deploy automatically?"
    read -p "Deploy to Vercel now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to Vercel..."
        
        # Set environment variable
        vercel env add REACT_APP_API_BASE_URL production <<< "$API_URL"
        
        # Deploy
        vercel --prod
        
        echo "✅ Vercel deployment complete!"
    fi
else
    echo "💡 TIP: Install Vercel CLI for automated deployment:"
    echo "npm i -g vercel"
fi

echo ""
echo "🎯 ARCHITECTURE SUMMARY:"
echo "Frontend: Vercel CDN (Free)"
echo "Backend:  AWS Lambda + API Gateway (~$3-5/month)"
echo "Data:     AWS S3 (~$0.50/month)"
echo "Total:    ~$3-6/month for Czech Republic"
echo ""
echo "✅ Ready for Czech users! 🇨🇿"