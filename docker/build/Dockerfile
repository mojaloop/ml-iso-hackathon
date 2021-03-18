FROM node:12.16.1-alpine as builder
WORKDIR /opt/app

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool zlib-dev autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json tsconfig.json lerna.json /opt/app/
COPY modules /opt/app/modules
COPY xsd /opt/app/xsd

RUN npm ci

FROM node:12.16.1-alpine
WORKDIR /opt/app

COPY --from=builder /opt/app .

## copy source code in case there are changes
COPY modules /opt/app/modules
COPY docker-compose.env /opt/app/default.env

## run build
RUN npm run build

EXPOSE 3003
CMD ["npm", "run", "start:noconfig"]
