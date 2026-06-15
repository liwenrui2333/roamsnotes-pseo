#!/usr/bin/env bash
# RoamsNotes update + deploy. Modeled on hu-qian's deploy, adapted for the reality
# that RN's Hugo SOURCE lives only locally (Windows/Git Bash) and the VPS holds just
# the built static files. Flow: quality gate -> generate (pages + /go/) -> hugo build
# -> backup remote -> push public/ (tar+ssh, no rsync on Windows) -> prune stale /go/
# -> chown -> verify live. Run from the repo root:  bash deploy.sh
set -uo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

# --- config ---
SSH_HOST="${RN_SSH_HOST:-root@23.95.128.137}"
SSH_PORT="${RN_SSH_PORT:-2222}"
SSH_KEY="${RN_SSH_KEY:-$HOME/.ssh/id_ed25519}"
WEB_ROOT="${RN_WEB_ROOT:-/www/wwwroot/roamsnotes.com}"
SITE_URL="${RN_SITE_URL:-https://www.roamsnotes.com}"
HUGO_BIN="${HUGO_BIN:-hugo}"
SSH="ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST"

say() { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { echo "[$(date '+%H:%M:%S')] ❌ $*" >&2; exit 1; }

# --- 1. quality gate (blocks bad content before anything ships) ---
say "[1/7] quality gate"
node scripts/quality_gate.js || fail "quality gate failed — fix pages.yaml"

# --- 2. generate pages + /go/ redirects from data ---
say "[2/7] generate pages + /go/ redirects"
node scripts/generate_pages.js || fail "generate failed"

# --- 3. hugo build (clean) ---
say "[3/7] hugo build"
rm -rf "$REPO/public"
"$HUGO_BIN" --gc --minify --destination "$REPO/public" || fail "hugo build failed"
PAGES=$(find "$REPO/public" -name index.html | wc -l)
[ "$PAGES" -lt 10 ] && fail "only $PAGES html files built — aborting"
say "      built $PAGES html files"

# --- 4. backup remote webroot ---
say "[4/7] backup remote webroot"
$SSH "mkdir -p /www/backups && tar czf /www/backups/roamsnotes_deploy_\$(date +%Y%m%d_%H%M%S).tar.gz -C $WEB_ROOT . 2>/dev/null" \
  || say "      ⚠ backup step returned non-zero (continuing)"

# --- 5. push public/ (tar over ssh; no rsync on Git Bash) ---
say "[5/7] push build"
tar czf /tmp/roams_public.tar.gz -C "$REPO/public" . || fail "tar failed"
scp -i "$SSH_KEY" -P "$SSH_PORT" /tmp/roams_public.tar.gz "$SSH_HOST:/tmp/" >/dev/null || fail "scp failed"

# Compute the set of valid /go/ slugs so we can prune stale redirects on the server.
GO_SLUGS=$(find "$REPO/public/go" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null | tr '\n' ' ')

# --- 6. extract + prune stale /go/ + fix ownership ---
say "[6/7] extract + prune + chown"
$SSH "set -e
  tar xzf /tmp/roams_public.tar.gz -C $WEB_ROOT
  # prune /go/ dirs no longer in the build
  for d in $WEB_ROOT/go/*/; do
    s=\$(basename \"\$d\")
    case ' $GO_SLUGS ' in *\" \$s \"*) : ;; *) rm -rf \"\$d\"; echo \"pruned stale /go/\$s\";; esac
  done
  find $WEB_ROOT -not -name '.user.ini' -exec chown www:www {} + 2>/dev/null || true
" || fail "remote extract/prune failed"

# --- 7. verify live ---
say "[7/7] verify live"
HOME_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/")
TAROT_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/fiverr-tarot-reading/")
GO_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/go/fiverr-tarot/")
say "      home=$HOME_CODE tarot=$TAROT_CODE go=$GO_CODE"
[ "$HOME_CODE" = 200 ] && [ "$TAROT_CODE" = 200 ] || fail "live verification failed"

say "✅ deploy complete → $SITE_URL/"
