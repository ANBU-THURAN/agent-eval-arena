# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from root and frontend
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install dependencies
RUN npm ci

# Copy frontend source and shared types
COPY frontend ./frontend
COPY shared ./shared

# Copy production environment file
COPY frontend/.env.production ./frontend/.env.production

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
