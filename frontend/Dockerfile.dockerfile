# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY ./src ./src
COPY tailwind.config.cjs .

# Expose port
EXPOSE 3000

# Start frontend
CMD ["npm", "start"]
