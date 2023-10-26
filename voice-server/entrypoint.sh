#!/bin/bash
set -e
cd /altv
node /root/setup/voice-server.js
./altv-voice-server "$@"