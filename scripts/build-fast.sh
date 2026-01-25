#!/bin/bash
set -e

echo "=== Fast Build ==="

# Clean
rm -rf dist

# Compile
npx tsc -p tsconfig.json
npx tsc -p tsconfig.cjs.json

# Rollup
npx rollup -c

# Remove unnecessary files
rm -rf ./dist/esm ./dist/cjs

echo "Fast build complete."
