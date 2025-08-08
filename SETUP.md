# SecureLearn Portal - Environment Setup Guide

This guide covers setup for all three environments: **Local Development**, **Docker**, and **Production**.

## 🚀 Quick Start

Choose your environment and follow the corresponding setup:

### 1. Local Development Setup
```bash
# Clone and install
git clone <repository-url>
cd Ascend
npm install

# Setup environment
cp env.example .env
# Edit .env with your local database and Google OAuth credentials

# Setup database
npm run db:push

# Start development server
npm run dev
```

### 2. Docker Setup
```bash
# Clone and setup environment
git clone <repository-url>
cd Ascend
cp docker.env.example .env
# Edit .env with your Google OAuth credentials

# Start with Docker Compose
docker compose up -d

# Run database migration
docker compose exec app npx drizzle-kit push --config=drizzle.config.ts
```

### 3. Production Setup
```bash
# Clone and setup environment
git clone <repository-url>
cd Ascend
cp production.env.example .env
# Edit .env with your production credentials

# Build and deploy
npm run build
npm start
```

## 📋 Environment Configuration

### Local Development (env.example)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/securelearn_dev"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SESSION_SECRET="your-secure-session-secret-key"
BASE_URL="http://localhost:3000"
NODE_ENV="development"
PORT="3000"
```

### Docker (docker.env.example)
```env
DATABASE_URL="postgresql://crashuser:crashpass@db:5432/ascend?sslmode=disable"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SESSION_SECRET="your-secure-session-secret-key"
BASE_URL="http://localhost:3000"
NODE_ENV="production"
PORT="3000"
```

### Production (production.env.example)
```env
DATABASE_URL="postgresql://username:password@your-db-host:5432/securelearn_prod"
GOOGLE_CLIENT_ID="your-production-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"
SESSION_SECRET="your-secure-production-session-secret-key"
BASE_URL="https://yourdomain.com"
NODE_ENV="production"
PORT="3000"
```

## 🔧 Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API

### 2. Create OAuth Credentials
1. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
2. Application type: "Web application"
3. Add authorized origins and redirect URIs:

**For Local Development:**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

**For Docker:**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

**For Production:**
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

### 3. Update Environment Variables
Copy the Client ID and Client Secret to your `.env` file.

## 🗄️ Database Setup

### Local Development
```bash
# Create PostgreSQL database
createdb securelearn_dev

# Run migrations
npm run db:push
```

### Docker
```bash
# Database is automatically created by Docker Compose
# Run migrations after first startup
docker compose exec app npx drizzle-kit push --config=drizzle.config.ts
```

### Production
```bash
# Create production database
createdb securelearn_prod

# Run migrations
npm run db:push
```

## 🔐 Security Configuration

### Session Secret Generation
Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Environment-Specific Security
- **Local Development**: HTTP, non-secure cookies
- **Docker**: HTTP, non-secure cookies (for development)
- **Production**: HTTPS, secure cookies

## 🐳 Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs app
docker compose logs db

# Stop services
docker compose down

# Rebuild and start
docker compose up --build -d

# Access container shell
docker compose exec app sh

# Run database migration
docker compose exec app npx drizzle-kit push --config=drizzle.config.ts
```

## 🚀 Production Deployment

### Prerequisites
- PostgreSQL database
- HTTPS-enabled domain
- Google OAuth production credentials
- Secure session secret

### Deployment Steps
1. Copy `production.env.example` to `.env`
2. Update with production values
3. Ensure HTTPS is configured
4. Run `npm run build`
5. Start with `npm start`

### Environment Variables Checklist
- [ ] `DATABASE_URL` - Production PostgreSQL connection
- [ ] `GOOGLE_CLIENT_ID` - Production OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Production OAuth client secret
- [ ] `SESSION_SECRET` - Secure random string (64+ characters)
- [ ] `BASE_URL` - HTTPS production URL
- [ ] `NODE_ENV` - Set to "production"
- [ ] `PORT` - Application port (usually 3000)

## 🔍 Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**
   - Verify callback URL in Google Cloud Console
   - Check `BASE_URL` environment variable

2. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` format
   - Ensure database exists

3. **Session Issues**
   - Check `SESSION_SECRET` is set
   - Verify database connection for session store
   - Check cookie settings for environment

4. **Docker Issues**
   - Ensure Docker Desktop is running
   - Check port conflicts (3000, 5432)
   - Verify environment variables are set

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/auth/user

# Check database connection
docker compose exec db pg_isready -U crashuser -d ascend

# Check application logs
docker compose logs app --tail=50
```

## 📚 Additional Resources

- [README.md](./README.md) - Project overview and features
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Production deployment checklist
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes 