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
SSH="ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ConnectTimeout=30 -i $SSH_KEY -p $SSH_PORT $SSH_HOST"

say() { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { echo "[$(date '+%H:%M:%S')] ❌ $*" >&2; exit 1; }

# retry <label> <max> -- run the remaining args up to <max> times with exponential
# backoff (5s, 10s, 20s). SSH/scp over the CF-fronted VPS drops intermittently;
# a single transient close should not fail the whole deploy.
retry() {
  local label="$1" max="$2"; shift 2
  local n=1 delay=5
  while true; do
    if "$@"; then return 0; fi
    if [ "$n" -ge "$max" ]; then
      say "      ⚠ $label failed after $max attempts"
      return 1
    fi
    say "      ↻ $label attempt $n/$max failed — retrying in ${delay}s"
    sleep "$delay"; n=$((n+1)); delay=$((delay*2))
  done
}

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

# --- 4. backup remote webroot (retry; keep only the last 7 archives) ---
say "[4/7] backup remote webroot"
retry "backup" 3 $SSH "mkdir -p /www/backups \
  && tar czf /www/backups/roamsnotes_deploy_\$(date +%Y%m%d_%H%M%S).tar.gz -C $WEB_ROOT . 2>/dev/null \
  && ls -1t /www/backups/roamsnotes_deploy_*.tar.gz | tail -n +8 | xargs -r rm -f" \
  || say "      ⚠ backup step failed (continuing — push still proceeds)"
sleep 3

# --- 5. push public/ (tar over ssh; no rsync on Git Bash) ---
say "[5/7] push build"
tar czf /tmp/roams_public.tar.gz -C "$REPO/public" . || fail "tar failed"
retry "scp push" 3 \
  scp -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ConnectTimeout=30 -i "$SSH_KEY" -P "$SSH_PORT" /tmp/roams_public.tar.gz "$SSH_HOST:/tmp/" \
  || fail "scp failed after retries"

# Compute the set of valid /go/ slugs so we can prune stale redirects on the server.
GO_SLUGS=$(find "$REPO/public/go" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null | tr '\n' ' ')

# --- 6. extract + prune stale /go/ + fix ownership (retry on transient close) ---
say "[6/7] extract + prune + chown"
remote_extract() {
  $SSH "set -e
    tar xzf /tmp/roams_public.tar.gz -C $WEB_ROOT
    # prune /go/ dirs no longer in the build
    for d in $WEB_ROOT/go/*/; do
      s=\$(basename \"\$d\")
      case ' $GO_SLUGS ' in *\" \$s \"*) : ;; *) rm -rf \"\$d\"; echo \"pruned stale /go/\$s\";; esac
    done
    find $WEB_ROOT -not -name '.user.ini' -exec chown www:www {} + 2>/dev/null || true
  "
}
retry "extract" 3 remote_extract || fail "remote extract/prune failed after retries"

# --- 7. verify live ---
say "[7/7] verify live"
HOME_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/")
TAROT_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/fiverr-tarot-reading/")
GO_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/go/fiverr-tarot/")
say "      home=$HOME_CODE tarot=$TAROT_CODE go=$GO_CODE"
[ "$HOME_CODE" = 200 ] && [ "$TAROT_CODE" = 200 ] || fail "live verification failed"

say "✅ deploy complete → $SITE_URL/"
