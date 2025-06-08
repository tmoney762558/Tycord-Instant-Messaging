FROM node:23

WORKDIR /app

# Install dependencies
COPY package*.json .
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

CMD ["sh", "-c", "node ./backend/deploy.ts && node ./backend/server.ts"]