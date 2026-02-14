#!/bin/bash

# Test script for EBS scanning functionality

echo "🧪 Testing EBS Scanner API"
echo "=========================="
echo ""

# First, create a test cloud account (if not already exists)
echo "📝 Step 1: Creating test cloud account..."
ACCOUNT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "Test AWS Account",
    "provider": "AWS",
    "accessKey": "'"$AWS_ACCESS_KEY"'",
    "secretKey": "'"$AWS_SECRET_KEY"'",
    "region": "us-east-1"
  }')

echo "Response: $ACCOUNT_RESPONSE"
ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Account ID: $ACCOUNT_ID"
echo ""

# Run the scanner
echo "🔍 Step 2: Running EBS volume scan..."
SCAN_RESPONSE=$(curl -s http://localhost:3000/api/scanner/run/$ACCOUNT_ID)

echo "Scan Results:"
echo "$SCAN_RESPONSE" | jq '.'
echo ""

echo "✅ Test complete!"
