FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/operations-service && npm ci --only=production

EXPOSE 3009

CMD ["node", "services/operations-service/server.js"]

