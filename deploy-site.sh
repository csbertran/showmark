#!/bin/bash
# Deploys docs/ to Cloudflare Pages (https://showmark.pages.dev) and pings IndexNow.
# One-time setup: npx wrangler login
set -euo pipefail
cd "$(dirname "$0")"
KEY=e8573bb6aa79223dacfa20b461b6ae36   # matches docs/$KEY.txt, required by IndexNow

npx --yes wrangler@latest pages deploy docs --project-name showmark --branch main --commit-dirty=true

# Tell Bing, Yandex and the other IndexNow participants that the pages changed.
# Google does not use IndexNow; it discovers changes through robots.txt and the sitemap.
curl -sS -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{\"host\":\"showmark.pages.dev\",\"key\":\"$KEY\",\"keyLocation\":\"https://showmark.pages.dev/$KEY.txt\",\"urlList\":[\"https://showmark.pages.dev/\",\"https://showmark.pages.dev/privacy\"]}" \
  -w "\nIndexNow: %{http_code} (202 = accepted)\n"
