#!/usr/bin/env bash
set -euo pipefail

eval "$(npx supabase status --output env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SELF_SERVICE_SIGNUP_ENABLED=true

npx playwright test --config playwright.acceptance.config.ts
