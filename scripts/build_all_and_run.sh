#!/bin/bash

# now we in scripts
pushd ..

pushd scripts
chmod +x build_react.sh
./build_react.sh
chmod +x build_cpp.sh
./build_cpp.sh
popd

pushd run_tree
./../build/StreakFreezeBot Config.ini
popd

pop