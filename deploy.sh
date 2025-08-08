#!/bin/bash

# Production Deployment Script for SecureLearn Portal
set -e

echo "🚀 Starting SecureLearn Portal Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pre-deployment scan should be skipped
SKIP_SCAN=${SKIP_SCAN:-false}

if [ "$SKIP_SCAN" != "true" ]; then
    print_status "Running pre-deployment code scan..."
    
    if [ -f "scripts/pre-deploy-scan.sh" ]; then
        if bash scripts/pre-deploy-scan.sh; then
            print_success "Pre-deployment scan completed successfully"
        else
            print_error "Pre-deployment scan failed"
            print_error "To skip the scan, run: SKIP_SCAN=true ./deploy.sh"
            exit 1
        fi
    else
        print_warning "Pre-deployment scan script not found, continuing with deployment..."
    fi
else
    print_warning "Skipping pre-deployment scan (SKIP_SCAN=true)"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_error "Please copy production.env.example to .env and configure your production settings."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DATABASE_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "SESSION_SECRET" "BASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "$var is not set in .env file"
        exit 1
    fi
done

print_success "Environment variables validated"

# Check if database is accessible
print_status "Testing database connection..."
if command -v psql &> /dev/null; then
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database"
        print_error "Please check your DATABASE_URL and ensure the database is running"
        exit 1
    fi
    print_success "Database connection successful"
else
    print_warning "psql not available - skipping database connection test"
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Run database migrations
print_status "Running database migrations..."
npm run db:push

# Build the application (skip if already built by scan)
if [ "$SKIP_SCAN" = "true" ] || [ ! -d "dist" ]; then
    print_status "Building application..."
    npm run build
else
    print_status "Using existing build from pre-deployment scan"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    print_status "Creating uploads directory..."
    mkdir -p uploads
    chmod 755 uploads
fi

# Set proper permissions for .env file
if [ -f ".env" ]; then
    chmod 600 .env
    print_success "Set secure permissions for .env file"
fi

# Start the application
print_status "Starting SecureLearn Portal..."
echo "📍 Application will be available at: $BASE_URL"
echo "🔧 Environment: $NODE_ENV"

# Check if running in Docker
if [ -f "/.dockerenv" ] || [ -f "/proc/1/cgroup" ] && grep -q docker /proc/1/cgroup; then
    print_status "Running in Docker container"
    npm start
else
    # Check if PM2 is available for process management
    if command -v pm2 &> /dev/null; then
        print_status "Using PM2 for process management"
        pm2 start dist/index.js --name "securelearn-portal" --env production
        pm2 save
        print_success "Application started with PM2"
        print_status "Use 'pm2 logs securelearn-portal' to view logs"
        print_status "Use 'pm2 stop securelearn-portal' to stop the application"
    else
        print_status "Starting application directly"
        npm start
    fi
fi 