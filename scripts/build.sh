#!/bin/bash
set -e

# --------------------------------------
# Colors
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"
# --------------------------------------

VERSION="$(jq .version ./package.json -r)"

echo -e "${YELLOW}=== Starting Full Build ===${RESET}"

if [[ -f "release/jnum-$VERSION.tgz" && "$1" != "rebuild" ]]; then
    echo "The current version ($VERSION) has already been build. Rerun the script with the 'rebuild' option to rebuild the current version."
    exit 1
fi

# 1. Clean
if [ -d "dist" ]; then
    echo "Cleaning previous build..."
    rm -rf dist
fi

if [ -d "release" ]; then
    echo "Cleaning previous release..."
    rm -rf release
fi

# 2. Lint
echo -e "${YELLOW}Running ESLint...${RESET}"
npx eslint "src/**/*.{ts,tsx}" || {
    echo -e "${RED}ESLint failed.${RESET}"
    exit 1
}

# 3. TypeScript Compilation
echo -e "${YELLOW}Compiling TypeScript...${RESET}"
npx tsc -p tsconfig.json
npx tsc -p tsconfig.cjs.json

# 4. Rollup Bundling & Minification
echo -e "${YELLOW}Bundling with Rollup...${RESET}"
npx rollup -c

# 5. Remove unnecessary build files
if [ -d "./dist/esm" ]; then
    rm -rf ./dist/esm
fi
if [ -d "./dist/cjs" ]; then
    rm -rf ./dist/cjs
fi

# 6. Run Tests
# echo -e "${YELLOW}Running Jest tests...${RESET}"
# npx jest --coverage || {
#     echo -e "${RED}Tests failed.${RESET}"
#     exit 1
# }

# 7. Package
echo -e "${YELLOW}Packaging release...${RESET}"
mkdir -p release
npm pack --pack-destination release

# 8. Done
echo -e "${GREEN}=== Build Complete! ===${RESET}"
