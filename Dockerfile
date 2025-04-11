FROM node:latest

WORKDIR /app

# Install dependencies
COPY package*.json .
COPY ./prisma prisma
RUN npm install
# Create uploads director (Will not be kept whenever the container restarts)
# This allows us to avoid the need to handle storage but still have a place to
# store files temporarily
# Since this is only a portfolio project, we can ignore this instead of using something
# like AWS S3
RUN mkdir -p /app/uploads

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Run Prisma migrations and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node ./backend/server.ts"]