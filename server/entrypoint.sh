#!/bin/bash
set -e
cd /altv
node /root/setup/server.js
export ASAN_OPTIONS=halt_on_error=0:handle_abort=1:exitcode=0:verbosity=0:detect_leaks=1:detect_odr_violation=1:alloc_dealloc_mismatch=1:log_path=/altv/asan/asan.log
./altv-server "$@"