#!/bin/bash

set -e

# now we in scripts
pushd ..

pushd scripts

chmod +x build_react.sh
chmod +x build_cpp.sh
./build_react.sh && ./build_cpp.sh

popd

popd

exit 0