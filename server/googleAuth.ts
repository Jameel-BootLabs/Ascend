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
      secure: process.env.NODE_ENV === 'production' && process.env.BASE_URL?.startsWith('https'),
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
      const userEmail = profile.emails?.[0]?.value || '';
      
      // Check if email domain is allowed (@bootlabstech.com only) - case insensitive
      if (!userEmail.toLowerCase().endsWith('@bootlabstech.com')) {
        return done(new Error('Access denied. Only bootlabstech organization email addresses are allowed.'), undefined);
      }

      // Extract user information from Google profile
      const googleUser = {
        id: profile.id,
        email: userEmail,
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
    (req, res, next) => {
      passport.authenticate('google', (err: any, user: any, info: any) => {
        if (err) {
          console.error('OAuth callback error:', err);
          // Check if it's a domain restriction error
          if (err.message.includes('@bootlabstech.com')) {
            return res.redirect('/?error=domain_restricted');
          }
          return res.redirect('/?error=auth_failed');
        }
        if (!user) {
          return res.redirect('/?error=auth_failed');
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', loginErr);
            return res.redirect('/?error=auth_failed');
          }
          return res.redirect('/');
        });
      })(req, res, next);
    }
  );

  // Error page for authentication failures
  app.get('/api/auth/error', (req, res) => {
    const error = req.query.error || 'Authentication failed';
    res.status(401).json({ 
      error: 'Access Denied',
      message: error === 'Access denied. Only @bootlabstech.com email addresses are allowed.' 
        ? 'Only @bootlabstech.com email addresses are allowed to access this application.'
        : 'Authentication failed. Please try again.',
      details: error
    });
  });

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