#!/bin/bash

# Development setup script for SecureLearnPortal

echo "Setting up development environment..."

# Export basic environment variables for development
export NODE_ENV=development
export BASE_URL="http://localhost:3000"
export DATABASE_URL="postgresql://postgres:password@localhost:5432/securelearn_dev"
export GOOGLE_CLIENT_ID="dummy-client-id"
export GOOGLE_CLIENT_SECRET="dummy-client-secret"
export SESSION_SECRET="development-secret-key"

echo "Environment variables set:"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=$DATABASE_URL"
echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
echo "SESSION_SECRET=***"

echo ""
echo "To run the development server:"
echo "npm run dev"
echo ""
echo "Note: Update these environment variables with real values for full functionality"