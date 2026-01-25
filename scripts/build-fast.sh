#!/bin/bash

set -e

echo "Building"
npx tsc -p tsconfig.json
npx tsc -p tsconfig.cjs.json

echo "Minifying"
npx rollup -c

echo "Removing Build Files"
rm -r ./dist/esm
rm -r ./dist/cjs
