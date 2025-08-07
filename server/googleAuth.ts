import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import 'dotenv/config';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials not provided. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
}

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET not set. Using default secret for development. Set SESSION_SECRET in production!");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${baseURL}/api/auth/callback/google`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user information from Google profile
      const googleUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || '',
      };

      // TODO: Uncomment when database is connected
      // await storage.upsertUser(googleUser);
      
      console.log('Google OAuth Success:', googleUser);
      
      // Create user session object
      const user = {
        id: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profileImageUrl: googleUser.profileImageUrl,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      done(error, null);
    }
  }));

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Authentication routes
  
  // Simple mock login for development
  app.get('/api/auth/mock-login', async (req, res) => {
    console.log('Mock login accessed');
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: '',
    };
    
    try {
      await storage.upsertUser(testUser);
      req.login(testUser, (err) => {
        if (err) {
          console.error('Mock login error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        console.log('Mock user logged in successfully');
        res.redirect('/');
      });
    } catch (error) {
      console.error('Mock login database error:', error);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  });

  // Regular Google OAuth (will have redirect_uri_mismatch with dummy credentials)
  app.get('/api/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })
  );

  app.get('/api/auth/callback/google',
    passport.authenticate('google', { 
      failureRedirect: '/api/login' 
    }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );

  app.get('/api/login', (req, res) => {
    res.redirect('/api/auth/google');
  });

  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.redirect('/');
    });
  });

  // Test endpoint to check environment and auth
  app.get('/api/test-auth', (req, res) => {
    res.json({
      isDummyAuth: process.env.GOOGLE_CLIENT_ID === 'dummy-client-id',
      clientId: process.env.GOOGLE_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
      baseUrl: process.env.BASE_URL
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};