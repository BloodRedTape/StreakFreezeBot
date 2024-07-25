#!/bin/bash

set -e

pushd ../mini_app_react
yarn install
yarn build
popd

exit 0