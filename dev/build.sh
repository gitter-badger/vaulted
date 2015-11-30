#!/bin/bash
set -eu

DIR="/home/vagrant/vaulted/dev"

# this is a bit cryptic but required to get packages installed globally installed for user appy

# NodeJS 4.x
docker build -t temp/nodejs:4 -f "${DIR}/Dockerfile.node4" "${DIR}"
docker rm nodejs4-global > /dev/null 2>&1 || :
docker run --name nodejs4-global temp/nodejs:4 npm install --quiet -g istanbul mocha
docker commit nodejs4-global vaulted/nodejs:4
docker rm nodejs4-global
docker rmi temp/nodejs:4
