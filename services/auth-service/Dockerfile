FROM node:20-alpine

# Đặt WORKDIR là repo root để relative import ../../../shared hoạt động đúng
# File: /app/services/auth-service/routes/*.js → ../../../shared = /app/shared ✅
WORKDIR /app

# Copy toàn bộ repo (giữ nguyên cấu trúc shared/)
COPY . .

# Cài dependencies cho auth-service
RUN cd services/auth-service && npm ci --only=production

EXPOSE 3001

# Chạy từ repo root để path resolution đúng
CMD ["node", "services/auth-service/server.js"]
