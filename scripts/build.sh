#!/bin/bash

set -e

if [ -d "dist" ]; then
    rm -r ./dist
fi

echo "Building..."
npm run build:fast

echo "Packaging..."
npm pack --pack-destination release

# npm run test

echo -e "\x1b[1;32m"
echo "Build Complete!"
echo -e "\x1b[0m"
