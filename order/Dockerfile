FROM node

WORKDIR /app/order

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3004

CMD ["npm", "start"]