#!/bin/sh
set -eu

if [ "${1}" = "app" ]; then
        exec node dist/index.js api
else
        echo "Invalid option! See entrypoint.sh / you can use [app]"
        exit 1
fi