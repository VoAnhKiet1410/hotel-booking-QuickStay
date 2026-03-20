FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd shared && npm ci --only=production

RUN cd services/review-service && npm ci --only=production

EXPOSE 3007

CMD ["node", "services/review-service/server.js"]
