#!/bin/bash

pushd ..
mkdir -p build
pushd build
cmake .. -DWITH_DEBUG_COMMANDS=0

make -j12 

popd
popd
