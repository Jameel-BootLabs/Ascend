FROM node:alpine AS runner

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . /app
EXPOSE 3000

# Build arguments for environment variables
ARG ARG_DATABASE_URL="postgresql://username:password@localhost:5432/securelearn_db"
ARG ARG_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
ARG ARG_GOOGLE_CLIENT_SECRET="your-google-client-secret"
ARG ARG_SESSION_SECRET="your-secure-session-secret-key"
ARG ARG_NODE_ENV="production"

# Set environment variables from build args
ENV DATABASE_URL=$ARG_DATABASE_URL
ENV GOOGLE_CLIENT_ID=$ARG_GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$ARG_GOOGLE_CLIENT_SECRET
ENV SESSION_SECRET=$ARG_SESSION_SECRET
ENV NODE_ENV=$ARG_NODE_ENV

# Display versions for debugging
RUN node -v
RUN npm -v

# Clean install and build
RUN rm -rf node_modules package-lock.json
RUN rm -rf dist
RUN npm install --legacy-peer-deps
RUN npm run build

# Start the application
CMD ["npm", "run", "start"]