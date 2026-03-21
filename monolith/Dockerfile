FROM node:20-alpine

# WORKDIR là repo root để relative imports hoạt động đúng
WORKDIR /app

# Copy toàn bộ repo
COPY . .

# Install shared dependencies
RUN cd shared && npm ci --only=production

# Install dependencies cho từng service
# (cần thiết vì monolith import từ services/ — Node.js resolve packages
#  relative to file location, nên mỗi service cần node_modules riêng)
RUN cd services/auth-service && npm ci --only=production
RUN cd services/hotel-service && npm ci --only=production --legacy-peer-deps
RUN cd services/booking-service && npm ci --only=production
RUN cd services/payment-service && npm ci --only=production
RUN cd services/notification-service && npm ci --only=production
RUN cd services/chat-service && npm ci --only=production
RUN cd services/review-service && npm ci --only=production
RUN cd services/promo-service && npm ci --only=production
RUN cd services/operations-service && npm ci --only=production

# Install monolith dependencies (top-level packages)
RUN cd monolith && npm ci --only=production --legacy-peer-deps

EXPOSE 3000

CMD ["node", "monolith/server.js"]
