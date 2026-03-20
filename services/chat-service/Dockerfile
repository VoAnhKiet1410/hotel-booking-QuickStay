FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd shared && npm ci --only=production

RUN cd services/chat-service && npm ci --only=production

EXPOSE 3006

CMD ["node", "services/chat-service/server.js"]
