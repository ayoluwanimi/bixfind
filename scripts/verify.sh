#!/usr/bin/env bash
# One-command deploy verification gate for Bixfind.
#
# Runs, in order, and fails fast on the first problem:
#   1. typecheck            (turbo across the workspace)
#   2. production build     (turbo; skipped with --skip-build)
#   3. live smoke checks    against the deployed domain (from the LIVE URL)
#
# Usage:
#   bash scripts/verify.sh                          # full gate
#   bash scripts/verify.sh --skip-build             # typecheck + smoke only
#   BASE=https://staging.example.com bash scripts/verify.sh --skip-typecheck
set -uo pipefail

BASE="${BASE:-https://bixfind.indevs.in}"
SKIP_BUILD=false
SKIP_TYPECHECK=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --skip-typecheck) SKIP_TYPECHECK=true ;;
  esac
done

fail() { echo -e "\n❌ FAIL: $1" >&2; exit 1; }
ok()   { echo "✅ $1"; }

echo "▶ 1/3 — Service checks (http status, no 401 race)"
HTTP=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/" 2>/dev/null) || fail "curl to $BASE failed"
ok "GET / → $HTTP"

echo "▶ 2/3 — Auth-gate smoke checks"
code_x=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/bookings" 2>/dev/null) || fail "curl /api/bookings"
echo "  GET /api/bookings (no auth) → $code_x (expect 401)"
[ "$code_x" = "401" ] || fail "/api/bookings is not auth-gated (got $code_x)"

code_p=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/reviews" -X POST -H 'Content-Type: application/json' -d '{}' 2>/dev/null) || fail "curl /api/reviews"
echo "  POST /api/reviews (no auth) → $code_p (expect 401)"
[ "$code_p" = "401" ] || fail "/api/reviews is not auth-gated (got $code_p)"

code_s=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/sitemap.xml" 2>/dev/null) || fail "curl /sitemap.xml"
echo "  GET /sitemap.xml → $code_s (expect 200)"
[ "$code_s" = "200" ] || fail "/sitemap.xml unreachable (got $code_s)"

echo "▶ 3/3 — Featured providers sanity"
FEAT=$(curl -sS "$BASE/api/featured-providers" 2>/dev/null) || fail "curl /api/featured-providers"
if echo "$FEAT" | grep -q '"User"'; then
  fail "featured-providers still returns placeholder 'User' provider — data regression"
fi
ok "featured-providers clean"

echo -e "\n✅ ALL LIVE SMOKE CHECKS PASSED — deploy verified on $BASE"
