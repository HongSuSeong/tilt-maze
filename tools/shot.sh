#!/bin/bash
# usage: tools/shot.sh NAME HASH [W,H]   — the built game at phone size → tools/out/NAME.png
# Serves dist/ with `vite preview` (the game expects to live under /tilt-maze/), then the Playwright headless shell takes
# the picture (Chrome for Testing's --headless=new never exits on this Mac).
set -e
cd "$(dirname "$0")/.." && mkdir -p tools/out
CH="${CHROME:-$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell}"
PORT=4179
curl -s -o /dev/null "http://localhost:$PORT/tilt-maze/" || { npx vite preview --port $PORT --strictPort >/dev/null 2>&1 & echo $! > tools/out/.preview.pid; sleep 2; }
UD=$(mktemp -d)
"$CH" --use-angle=swiftshader --enable-unsafe-swiftshader --virtual-time-budget=${BUDGET:-6000} --user-data-dir="$UD" \
  --window-size=${3:-390,844} --force-device-scale-factor=1 --screenshot="$PWD/tools/out/$1.png" "http://localhost:$PORT/tilt-maze/#$2" >/dev/null 2>&1
rm -rf "$UD"; echo "tools/out/$1.png"
