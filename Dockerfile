
# Base image: Node.js Debian slim to support sharp
FROM node:20-slim

# Install libvips for sharp
RUN apt-get update && apt-get install -y     libvips     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
