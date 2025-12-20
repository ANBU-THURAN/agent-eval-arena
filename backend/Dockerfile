FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY shared ./shared

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build backend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy built backend and shared types
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]
