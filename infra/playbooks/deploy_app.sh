#!/usr/bin/env bash

cd /home/ubuntu
mkdir -p /home/ubuntu/app
# TODO: change this to the actual ml-iso-hackathon repo
git clone https://github.com/mojaloop/ml-testing-toolkit.git app
cd app

sudo docker-compose up -d