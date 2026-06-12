FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
COPY shared/ ./shared/
COPY channel-service/package.json ./channel-service/
RUN cd channel-service && npm install
COPY channel-service/ ./channel-service/
RUN cd channel-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/channel-service/dist ./dist
COPY --from=builder /app/channel-service/node_modules ./node_modules
COPY --from=builder /app/channel-service/package.json ./
EXPOSE 3002
CMD ["node", "dist/index.js"]
