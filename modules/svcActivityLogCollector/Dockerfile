FROM node:12.16.0-alpine AS builder

WORKDIR /opt/iso-activity-log-collector

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/iso-activity-log-collector/
RUN npm install

COPY src /opt/iso-activity-log-collector/src

FROM node:12.16.0-alpine

WORKDIR /opt/iso-activity-log-collector

COPY --from=builder /opt/iso-activity-log-collector .
RUN npm prune --production

EXPOSE 7075
CMD ["npm", "run", "start"]
