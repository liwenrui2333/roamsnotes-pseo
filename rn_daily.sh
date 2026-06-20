#!/usr/bin/env bash
# RoamsNotes — daily maintenance + themed-data engine.
# Deliberately NOT a mass page generator like hu-qian's huqian_daily.sh: RN is in the
# 15-page validation phase, where churning out pages would dilute authority and trip
# Google's helpful-content signals. Its daily "content" is astro-seek-style sky data
# (moon phase computed, Mercury retrograde from an authoritative table) plus freshness,
# quality, deploy, and health checks. Run locally (Git Bash) or via cron/Task Scheduler.
#
# Pipeline: sky data -> freshness audit -> quality gate -> build+deploy -> health verify
set -uo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"
LOG_DIR="$REPO/logs"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/daily.log"
TS() { date '+%Y-%m-%d %H:%M:%S'; }
say() { echo "[$(TS)] $*" | tee -a "$LOG"; }
step() { say "$1"; shift; if "$@" >>"$LOG" 2>&1; then say "  ok"; else say "  ⚠ failed (continuing)"; fi; }

# rotate log past 512 KB
[ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 524288 ] && mv "$LOG" "$LOG.$(date +%Y%m%d)"
say "════ rn_daily START ════"

SITE_URL="${RN_SITE_URL:-https://www.roamsnotes.com}"

# ── 0: THEMED DATA — today's sky (the daily "content") ───────────────────────
step "[0/4] refresh sky data (moon phase + mercury rx)" node scripts/update_sky.js
step "[0b/4] generate today's sky article (gpt-5.5)" node content-engine/generate_sky_article.mjs --write
step "[0c/4] rebuild astro event calendar (computed moons)" node scripts/build_event_calendar.mjs
step "[0d/4] generate upcoming event pages (skip existing)" node content-engine/generate_event_pages.mjs --window 60 --max 2 --write
step "[0e/4] harvest trending long-tails -> trending.yaml" node content-engine/trend_harvest.mjs

# ── 1: FRESHNESS AUDIT — flag stale data anchors (non-fatal) ─────────────────
step "[1/4] freshness audit" node scripts/freshness_audit.js

# ── 2: QUALITY GATE — blocks bad content before build ────────────────────────
say "[2/4] quality gate"
if node scripts/quality_gate.js >>"$LOG" 2>&1; then
  say "  ok"
else
  say "  ❌ quality gate FAILED — aborting, live site unchanged"
  say "════ rn_daily END (FAIL) ════"; exit 1
fi

# ── 3: BUILD + DEPLOY (delegates to deploy.sh: generate, build, push, verify) ─
say "[3/4] build + deploy"
if bash "$REPO/deploy.sh" >>"$LOG" 2>&1; then
  say "  ✓ deployed"
else
  say "  ❌ deploy FAILED — see log"; say "════ rn_daily END (FAIL) ════"; exit 1
fi

# ── 4: POST-DEPLOY HEALTH CHECK ──────────────────────────────────────────────
say "[4/4] health check"
CANON=$(curl -sS -o /dev/null -w '%{http_code}' -I "http://roamsnotes.com/")          # expect 301
HOME=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/")                            # expect 200
SMAP=$(curl -sS "$SITE_URL/sitemap.xml" | grep -o '<loc>' | wc -l)
GO=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/go/fiverr-tarot/")              # expect 200
# Warn if monetization/analytics ids are still empty (no GA4/Clarity/affiliate effect).
IDS_EMPTY=$(grep -cE '(ga4Id|clarityId|googleSiteVerification|fiverrAffiliateId) = ""' hugo.toml)
say "  canonical(http→)=$CANON home=$HOME sitemap=$SMAP go=$GO empty_ids=$IDS_EMPTY/4"
[ "$IDS_EMPTY" -gt 0 ] && say "  ⚠ $IDS_EMPTY of 4 ids still empty in hugo.toml — analytics/affiliate not fully live"
[ "$CANON" = 301 ] || say "  ⚠ non-www did not 301 — check nginx canonical block"
[ "$HOME" = 200 ] || say "  ⚠ homepage not 200"

say "════ rn_daily END (OK) ════"
