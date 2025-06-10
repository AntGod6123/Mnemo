# Stage 1: Build Vite React App
FROM node:20 AS builder

WORKDIR /app
COPY . .

ARG VITE_BACKEND_URL=http://backend:8000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm install && npm run build:actual

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Replace NGINX config for SPA fallback
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
