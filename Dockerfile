FROM node:18-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build


EXPOSE 5000
CMD ["npm", "start"]
