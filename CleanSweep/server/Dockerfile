# --- STAGE 1: Builder ---
# Why: We use alpine for a small footprint. 'builder' stage has all the tools.
FROM node:22-alpine AS builder

WORKDIR /app

# Why: Copying package files first leverages Docker layer caching.
COPY package*.json ./
COPY prisma ./prisma/

# Why: 'npm ci' ensures we install the exact versions from the lockfile.
RUN npm ci

COPY . .

# Why: Generate the DB client and compile TS to JS.
RUN npx prisma generate
RUN npm run build

# Why: Remove devDependencies (TypeScript, Linters) to keep the final image tiny.
RUN npm prune --omit=dev

# --- STAGE 2: Runner ---
# Why: We start fresh to throw away the 1GB of build tools.
FROM node:22-alpine AS runner

WORKDIR /app

# Why: Tells the app and libraries to run in high-performance mode.
ENV NODE_ENV=production

# Why: We only steal the 'cooked' files and the 'slim' node_modules from the builder.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Why: Security! Never run as root. 'node' is a built-in low-privilege user.
USER node

EXPOSE 3000

# Why: Starting the app directly with node is faster than using 'npm start'.
CMD ["node", "dist/main"]
