FROM node:12.16.1-alpine as build

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake

WORKDIR /app

COPY lerna.json package.json package-lock.json default.env tsconfig.json /app/
COPY modules/libShared ./modules/libShared/

COPY modules/svcMojaBank ./modules/svcMojaBank/
RUN npm install && npm run bootstrap && npm run build

FROM node:12.16.1-alpine
COPY default.env /app/
COPY --from=build /app/modules/libShared /app/modules/libShared/
COPY --from=build /app/modules/svcMojaBank /app/modules/svcMojaBank/

WORKDIR /app/modules/svcMojaBank
ENTRYPOINT ["./entrypoint.sh"]