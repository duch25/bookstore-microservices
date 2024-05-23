FROM node

WORKDIR /app/purchase

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3003

CMD ["npm", "start"]