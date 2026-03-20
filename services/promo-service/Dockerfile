FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd services/promo-service && npm ci --only=production

EXPOSE 3008

CMD ["node", "services/promo-service/server.js"]

