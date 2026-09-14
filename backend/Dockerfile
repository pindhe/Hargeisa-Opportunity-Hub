FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npx prisma generate && npx tsc
EXPOSE 4000
CMD ["node", "dist/index.js"]
