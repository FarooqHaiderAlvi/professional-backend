FROM node:latest

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy the entire src directory and other necessary files
COPY src/ ./src/
COPY public/ ./public/
COPY .env.sample ./
COPY .prettierrc ./
COPY .prettierignore ./
COPY .env.sample ./

# Install dependencies
RUN npm install

# Set the entry point
ENTRYPOINT ["node", "src/index.js"]