# SecureLearn Portal

An information security training portal built with React, Express.js, and PostgreSQL.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **Training Modules** - Interactive security training content
- **Assessment System** - Quizzes and certifications
- **Admin Dashboard** - Content management and user progress tracking
- **File Uploads** - Support for training materials (images, videos, presentations)

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

# Environment
NODE_ENV="development"
```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

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