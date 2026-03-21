# BUILD FOR LOCAL DEVELOPMENT
FROM node:22-alpine AS development

# Set working directory
WORKDIR /usr/src/app

# Copy package dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Post-install hooks (like Prisma generate) will run automatically if defined in package.json
# But to be safe, we explicitly copy prisma schema and generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY . .

# Build the application
RUN npm run build

# BUILD FOR PRODUCTION
FROM node:22-alpine AS production

# Set node environment
ENV NODE_ENV production
WORKDIR /usr/src/app

# Copy package dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated prisma client and schema
COPY --from=development /usr/src/app/prisma ./prisma
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=development /usr/src/app/dist ./dist

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"]
