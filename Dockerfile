# Dockerfile

# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN npm install --only=production

EXPOSE 3000
CMD ["node", "dist/index.js"]