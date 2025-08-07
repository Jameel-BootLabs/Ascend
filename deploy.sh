#!/bin/bash

# Production Deployment Script for SecureLearn Portal
set -e

echo "🚀 Starting SecureLearn Portal Production Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy production.env.example to .env and configure your production settings."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DATABASE_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "SESSION_SECRET" "BASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Check if database is accessible
echo "🔍 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check your DATABASE_URL and ensure the database is running"
    exit 1
fi
echo "✅ Database connection successful"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "🚀 Starting SecureLearn Portal..."
echo "📍 Application will be available at: $BASE_URL"
echo "🔧 Environment: $NODE_ENV"

npm start 