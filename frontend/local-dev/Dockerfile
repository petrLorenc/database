FROM node:16-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./
RUN npm install

# Start the development server with hot reloading
CMD ["npm", "start"]