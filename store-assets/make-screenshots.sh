#!/bin/bash
# Regenerates the Chrome Web Store images with headless Chrome:
#   screenshot-1..5.png (1280x800) from demo.html#1..3,5 and settings-demo.html (#4)
#   promo-small.png (440x280) and promo-marquee.png (1400x560) from promo.html
set -euo pipefail
cd "$(dirname "$0")"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
shoot() { # file WxH url
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size="$2" --virtual-time-budget=3000 \
    --screenshot="$1" "$3" >/dev/null 2>&1
  echo "$1: $(sips -g pixelWidth -g pixelHeight -g hasAlpha "$1" | awk '/pixel|Alpha/{printf "%s ", $2}')"
}
for n in 1 2 3 5; do shoot "screenshot-$n.png" 1280,800 "file://$PWD/demo.html#$n"; done
shoot screenshot-4.png 1280,800 "file://$PWD/settings-demo.html"
shoot promo-small.png 440,280 "file://$PWD/promo.html#small"
shoot promo-marquee.png 1400,560 "file://$PWD/promo.html#marquee"
