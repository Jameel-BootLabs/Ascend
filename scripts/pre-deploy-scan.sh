#!/bin/bash

# Pre-Deployment Code Scanning Script for SecureLearn Portal
set -e

echo "🔍 Starting Pre-Deployment Code Scan..."

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking required dependencies..."
    
    local missing_deps=()
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Check for TypeScript
    if ! npx tsc --version &> /dev/null; then
        missing_deps+=("typescript")
    fi
    
    # Check for audit tools
    if ! command -v npx &> /dev/null; then
        missing_deps+=("npx")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install missing dependencies before running the scan."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# 1. TypeScript Compilation Check
check_typescript() {
    print_status "Running TypeScript compilation check..."
    
    if npx tsc --noEmit; then
        print_success "TypeScript compilation check passed"
    else
        print_error "TypeScript compilation failed"
        exit 1
    fi
}

# 2. Security Audit
# run_security_audit() {
#     print_status "Running npm security audit..."
    
#     local audit_output
#     audit_output=$(npm audit --audit-level=moderate 2>&1 || true)
    
#     if echo "$audit_output" | grep -q "found 0 vulnerabilities"; then
#         print_success "Security audit passed - no vulnerabilities found"
#     elif echo "$audit_output" | grep -q "found [0-9]* vulnerabilities"; then
#         local vuln_count=$(echo "$audit_output" | grep -o "found [0-9]* vulnerabilities" | grep -o "[0-9]*")
#         print_warning "Security audit found $vuln_count vulnerabilities"
#         echo "$audit_output"
        
#         # Ask user if they want to continue
#         read -p "Do you want to continue with deployment despite vulnerabilities? (y/N): " -n 1 -r
#         echo
#         if [[ ! $REPLY =~ ^[Yy]$ ]]; then
#             print_error "Deployment aborted due to security vulnerabilities"
#             exit 1
#         fi
#     else
#         print_error "Security audit failed to run properly"
#         echo "$audit_output"
#         exit 1
#     fi
# }

# 3. Dependency Check
check_dependencies_health() {
    print_status "Checking dependencies health..."
    
    # Check for outdated packages
    local outdated_count
    outdated_count=$(npm outdated --depth=0 2>/dev/null | wc -l || echo "0")
    
    if [ "$outdated_count" -gt 0 ]; then
        print_warning "Found $outdated_count outdated dependencies"
        npm outdated --depth=0 2>/dev/null || true
    else
        print_success "All dependencies are up to date"
    fi
    
    # Check for unused dependencies
    if npx depcheck &> /dev/null; then
        print_success "Dependency check completed"
    else
        print_warning "Some dependencies may be unused (depcheck not available)"
    fi
}

# 4. Code Quality Checks
run_code_quality_checks() {
    print_status "Running code quality checks..."
    
    # Check for console.log statements in production code
    local console_count
    console_count=$(grep -r "console\." client/src/ server/ --include="*.ts" --include="*.tsx" | wc -l || echo "0")
    
    if [ "$console_count" -gt 0 ]; then
        print_warning "Found $console_count console statements in source code"
        grep -r "console\." client/src/ server/ --include="*.ts" --include="*.tsx" || true
    else
        print_success "No console statements found in source code"
    fi
    
    # Check for TODO/FIXME comments
    local todo_count
    todo_count=$(grep -r "TODO\|FIXME" client/src/ server/ --include="*.ts" --include="*.tsx" | wc -l || echo "0")
    
    if [ "$todo_count" -gt 0 ]; then
        print_warning "Found $todo_count TODO/FIXME comments"
        grep -r "TODO\|FIXME" client/src/ server/ --include="*.ts" --include="*.tsx" || true
    else
        print_success "No TODO/FIXME comments found"
    fi
}

# 5. Environment Configuration Check
check_environment_config() {
    print_status "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        print_error "Please copy production.env.example to .env and configure your settings"
        exit 1
    fi
    
    # Check for required environment variables
    local required_vars=("DATABASE_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "SESSION_SECRET" "BASE_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    print_success "Environment configuration is valid"
}

# 6. Build Test
test_build() {
    print_status "Testing application build..."
    
    # Clean previous build
    rm -rf dist/
    
    # Run build
    if npm run build; then
        print_success "Application build successful"
    else
        print_error "Application build failed"
        exit 1
    fi
    
    # Check if dist directory exists and has content
    if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
        print_error "Build output directory is empty or missing"
        exit 1
    fi
    
    print_success "Build test completed successfully"
}

# 7. Database Schema Check
check_database_schema() {
    print_status "Checking database schema..."
    
    # Load environment variables
    source .env
    
    # Test database connection
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_warning "Cannot connect to database - make sure it's running"
        fi
    else
        print_warning "psql not available - skipping database connection test"
    fi
    
    # Check if schema files exist
    if [ -f "shared/schema.ts" ]; then
        print_success "Database schema file found"
    else
        print_error "Database schema file not found"
        exit 1
    fi
}

# 8. File Permissions Check
check_file_permissions() {
    print_status "Checking file permissions..."
    
    # Check if uploads directory is writable
    if [ -d "uploads" ]; then
        if [ -w "uploads" ]; then
            print_success "Uploads directory is writable"
        else
            print_warning "Uploads directory is not writable"
        fi
    else
        print_warning "Uploads directory does not exist"
    fi
    
    # Check if .env file has appropriate permissions
    if [ -f ".env" ]; then
        local env_perms
        env_perms=$(stat -c "%a" .env 2>/dev/null || stat -f "%Lp" .env 2>/dev/null || echo "unknown")
        if [ "$env_perms" = "600" ] || [ "$env_perms" = "400" ]; then
            print_success ".env file has secure permissions"
        else
            print_warning ".env file permissions should be 600 or 400 (current: $env_perms)"
        fi
    fi
}

# 9. Docker Configuration Check (if applicable)
check_docker_config() {
    print_status "Checking Docker configuration..."
    
    if [ -f "Dockerfile" ]; then
        print_success "Dockerfile found"
        
        # Check for common Docker security issues
        if grep -q "USER root" Dockerfile; then
            print_warning "Dockerfile runs as root - consider using a non-root user"
        fi
        
        if grep -q "COPY.*\.env" Dockerfile; then
            print_warning "Dockerfile copies .env file - consider using environment variables instead"
        fi
    else
        print_warning "Dockerfile not found - skipping Docker checks"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        print_success "Docker Compose file found"
    fi
}

# 10. Final Summary
print_summary() {
    echo
    echo "=========================================="
    echo "           SCAN SUMMARY"
    echo "=========================================="
    print_success "Pre-deployment scan completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Run: ./deploy.sh"
    echo "3. Monitor application logs after deployment"
    echo
    echo "For production deployment, ensure:"
    echo "- HTTPS is configured"
    echo "- Database backups are set up"
    echo "- Monitoring and logging are configured"
    echo "- Security headers are properly set"
    echo "=========================================="
}

# Main execution
main() {
    echo "🚀 SecureLearn Portal - Pre-Deployment Scan"
    echo "=========================================="
    
    check_dependencies
    check_environment_config
    check_typescript
    run_security_audit
    check_dependencies_health
    run_code_quality_checks
    check_database_schema
    check_file_permissions
    check_docker_config
    test_build
    
    print_summary
}

# Run main function
main "$@" 