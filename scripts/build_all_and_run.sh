#!/bin/bash

set -e
# now we in scripts
chmod +x build_all.sh
chmod +x run.sh

./build_all.sh 
./run.sh

exit 0