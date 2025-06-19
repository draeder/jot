#!/bin/bash

# Jot Cloudflare Deployment Script
set -e

echo "🚀 Jot Cloudflare Deployment Script"
echo "===================================="

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    echo "   macOS: brew install terraform"
    echo "   Other: https://www.terraform.io/downloads"
    exit 1
fi

# Check if we're in the terraform directory
if [[ ! -f "main.tf" ]]; then
    echo "❌ Please run this script from the terraform directory"
    exit 1
fi

# Check if terraform.tfvars exists
if [[ ! -f "terraform.tfvars" ]]; then
    echo "❌ terraform.tfvars not found"
    echo "   Please copy terraform.tfvars.example to terraform.tfvars and fill in your values"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Initialize Terraform if needed
if [[ ! -d ".terraform" ]]; then
    echo "🔧 Initializing Terraform..."
    terraform init
    echo ""
fi

# Validate configuration
echo "🔍 Validating Terraform configuration..."
terraform validate
echo "✅ Configuration is valid"
echo ""

# Format files
echo "🎨 Formatting Terraform files..."
terraform fmt
echo ""

# Show plan
echo "📋 Showing deployment plan..."
echo "   Review the changes carefully before proceeding"
echo ""
terraform plan

echo ""
read -p "❓ Do you want to apply these changes? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Cloudflare Pages..."
    terraform apply -auto-approve
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your OAuth application redirect URIs with the deployed URLs"
    echo "2. Test authentication with your configured providers"
    echo "3. Monitor the deployment in Cloudflare Pages dashboard"
    echo ""
    echo "📊 Deployment outputs:"
    terraform output
else
    echo "❌ Deployment cancelled"
fi
