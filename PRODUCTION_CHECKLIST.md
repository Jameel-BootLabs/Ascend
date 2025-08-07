# Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Configuration
- [ ] Copy `production.env.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `DATABASE_URL`
- [ ] Set production `BASE_URL` (https://yourdomain.com)
- [ ] Generate secure `SESSION_SECRET` (64+ characters)
- [ ] Configure production Google OAuth credentials

### ✅ Database Setup
- [ ] Create production PostgreSQL database
- [ ] Ensure database is accessible from deployment environment
- [ ] Run `npm run db:push` to create schema
- [ ] Verify all tables are created (users, sessions, training_sections, etc.)

### ✅ Google OAuth Production Setup
- [ ] Create production OAuth 2.0 credentials in Google Cloud Console
- [ ] Add production domain to authorized JavaScript origins
- [ ] Add production callback URL: `https://yourdomain.com/api/auth/google/callback`
- [ ] Test OAuth flow with production credentials

### ✅ Security Configuration
- [ ] Generate secure session secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Ensure HTTPS is configured (for production)
- [ ] Set secure cookie options (httpOnly, secure, sameSite)
- [ ] Configure proper CORS settings if needed

### ✅ Application Build
- [ ] Run `npm run build` successfully
- [ ] Verify `dist/` directory is created
- [ ] Test production build locally: `npm start`

## Deployment Options

### Option 1: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run Docker container
docker build -t securelearn-portal .
docker run -p 3000:3000 --env-file .env securelearn-portal
```

### Option 2: Direct Deployment
```bash
# Use the deployment script
./deploy.sh

# Or manual deployment
npm ci --only=production
npm run db:push
npm run build
npm start
```

### Option 3: Cloud Platform Deployment
- **Google Cloud Run**: Use Dockerfile
- **AWS ECS**: Use Dockerfile with task definition
- **Heroku**: Use Procfile and environment variables
- **Railway/Render**: Connect GitHub repo and set environment variables

## Post-Deployment Verification

### ✅ Application Health
- [ ] Application starts without errors
- [ ] Health check endpoint responds: `GET /api/auth/user` (should return 401 for unauthenticated)
- [ ] Database connection is working
- [ ] Session storage is working

### ✅ OAuth Authentication
- [ ] Google OAuth login works
- [ ] Users are created in database on first login
- [ ] Sessions persist across requests
- [ ] Logout functionality works

### ✅ Core Features
- [ ] Training sections load correctly
- [ ] Training modules are accessible
- [ ] Assessment questions work
- [ ] Certificate generation works
- [ ] Admin features work (if admin user exists)

### ✅ File Uploads
- [ ] Upload directory is writable
- [ ] File uploads work correctly
- [ ] Uploaded files are accessible

## Monitoring and Maintenance

### ✅ Logging
- [ ] Application logs are being captured
- [ ] Error logs are monitored
- [ ] Database connection logs are available

### ✅ Performance
- [ ] Application response times are acceptable
- [ ] Database queries are optimized
- [ ] Static assets are being served efficiently

### ✅ Security
- [ ] HTTPS is enforced in production
- [ ] Session cookies are secure
- [ ] OAuth credentials are properly secured
- [ ] Database credentials are secure

## Troubleshooting

### Common Issues
1. **OAuth Redirect URI Mismatch**: Verify callback URL in Google Cloud Console
2. **Database Connection**: Check DATABASE_URL and network connectivity
3. **Session Issues**: Verify SESSION_SECRET and database connection
4. **Build Errors**: Check Node.js version and dependencies

### Emergency Rollback
```bash
# Stop the application
docker-compose down
# or
pkill -f "node dist/index.js"

# Rollback to previous version
git checkout <previous-commit>
./deploy.sh
```

## Support

For issues or questions:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review OAuth configuration
5. Check deployment platform documentation 