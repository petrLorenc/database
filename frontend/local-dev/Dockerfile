FROM node:16-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create a script to handle npm installs when the container starts
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if [ ! -d "/app/node_modules" ] || [ ! "$(ls -A /app/node_modules)" ]; then' >> /entrypoint.sh && \
    echo '  echo "Installing dependencies..."' >> /entrypoint.sh && \
    echo '  npm install' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Start the development server with hot reloading
CMD ["npm", "start"]