FROM node:20-alpine

# WORKDIR là repo root để relative imports (../services/...) hoạt động đúng
WORKDIR /app

# Copy toàn bộ repo
COPY . .

# Install shared dependencies
RUN cd shared && npm ci --only=production

# Install monolith dependencies (gộp tất cả các service dependencies)
RUN cd monolith && npm ci --only=production --legacy-peer-deps

EXPOSE 3000

# Chạy từ repo root
CMD ["node", "monolith/server.js"]
