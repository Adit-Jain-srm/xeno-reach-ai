FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
COPY shared/ ./shared/
COPY backend/package.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/
RUN cd backend && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
