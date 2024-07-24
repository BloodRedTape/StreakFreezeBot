#!/bin/bash

pushd ..

mkdir -p build
conan install . --build=missing -s build_type=Release

pushd build
cmake ..  -G "Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE:FILEPATH="./Debug/generators/conan_toolchain.cmake"  -DCMAKE_POLICY_DEFAULT_CMP0091=NEW -DCMAKE_BUILD_TYPE=Release -DWITH_DEBUG_COMMANDS=0 -DCMAKE_WITH_CONAN=0

make -j12 

popd
popd
