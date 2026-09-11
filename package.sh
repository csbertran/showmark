#!/bin/bash
# Creates a clean ZIP of Showmark for Chrome Web Store submission.
set -euo pipefail
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="showmark-v${VERSION}.zip"
rm -f "$OUT"
zip -r "$OUT" manifest.json background.js lib content options icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png \
  -x "*.DS_Store"
echo "Packaged: $OUT ($(du -h "$OUT" | cut -f1))"
unzip -l "$OUT"
