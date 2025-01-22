FROM node:18-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --only=production

COPY . .

RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
