FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install all dependencies (including workspaces)
RUN npm ci

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=backend --workspace=shared

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

# Create data directory for SQLite
RUN mkdir -p /app/data

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]
