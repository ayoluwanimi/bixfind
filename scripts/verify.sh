#!/usr/bin/env bash
# One-command verification gate for Bixfind.
#
# Runs, in order, and stops at the first failing stage:
#   1. typecheck            (turbo across the workspace)
#   2. production build     (turbo; skipped with --skip-build)
#   3. live smoke checks    against the deployed domain (BASEvar, default prod)
#
# Every stage's exit status is captured explicitly — output text is never
# treated as proof of success.
#
# Usage:
#   bash scripts/verify.sh                                  # full gate
#   bash scripts/verify.sh --skip-build                     # typecheck + smoke
#   BASE=https://staging.example.com bash scripts/verify.sh --skip-typecheck
set -uo pipefail

BASE="${BASE:-https://bixfind.indevs.in}"
SKIP_BUILD=false
SKIP_TYPECHECK=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --skip-typecheck) SKIP_TYPECHECK=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

fail() { echo -e "\n❌ FAIL: $1" >&2; exit 1; }
ok()   { echo "✅ $1"; }

total=3
done_steps=0

echo "▶ 1/${total} — Typecheck (turbo)"
if [ "$SKIP_TYPECHECK" = true ]; then
  echo "  (skipped by --skip-typecheck)"
else
  if ! command -v pnpm > /dev/null; then fail "pnpm not found in PATH"; fi
  pnpm exec turbo run typecheck || fail "typecheck failed"
  done_steps=$((done_steps + 1))
  ok "typecheck passed"
fi

echo "▶ 2/${total} — Production build (turbo)"
if [ "$SKIP_BUILD" = true ]; then
  echo "  (skipped by --skip-build)"
else
  pnpm exec turbo run build || fail "production build failed"
  done_steps=$((done_steps + 1))
  ok "production build passed"
fi

echo "▶ 3/${total} — Live smoke checks against $BASE"

HTTP=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/" 2>/dev/null) || fail "curl to $BASE failed"
ok "GET / → $HTTP"
[ "$HTTP" = "200" ] || fail "homepage returned $HTTP (expected 200)"

code_x=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/bookings" 2>/dev/null) || fail "curl /api/bookings"
ok "GET /api/bookings (no auth) → $code_x (expect 401)"
[ "$code_x" = "401" ] || fail "/api/bookings is not auth-gated (got $code_x)"

code_p=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/reviews" -X POST -H 'Content-Type: application/json' -d '{}' 2>/dev/null) || fail "curl /api/reviews"
ok "POST /api/reviews (no auth) → $code_p (expect 401)"
[ "$code_p" = "401" ] || fail "/api/reviews is not auth-gated (got $code_p)"

code_b=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/bookings" -X POST -H 'Content-Type: application/json' -d '{}' 2>/dev/null) || fail "curl POST /api/bookings"
ok "POST /api/bookings (no auth) → $code_b (expect 401 from the creation route)"
[ "$code_b" = "401" ] || fail "POST /api/bookings returned $code_b (401 expected; 405 means the booking-creation deploy is missing)"

code_s=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/sitemap.xml" 2>/dev/null) || fail "curl /sitemap.xml"
ok "GET /sitemap.xml → $code_s (expect 200)"
[ "$code_s" = "200" ] || fail "/sitemap.xml unreachable (got $code_s)"

FEAT=$(curl -sS "$BASE/api/featured-providers" 2>/dev/null) || fail "curl /api/featured-providers"
if echo "$FEAT" | grep -q '"User"'; then
  fail "featured-providers still returns placeholder 'User' provider — data regression"
fi
ok "featured-providers clean"

done_steps=$((done_steps + 1))
echo -e "\n✅ GATE PASSED (${done_steps}/${total} stages) — deploy verified on $BASE"
