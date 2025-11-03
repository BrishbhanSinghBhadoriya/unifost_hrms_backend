# Use latest Node.js image
FROM node:latest

# Install nodemon globally (for live reload)
RUN npm install -g nodemon

# Set working directory inside container
WORKDIR /app

# Copy package files first (for caching layers)
COPY . .

# Install dependencies
RUN npm install

# Copy remaining source files

# Expose your app port
EXPOSE 5001

# Run the development command (nodemon)
CMD ["npm", "run", "dev"]
