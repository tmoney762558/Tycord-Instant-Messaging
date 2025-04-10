FROM node:latest

WORKDIR /app

COPY package*.json .
COPY ./prisma prisma

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "./backend/server.ts"]