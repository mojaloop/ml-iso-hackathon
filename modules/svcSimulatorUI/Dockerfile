FROM node:12.16.0-alpine AS builder

WORKDIR /opt/iso-sim-ui
ENV PATH /opt/iso-sim-ui/node_modules/.bin:$PATH

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/iso-sim-ui/
RUN npm install --silent
#RUN npm install react-scripts@3.0.1 -g --silent

COPY src /opt/iso-sim-ui/src
COPY public /opt/iso-sim-ui/public
RUN npm run build

FROM nginx:1.16.0-alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /opt/iso-sim-ui/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/start.sh /usr/share/nginx/start.sh

EXPOSE 6060
CMD ["sh", "/usr/share/nginx/start.sh"]
