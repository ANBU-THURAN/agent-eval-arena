# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments from Railway
ARG VITE_API_URL
ARG VITE_WS_URL

# Make them available as environment variables during build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Copy package files
COPY package.json ./
COPY shared ./shared

# Install dependencies
RUN npm install

# Copy frontend source
COPY src ./src
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

# Build frontend (env vars are now available)
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
