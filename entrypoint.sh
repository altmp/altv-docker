#!/bin/bash
set -e
cd /altv
node /root/setup/index.js
./altv-server "$@"