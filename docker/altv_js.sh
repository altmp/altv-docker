#!/usr/bin/env bash

DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get install -y -q apt-utils && apt-get upgrade -y -q
apt-get install -y -q wget curl libc-bin libatomic1 jq

wget -O altv_update.sh https://raw.githubusercontent.com/Lhoerion/altv-serverupdater/master/update.sh
chmod +x altv_update.sh
./altv_update.sh
chmod +x ./altv-server

apt-get install -y -q nodejs npm
sed -i 's/modules: \[/modules: \[ js-module/' server.cfg
