#!/bin/bash

# Azure Deployment Script for Pipeline Monitoring App
# This script creates resources and deploys the Next.js app to Azure

set -e

echo "🚀 Starting Azure Deployment for Pipeline Monitoring App"
echo ""

# Variables
RESOURCE_GROUP="pipeline-monitoring-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="pipeline-monitoring-plan"
APP_NAME="pipeline-monitoring-app"
TENANT_ID="146179ee-8cb1-44b2-b39a-fdac34d3aa8a"

echo "📋 Using the following configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   App Service Plan: $APP_SERVICE_PLAN"
echo "   App Name: $APP_NAME"
echo ""

# Login with tenant
echo "🔐 Logging in to Azure with tenant..."
az login --tenant $TENANT_ID --use-device-code

# Create resource group
echo ""
echo "📦 Creating resource group: $RESOURCE_GROUP..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (B1 = Basic, suitable for demo)
echo ""
echo "📊 Creating App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create Web App
echo ""
echo "🌐 Creating Web App: $APP_NAME..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_NAME \
  --runtime "NODE|18-lts"

# Configure app settings
echo ""
echo "⚙️  Configuring app settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    WEBSITES_NODE_DEFAULT_VERSION="18.17.1" \
    NODE_ENV="production" \
    OPENAI_API_KEY="$OPENAI_API_KEY"

# Configure deployment from GitHub
echo ""
echo "🔗 Configuring GitHub deployment..."
az webapp deployment github-actions add \
  --repo kubo56/pipeline-monitoring \
  --branch main \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --runtime "node:18"

echo ""
echo "✅ Deployment setup complete!"
echo ""
echo "📍 Your app will be available at: https://$APP_NAME.azurewebsites.net"
echo ""
echo "🔄 The app will automatically deploy when you push to the main branch on GitHub."
echo ""
echo "💡 Next steps:"
echo "   1. Set OPENAI_API_KEY in Azure Portal App Settings if not already set"
echo "   2. Push a commit to GitHub to trigger the deployment"
echo "   3. Monitor the deployment in GitHub Actions"
