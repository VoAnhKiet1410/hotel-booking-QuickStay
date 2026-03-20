FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/booking-service && npm ci --only=production

EXPOSE 3003

CMD ["node", "services/booking-service/server.js"]

