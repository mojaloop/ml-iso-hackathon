#!/usr/bin/env bash

cd /home/ubuntu
rm -rf /home/ubuntu/app
mkdir -p /home/ubuntu/app

# note: I added a deploy key here: https://github.com/mojaloop/ml-iso-hackathon/settings/keys
# in order to get this to work for a private repo
git clone git@github.com:mojaloop/ml-iso-hackathon.git app
cd app

sudo docker-compose up -d