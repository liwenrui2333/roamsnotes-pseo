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

# ── FAILURE VISIBILITY ───────────────────────────────────────────────────────
# 2026-07-26: this run failed silently for 5 consecutive days (07-22..07-26) and
# nobody noticed — Task Scheduler only records Result=1, which nobody reads.
# A gate that can halt the pipeline MUST be able to announce that it did.
# Desktop marker file is the reliable channel (balloon tips may be suppressed in
# the scheduler's session); the balloon is best-effort on top.
DESKTOP="$(powershell.exe -NoProfile -NonInteractive -Command '[Environment]::GetFolderPath("Desktop")' 2>/dev/null | tr -d '\r')"
MARKER=""
[ -n "$DESKTOP" ] && [ -d "$DESKTOP" ] && MARKER="$DESKTOP/RN日更失败-必看.txt"

alert() {                       # alert <one-line reason>
  local reason="$1"
  say "  🔔 ALERT: $reason"
  if [ -n "$MARKER" ]; then
    {
      echo "RoamsNotes 日更失败"
      echo "时间: $(TS)"
      echo "原因: $reason"
      echo ""
      echo "线上内容不会更新, 直到此问题被修复。"
      echo "查看完整日志: $LOG"
      echo "手动重跑:     cd \"$REPO\" && bash rn_daily.sh"
      echo ""
      echo "(此文件由 rn_daily.sh 自动生成; 修好后可直接删除)"
    } > "$MARKER" 2>/dev/null
  fi
  powershell.exe -NoProfile -NonInteractive -Command "
    try {
      Add-Type -AssemblyName System.Windows.Forms,System.Drawing
      \$n = New-Object System.Windows.Forms.NotifyIcon
      \$n.Icon = [System.Drawing.SystemIcons]::Warning
      \$n.Visible = \$true
      \$n.ShowBalloonTip(20000,'RoamsNotes 日更失败','$reason','Warning')
      Start-Sleep -Seconds 8; \$n.Dispose()
    } catch {}" >/dev/null 2>&1 &
}

die() { alert "$1"; say "════ rn_daily END (FAIL) ════"; exit 1; }

# rotate log past 512 KB (timestamped so a same-day second rotation can't clobber)
[ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 524288 ] && mv "$LOG" "$LOG.$(date +%Y%m%d-%H%M%S)"
say "════ rn_daily START ════"

SITE_URL="${RN_SITE_URL:-https://www.roamsnotes.com}"

# Daily AI content generation (sky article + event pages). The 2026-07 plan freezes
# "每日运势和天象日更" and lists "建自动内容生产 cron" as data-gated, so this is now a
# switch rather than a hardcoded behaviour. Set RN_DAILY_CONTENT=0 to freeze generation
# while keeping the deploy/health pipeline alive. Default 1 = current behaviour unchanged.
DAILY_CONTENT="${RN_DAILY_CONTENT:-1}"

# ── 1: THEMED DATA — today's sky (the daily "content") ───────────────────────
step "[1/7] refresh sky data (moon phase + mercury rx)" node scripts/update_sky.js
if [ "$DAILY_CONTENT" = "1" ]; then
  step "[2/7] generate today's sky article (gpt-5.5)" node content-engine/generate_sky_article.mjs --write
  step "[3/7] rebuild astro event calendar (computed moons)" node scripts/build_event_calendar.mjs
  step "[4/7] generate upcoming event pages (skip existing)" node content-engine/generate_event_pages.mjs --window 60 --max 2 --write
else
  say "[2/7] sky article      — SKIPPED (RN_DAILY_CONTENT=0)"
  say "[3/7] event calendar   — SKIPPED (RN_DAILY_CONTENT=0)"
  say "[4/7] event pages      — SKIPPED (RN_DAILY_CONTENT=0)"
fi
# NOTE: trend_harvest.mjs removed from the daily run 2026-07-08. It wrote topics/trending.yaml
# but nothing downstream consumes that file, so it burned ~17 min/day for no output and widened
# the window for a transient SSH drop. Run it on demand instead:
#   node content-engine/trend_harvest.mjs

# ── 5: FRESHNESS AUDIT — flag stale data anchors (non-fatal) ─────────────────
step "[5/7] freshness audit" node scripts/freshness_audit.js

# ── 6: QUALITY GATE — blocks bad content before build ────────────────────────
say "[6/7] quality gate"
if node scripts/quality_gate.js >>"$LOG" 2>&1; then
  say "  ok"
else
  die "quality gate FAILED — 内容未通过门禁, 线上保持原样"
fi

# ── 7: BUILD + DEPLOY (delegates to deploy.sh: generate, build, push, verify) ─
say "[7/7] build + deploy"
if bash "$REPO/deploy.sh" >>"$LOG" 2>&1; then
  say "  ✓ deployed"
else
  die "deploy FAILED — 线上内容已停止更新, 见 logs/daily.log 末尾的 FAIL 行"
fi

# ── POST-DEPLOY HEALTH CHECK ─────────────────────────────────────────────────
say "[verify] health check"
CANON=$(curl -sS -o /dev/null -w '%{http_code}' -I "http://roamsnotes.com/")          # expect 301
HOME=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/")                            # expect 200
SMAP=$(curl -sS "$SITE_URL/sitemap.xml" | grep -o '<loc>' | wc -l)
GO=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/go/fiverr-tarot/")              # expect 200
# Warn only on ids whose absence actually breaks something: GA4, Clarity, affiliate.
# googleSiteVerification is deliberately excluded — GSC is verified via sc-domain DNS,
# so the HTML-tag token is redundant and its emptiness is expected, not a fault. It used
# to fire a warning every single day; a permanently-crying alarm trains you to ignore
# alarms, which is exactly how the 07-22 outage went unnoticed for 5 days.
IDS_EMPTY=$(grep -cE '(ga4Id|clarityId|fiverrAffiliateId) = ""' hugo.toml)
say "  canonical(http→)=$CANON home=$HOME sitemap=$SMAP go=$GO empty_ids=$IDS_EMPTY/3"
[ "$IDS_EMPTY" -gt 0 ] && say "  ⚠ $IDS_EMPTY of 3 functional ids empty in hugo.toml — analytics/affiliate not fully live"
[ "$CANON" = 301 ] || say "  ⚠ non-www did not 301 — check nginx canonical block"
[ "$HOME" = 200 ] || say "  ⚠ homepage not 200"

# ── THE ONLY CHECK THAT PROVES CONTENT ACTUALLY SHIPPED ──────────────────────
# Everything above answers "is the site alive?" — which stayed true throughout the
# 07-22..07-26 outage while the live copy sat 4 days stale. This one answers
# "did today's build actually reach production?" by reading the date back off the
# live daily page. Only meaningful while daily content generation is enabled.
if [ "$DAILY_CONTENT" = "1" ]; then
  TODAY="$(date +%Y-%m-%d)"
  LIVE_SKY="$(curl -sS --max-time 25 "$SITE_URL/todays-sky/" \
              | grep -oE '<title>[^<]*' | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)"
  if [ "$LIVE_SKY" = "$TODAY" ]; then
    say "  ✓ live content verified: /todays-sky/ = $LIVE_SKY"
  else
    die "线上内容未更新: /todays-sky/ 显示 ${LIVE_SKY:-<读取失败>}, 应为 $TODAY (deploy 报成功但产物没到线上)"
  fi
fi

# Success path: clear the marker so a stale warning never outlives the problem.
[ -n "$MARKER" ] && [ -f "$MARKER" ] && rm -f "$MARKER" && say "  (已清除桌面失败标记)"

say "════ rn_daily END (OK) ════"
