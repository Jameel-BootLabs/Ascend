# Code Scanning Guide

This document explains how to use the pre-deployment code scanning system for the SecureLearn Portal.

## Overview

The code scanning system performs comprehensive checks before deployment to ensure code quality, security, and readiness for production. It includes:

- **Security Audits**: npm audit and vulnerability scanning
- **Type Safety**: TypeScript compilation checks
- **Code Quality**: Console statements, TODO comments, dependency health
- **Environment Validation**: Configuration and database connectivity
- **Build Verification**: Application build testing
- **File Permissions**: Security checks for sensitive files

## Quick Start

### Run Pre-Deployment Scan Only
```bash
npm run scan
```

### Run Full Deployment with Scan
```bash
npm run deploy
```

### Deploy Without Scan (Emergency)
```bash
npm run deploy:skip-scan
```

## Manual Usage

### Pre-Deployment Scan Script
```bash
# Make script executable (first time only)
chmod +x scripts/pre-deploy-scan.sh

# Run the scan
bash scripts/pre-deploy-scan.sh
```

### Deployment Script
```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Run deployment with scan
./deploy.sh

# Skip scan (emergency deployment)
SKIP_SCAN=true ./deploy.sh
```

## What the Scan Checks

### 1. Dependencies Check
- ✅ Verifies npm, Node.js, TypeScript are installed
- ✅ Checks for required build tools

### 2. TypeScript Compilation
- ✅ Runs `tsc --noEmit` to check type safety
- ✅ Ensures no TypeScript errors before deployment

### 3. Security Audit
- ✅ Runs `npm audit --audit-level=moderate`
- ✅ Identifies known vulnerabilities in dependencies
- ✅ Prompts for confirmation if vulnerabilities found

### 4. Dependency Health
- ✅ Checks for outdated packages
- ✅ Identifies unused dependencies (if depcheck available)
- ✅ Reports dependency status

### 5. Code Quality
- ✅ Scans for `console.log` statements in production code
- ✅ Finds TODO/FIXME comments
- ✅ Reports code quality issues

### 6. Environment Configuration
- ✅ Validates `.env` file exists
- ✅ Checks required environment variables are set:
  - `DATABASE_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `SESSION_SECRET`
  - `BASE_URL`

### 7. Database Schema
- ✅ Tests database connectivity (if psql available)
- ✅ Verifies schema files exist
- ✅ Validates database configuration

### 8. File Permissions
- ✅ Checks uploads directory permissions
- ✅ Validates `.env` file security (should be 600 or 400)
- ✅ Ensures proper file access controls

### 9. Docker Configuration
- ✅ Checks for Dockerfile and docker-compose.yml
- ✅ Identifies common Docker security issues
- ✅ Validates container configuration

### 10. Build Test
- ✅ Runs `npm run build`
- ✅ Verifies build output exists and is valid
- ✅ Ensures application can be built successfully

## GitHub Actions Integration

The scanning system is integrated with GitHub Actions for automated checks:

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs
1. **Code Scan**: Full pre-deployment scan with database
2. **Security Audit**: npm audit and Snyk security scanning
3. **Code Quality**: TypeScript, ESLint, and code quality checks
4. **Build Test**: Application build verification

### Setup
1. Ensure your repository has the workflow file: `.github/workflows/pre-deploy-scan.yml`
2. For Snyk integration, add `SNYK_TOKEN` to repository secrets
3. The workflow will run automatically on specified triggers

## Configuration

### Environment Variables
The scan checks for these required environment variables:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-64-character-session-secret
BASE_URL=https://yourdomain.com
```

### Customization
You can customize the scan by modifying `scripts/pre-deploy-scan.sh`:

- Add new checks in the `main()` function
- Modify severity levels for warnings/errors
- Add project-specific validation rules

## Troubleshooting

### Common Issues

#### Scan Fails with Missing Dependencies
```bash
# Install missing tools
npm install -g typescript
npm install -g depcheck  # Optional
```

#### Security Vulnerabilities Found
```bash
# Fix vulnerabilities
npm audit fix

# Or update specific packages
npm update package-name
```

#### TypeScript Errors
```bash
# Check TypeScript errors
npm run check

# Fix type issues before running scan
```

#### Database Connection Issues
```bash
# Ensure database is running
# Check DATABASE_URL in .env
# Verify network connectivity
```

#### Permission Issues
```bash
# Fix file permissions
chmod 600 .env
chmod 755 uploads/
chmod +x scripts/pre-deploy-scan.sh
chmod +x deploy.sh
```

### Emergency Deployment
If you need to deploy immediately without scanning:

```bash
# Skip scan entirely
SKIP_SCAN=true npm run deploy

# Or use the skip-scan script
npm run deploy:skip-scan
```

## Best Practices

### Before Deployment
1. **Always run the scan** before production deployment
2. **Review warnings** and address critical issues
3. **Test in staging** environment first
4. **Verify environment variables** are correctly set

### During Development
1. **Run scans locally** before committing
2. **Address security vulnerabilities** promptly
3. **Keep dependencies updated** regularly
4. **Use TypeScript strictly** to catch issues early

### Monitoring
1. **Check GitHub Actions** for automated scan results
2. **Review scan artifacts** for detailed reports
3. **Monitor deployment logs** for any issues
4. **Set up alerts** for failed scans

## Integration with CI/CD

### GitHub Actions
The workflow automatically runs on:
- Push to main/develop branches
- Pull requests to main/develop branches

### Other CI/CD Platforms
You can integrate the scan script with other platforms:

```yaml
# Example for GitLab CI
deploy:
  script:
    - npm ci
    - npm run scan
    - npm run deploy
  only:
    - main
```

```yaml
# Example for Jenkins
pipeline {
    agent any
    stages {
        stage('Scan') {
            steps {
                sh 'npm run scan'
            }
        }
        stage('Deploy') {
            steps {
                sh 'npm run deploy'
            }
        }
    }
}
```

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use secure, randomly generated secrets
- Rotate secrets regularly
- Use different secrets for different environments

### File Permissions
- `.env` files should have 600 permissions
- Upload directories should be writable (755)
- Scripts should be executable (755)

### Database Security
- Use strong database passwords
- Limit database access to necessary IPs
- Enable SSL for database connections
- Regular database backups

## Support

For issues with the scanning system:

1. Check the scan output for specific error messages
2. Verify all dependencies are installed
3. Ensure environment configuration is correct
4. Review the troubleshooting section above
5. Check GitHub Actions logs for automated scan issues

## Contributing

To improve the scanning system:

1. Add new checks to `scripts/pre-deploy-scan.sh`
2. Update this documentation
3. Test changes thoroughly
4. Submit pull requests for review 