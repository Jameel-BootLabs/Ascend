# SecureLearn Portal

An information security training portal built with React, Express.js, and PostgreSQL. This application has been migrated from Replit to a standard deployment-ready service compatible with any cloud platform.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **Training Modules** - Interactive security training content with section-based organization
- **Assessment System** - Section-based quizzes with 100% passing requirement and certificate generation
- **Admin Dashboard** - Comprehensive content management and user progress tracking
- **Assessment Questions Management** - Create, edit, and manage assessment questions through admin interface
- **File Uploads** - Support for training materials (images, videos, presentations)
- **Certificate Generation** - Professional HTML certificates for completed assessments
- **Section-Based Architecture** - Organized training content with hierarchical sections
- **Progress Tracking** - Real-time user progress monitoring across modules and sections

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
- Standard PostgreSQL (no Neon dependencies)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/securelearn_db"

# Google OAuth Configuration  
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Session Configuration
SESSION_SECRET="your-secure-session-secret-key"

# Server Configuration
BASE_URL="http://localhost:3000"
PORT=3000

# Environment
NODE_ENV="development"
```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Database Setup

1. Create a PostgreSQL database
2. Run migrations:
   ```bash
   npm run db:push
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Development Authentication With Google OAuth:**
   - Set up Google Cloud Console credentials
   - Update environment variables with real credentials
   - Use the "Sign In with Google" button

### Production Build

```bash
npm run build
npm start
```

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
- `GET /api/auth/callback/google` - OAuth callback
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
- `GET /api/admin/assessment/questions` - Get all assessment questions (admin)
- `POST /api/assessment/questions` - Create assessment question (admin)
- `PUT /api/assessment/questions/:id` - Update assessment question (admin)
- `DELETE /api/assessment/questions/:id` - Delete assessment question (admin)

## Migration from Replit

This application has been successfully migrated from Replit to a standard deployment-ready service:

### Changes Made:
- ✅ **Removed Replit dependencies**: No more Replit-specific packages or configurations
- ✅ **Standard PostgreSQL**: Migrated from Neon to standard PostgreSQL
- ✅ **Google OAuth**: Replaced Replit OAuth with Google OAuth
- ✅ **Docker support**: Added Dockerfile and docker-compose.yml
- ✅ **Environment configuration**: Production-ready environment variable setup
- ✅ **Port configuration**: Smart port binding (localhost for dev, 0.0.0.0 for production)
- ✅ **Assessment Questions Management**: Complete CRUD interface for managing assessment questions
- ✅ **Section-Based Architecture**: Organized training content with hierarchical sections
- ✅ **Certificate Generation**: Professional HTML certificates for completed assessments
- ✅ **100% Passing Requirement**: Updated assessment system to require perfect scores
- ✅ **Admin Dashboard Enhancements**: Added assessment questions management tab

## Deployment

The application is designed to be deployed on any cloud platform that supports:
- Node.js applications
- PostgreSQL databases
- Environment variable configuration

Compatible with:
- Google Cloud Platform (Cloud Run, App Engine)
- AWS (ECS, Elastic Beanstalk)
- Azure (Container Instances, App Service)
- Heroku, Railway, Render, etc.

## License

MIT