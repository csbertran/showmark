#!/bin/bash
# Deploys the landing page in docs/ to Cloudflare Pages (project "showmark" -> https://showmark.pages.dev).
# One-time setup: npx wrangler login
set -euo pipefail
cd "$(dirname "$0")"
npx --yes wrangler@latest pages deploy docs --project-name showmark --branch main --commit-dirty=true
