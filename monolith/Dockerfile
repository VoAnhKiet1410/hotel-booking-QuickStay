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

# ── CRITICAL: Đảm bảo tất cả services dùng cùng 1 mongoose instance ──
# Mỗi service có node_modules/mongoose riêng → khi monolith connect mongoose,
# chỉ instance của monolith được connect. Services' models dùng instance khác
# (chưa connect) → gây "buffering timed out".
# Fix: Thay mongoose của mỗi service bằng symlink đến monolith's mongoose.
RUN for dir in services/*/node_modules/mongoose; do \
      if [ -d "$dir" ]; then \
        rm -rf "$dir" && \
        ln -s /app/monolith/node_modules/mongoose "$dir"; \
      fi; \
    done && \
    if [ -d "shared/node_modules/mongoose" ]; then \
      rm -rf shared/node_modules/mongoose && \
      ln -s /app/monolith/node_modules/mongoose shared/node_modules/mongoose; \
    fi

EXPOSE 3000

CMD ["node", "monolith/server.js"]
