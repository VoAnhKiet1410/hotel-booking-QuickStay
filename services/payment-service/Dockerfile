FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/payment-service && npm ci --only=production

EXPOSE 3004

CMD ["node", "services/payment-service/server.js"]

