FROM node:latest

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json .
COPY ./prisma prisma
RUN npm install
RUN mkdir -p /app/uploads

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Run Prisma migrations and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node ./backend/server.ts"]