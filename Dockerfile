FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --production

FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY backend/ ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy built frontend into location backend serves
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

VOLUME ["/app/data"]
EXPOSE 3001

ENV NODE_ENV=production
ENV DATA_DIR=/app/data

CMD ["node", "backend/src/index.js"]
