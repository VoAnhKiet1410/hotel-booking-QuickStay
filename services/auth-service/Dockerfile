FROM node:20-alpine

# WORKDIR là repo root để relative import ../../../shared hoạt động đúng
WORKDIR /app

# Copy toàn bộ repo
COPY . .

# Install shared dependencies (có @clerk/express, mongoose, jsonwebtoken)
RUN cd shared && npm ci --only=production

# Install auth-service dependencies
RUN cd services/auth-service && npm ci --only=production

EXPOSE 3001

CMD ["node", "services/auth-service/server.js"]
