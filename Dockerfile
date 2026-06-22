FROM node:22-alpine

WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

COPY server/ /app/server/

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]