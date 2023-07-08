#!/bin/bash
set -e

node /root/setup/index.js

./altv-server "$@"