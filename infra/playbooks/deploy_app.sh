#!/usr/bin/env bash

cd /home/ubuntu

# Stop an existing deployment
docker stop `docker ps -aq`
rm -rf /home/ubuntu/app


mkdir -p /home/ubuntu/app
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
# note: I added a deploy key here: https://github.com/mojaloop/ml-iso-hackathon/settings/keys
# in order to get this to work for a private repo
git clone --branch master git@github.com:mojaloop/ml-iso-hackathon.git app

cd app

# hmm we need to fix some permissions issues...
touch ./docker/traefik/acme.json
chmod 600 ./docker/traefik/acme.json

docker-compose pull
docker-compose up -d
