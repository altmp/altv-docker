#!/bin/bash
set -e
cd /altv
node /root/setup/server.js
./altv-server "$@"