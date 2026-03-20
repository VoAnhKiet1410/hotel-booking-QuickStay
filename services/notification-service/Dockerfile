FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/notification-service && npm ci --only=production

EXPOSE 3005

CMD ["node", "services/notification-service/server.js"]

