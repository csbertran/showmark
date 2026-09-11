#!/bin/bash
# Regenerates the Chrome Web Store screenshots (1280×800) from demo.html using headless Chrome.
set -euo pipefail
cd "$(dirname "$0")"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for n in 1 2; do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 --virtual-time-budget=3000 \
    --screenshot="screenshot-$n.png" "file://$PWD/demo.html#$n" >/dev/null 2>&1
  echo "screenshot-$n.png: $(sips -g pixelWidth -g pixelHeight "screenshot-$n.png" | awk '/pixel/{printf "%s ", $2}')"
done
