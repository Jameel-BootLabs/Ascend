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

      // Store user in database
      const storedUser = await storage.upsertUser(googleUser);
      
      // Create user session object with stored user data
      const user = {
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        profileImageUrl: storedUser.profileImageUrl,
        role: storedUser.role,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      done(error as Error, undefined);
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
      done(error as Error, undefined);
    }
  });

  // Authentication routes
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


}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};