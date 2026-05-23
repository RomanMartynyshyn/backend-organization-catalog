FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]