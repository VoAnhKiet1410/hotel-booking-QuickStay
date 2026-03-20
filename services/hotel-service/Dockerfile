FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/hotel-service && npm ci --only=production

EXPOSE 3002

CMD ["node", "services/hotel-service/server.js"]

