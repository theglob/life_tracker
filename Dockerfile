FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/server/data && chmod 755 /app/server/data

EXPOSE 3000

CMD ["node", "server/index.js"] 