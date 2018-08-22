#!/bin/sh
set -e
yarn install --production=false && nohup yarn run webapi & nohup yarn run worker
