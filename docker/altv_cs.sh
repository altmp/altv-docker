#!/usr/bin/env bash

DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get install -y -q apt-utils && apt-get upgrade -y -q
apt-get install -y -q wget curl libc-bin libatomic1 jq

wget -O altv_update.sh https://raw.githubusercontent.com/Lhoerion/altv-serverupdater/master/update.sh
sed -i 's/{"branch":"release","modules":\["js-module"\]}/{"branch":"release","modules":\["csharp-module"\]}/' altv_update.sh
chmod +x altv_update.sh
./altv_update.sh
chmod +x ./altv-server

sed -i 's/modules: \[/modules: \[ csharp-module/' server.cfg
