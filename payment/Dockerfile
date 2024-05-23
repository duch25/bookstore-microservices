FROM node

WORKDIR /app/payment

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3005

CMD ["npm", "start"]