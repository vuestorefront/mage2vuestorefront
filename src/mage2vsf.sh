#!/bin/sh
set -e
sleep 10s && yarn run webapi & yarn run worker
