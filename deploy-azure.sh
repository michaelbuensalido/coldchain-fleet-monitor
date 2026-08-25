#!/usr/bin/env bash
set -e

echo "🚀 Starting ColdChainIQ Azure Infrastructure Provisioning..."

# Configuration Variables
RESOURCE_GROUP=${RESOURCE_GROUP:-"rg-coldchain-prod"}
LOCATION=${LOCATION:-"eastus"}
ACR_NAME=${ACR_NAME:-"acrcoldchainprod$RANDOM"}
DB_SERVER=${DB_SERVER:-"pg-coldchain-prod-$RANDOM"}
DB_USER=${DB_USER:-"coldchainuser"}
DB_PASSWORD=${DB_PASSWORD:-"P@ssw0rdColdChain2026!"}
REDIS_NAME=${REDIS_NAME:-"redis-coldchain-$RANDOM"}
ACA_ENV=${ACA_ENV:-"env-coldchain-prod"}
BACKEND_APP="coldchain-backend"

echo "1. Creating Resource Group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo "2. Creating Azure Container Registry '$ACR_NAME'..."
az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true

echo "3. Provisioning Azure Database for PostgreSQL Flexible Server..."
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER" \
  --location "$LOCATION" \
  --admin-user "$DB_USER" \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --database-name coldchain

echo "4. Configuring PostgreSQL Firewall for Azure Services..."
az postgres flexible-server firewall-rule create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER" \
  --rule-name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

echo "5. Provisioning Azure Cache for Redis..."
az redis create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$REDIS_NAME" \
  --location "$LOCATION" \
  --sku Basic \
  --vm-size c0

echo "6. Creating Container Apps Environment..."
az containerapp env create \
  --name "$ACA_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

echo "✅ Provisioning complete!"
echo "--------------------------------------------------------"
echo "ACR Name:      $ACR_NAME"
echo "PostgreSQL:    $DB_SERVER.postgres.database.azure.com"
echo "Database URL:  postgresql://$DB_USER:$DB_PASSWORD@$DB_SERVER.postgres.database.azure.com:5432/coldchain?sslmode=require"
echo "--------------------------------------------------------"
