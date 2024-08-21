FROM node:20-alpine as base

WORKDIR /app

COPY package.json .
RUN yarn install

# App Stage
FROM base as app

EXPOSE $PORT
WORKDIR /app

COPY . .

ENTRYPOINT ["yarn", "start"]