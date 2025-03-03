# Use the same Node.js version as your local machine
FROM node:22.13.1-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the project files
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev"]
