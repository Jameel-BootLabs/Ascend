# SecureLearn Portal

An information security training portal built with React, Express.js, and PostgreSQL. This application has been migrated from Replit to a standard deployment-ready service compatible with any cloud platform.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **Training Modules** - Interactive security training content
- **Assessment System** - Quizzes and certifications
- **Admin Dashboard** - Content management and user progress tracking
- **File Uploads** - Support for training materials (images, videos, presentations)
- **Certificate Generation** - Automated certificate creation for completed assessments

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for state management
- shadcn/ui for UI components
- Tailwind CSS for styling

### Backend
- Express.js with TypeScript
- Passport.js for authentication
- Drizzle ORM with PostgreSQL
- Multer for file uploads
- Express Session with PostgreSQL storage

## 🚀 Quick Start

For detailed setup instructions for all environments (Local Development, Docker, Production), see **[SETUP.md](./SETUP.md)**.

### Prerequisites

- **Node.js 18+** 
- **PostgreSQL 12+**
- **Google OAuth credentials**

### Quick Setup

```bash
# Clone and install
git clone <repository-url>
cd Ascend
npm install

# Choose your environment setup:
# 1. Local Development: cp env.example .env
# 2. Docker: cp docker.env.example .env  
# 3. Production: cp production.env.example .env

# Edit .env with your credentials
# Run database migration: npm run db:push
# Start: npm run dev (local) or docker compose up -d (Docker)
```

For complete setup instructions, see **[SETUP.md](./SETUP.md)**.
BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## Production Deployment

### Environment Setup

1. **Copy production environment template:**
   ```bash
   cp production.env.example .env
   ```

2. **Update with production values:**
   ```env
   DATABASE_URL="postgresql://username:password@your-db-host:5432/securelearn_prod"
   GOOGLE_CLIENT_ID="your-production-client-id"
   GOOGLE_CLIENT_SECRET="your-production-client-secret"
   SESSION_SECRET="your-secure-production-session-secret"
   BASE_URL="https://yourdomain.com"
   NODE_ENV="production"
   PORT="3000"
   ```

### Google OAuth Production Setup

1. **Update OAuth credentials in Google Cloud Console:**
   - Add production domain to authorized origins
   - Add production callback URL: `https://yourdomain.com/api/auth/google/callback`

2. **Generate secure session secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deployment Platforms

The application is compatible with:
- **Google Cloud Platform** (Cloud Run, App Engine)
- **AWS** (ECS, Elastic Beanstalk)
- **Azure** (Container Instances, App Service)
- **Heroku, Railway, Render, Vercel**
- **Docker containers**

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## Authentication

The application uses Google OAuth for authentication. Users are automatically registered on first login and assigned the "employee" role by default. Admin users can be promoted through the database.

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Training Content
- `GET /api/sections` - Get training sections
- `GET /api/modules` - Get training modules  
- `GET /api/modules/:id/pages` - Get module pages
- `POST /api/progress` - Update user progress

### Assessments
- `GET /api/sections/:id/assessment/questions` - Get assessment questions
- `POST /api/assessment/results` - Submit assessment results
- `GET /api/certificate/:resultId` - Generate certificate

### Admin (Admin role required)
- `POST /api/sections` - Create training section
- `POST /api/modules` - Create training module
- `POST /api/assessment/questions` - Create assessment question
- `GET /api/admin/progress` - Get all user progress
- `GET /api/admin/assessment/results` - Get all assessment results

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **OAuth Redirect URI Mismatch:**
   - Verify callback URL in Google Cloud Console
   - Check BASE_URL environment variable
   - Ensure ports match (3000 for development)

3. **Session Issues:**
   - Verify SESSION_SECRET is set
   - Check database connection for session storage
   - Clear browser cookies if needed

4. **Build Errors:**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript errors with `npm run check`
   - Verify environment variables are set

### Development Tips

- Use `npm run db:push` after schema changes
- Check server logs for detailed error messages
- Use browser dev tools to debug OAuth flow
- Test with different Google accounts

## License

MIT