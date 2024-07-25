#!/bin/bash

# we in scripts now

set -e 

pushd ..

pushd run_tree
./../build/StreakFreezeBot Config.ini
popd

popd

exit 0