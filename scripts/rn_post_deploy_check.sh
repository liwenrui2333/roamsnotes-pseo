#!/usr/bin/env bash
set -u
SITE_URL="${RN_SITE_URL:-https://www.roamsnotes.com}"
WEB_ROOT="${RN_WEB_ROOT:-/www/wwwroot/roamsnotes.com}"
failures=0
fail(){ echo "FAIL $*" >&2; failures=$((failures+1)); }
code(){ curl -L -sS --max-time 20 -o /dev/null -w '%{http_code}' "$SITE_URL$1"; }
echo "rn_post_deploy_check site=$SITE_URL root=$WEB_ROOT"
for route in / /sitemap.xml /llms.txt /tools/ /fiverr-tarot-reading/ /is-my-ex-coming-back-tarot/; do
  c=$(code "$route") || c=000
  echo "core $route $c"
  [ "$c" = 200 ] || fail "core $route returned $c"
done
robots=$(curl -L -sS --max-time 20 "$SITE_URL/robots.txt" || true)
echo "$robots" | grep -Eq '^Disallow:[[:space:]]*/go/?$' || fail "robots.txt missing Disallow: /go/"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -L -sS --max-time 30 "$SITE_URL/sitemap.xml" > "$tmp/sitemap.xml" || fail "cannot fetch sitemap"
mapfile -t urls < <(grep -oE '<loc>[^<]+</loc>' "$tmp/sitemap.xml" | sed -E 's#</?loc>##g')
missing_lastmod=$(grep -oE '<url>' "$tmp/sitemap.xml" | wc -l | tr -d ' ')
present_lastmod=$(grep -oE '<lastmod>[^<]+</lastmod>' "$tmp/sitemap.xml" | wc -l | tr -d ' ')
[ "$missing_lastmod" = "$present_lastmod" ] || fail "sitemap lastmod count=$present_lastmod url count=$missing_lastmod"
sitemap_noindex=0
for url in "${urls[@]}"; do
  route=$(printf '%s' "$url" | sed -E 's#https?://[^/]+##')
  [ -n "$route" ] || route=/
  page=$(curl -L -sS --max-time 20 "$SITE_URL$route" || true)
  c=$(code "$route") || c=000
  echo "$page" | grep -Eiq 'name=["'"'"']robots["'"'"'][^>]*noindex' && { sitemap_noindex=$((sitemap_noindex+1)); fail "noindex URL in sitemap $route"; }
  echo "$page" | grep -Eiq '<link[^>]*rel=(["'"'"'])?canonical[^>]*href=(["'"'"'])?https?://' || fail "missing canonical $route"
  echo "$page" | grep -Eiq 'property=["'"'"']og:image["'"'"'][^>]+content=["'"'"']https?://' || fail "missing absolute og:image $route"
  [ "$c" = 200 ] || fail "sitemap URL $route returned $c"
done
echo "sitemap_count=${#urls[@]} sitemap_noindex=$sitemap_noindex"
home=$(curl -L -sS --max-time 20 "$SITE_URL/" || true)
h1=$(printf '%s' "$home" | grep -Eio '<h1\b' | wc -l | tr -d ' ')
echo "homepage_h1=$h1"
[ "$h1" = 1 ] || fail "homepage H1 count=$h1"
for icon in cards heart receipt user-search; do
  printf '%s' "$home" | grep -Eiq "<img[^>]*src=([\"'])?/?img/icons/$icon\.svg([\"'])?[^>]*alt=([\"'])?[^[:space:]\"'>]+" || fail "homepage icon missing non-empty alt: $icon.svg"
done
cache_control=$(curl -L -sSI --max-time 20 "$SITE_URL/" | tr -d '\r' | awk -F': ' 'tolower($1)=="cache-control"{print $2; exit}')
echo "homepage_cache_control=${cache_control:-missing}"
[ -n "$cache_control" ] || fail "homepage missing Cache-Control"
go_count=0
if [ -d "$WEB_ROOT/go" ]; then
  while IFS= read -r dir; do
    slug=$(basename "$dir"); route="/go/$slug/"; c=$(code "$route") || c=000
    go_count=$((go_count+1)); [ "$c" = 200 ] || fail "$route returned $c"
  done < <(find "$WEB_ROOT/go" -mindepth 1 -maxdepth 1 -type d)
fi
echo "go_routes=$go_count"
link_failures=0; link_count=0
if [ -d "$WEB_ROOT" ]; then
  while IFS= read -r route; do
    [ -n "$route" ] || continue
    case "$route" in /go/*|mailto:*|tel:*|javascript:*|//*) continue;; esac
    route="${route%%\#*}"; route="${route%%\?*}"; [ "$route" = "/" ] && :
    link_count=$((link_count+1)); c=$(code "$route") || c=000
    if [ "$c" != 200 ]; then echo "FAIL internal_link $route status=$c" >&2; link_failures=$((link_failures+1)); fi
  done < <(grep -rhoE 'href=("/[^"]*"|'"'"'/'"'"'[^'"'"']*'"'"'|/[^[:space:]>]*)' "$WEB_ROOT" --include='*.html' 2>/dev/null | sed -E 's/^href=["'"'"']?//' | sed -E 's/["'"'"']$//' | sort -u)
fi
echo "internal_links_checked=$link_count internal_link_failures=$link_failures"
[ "$link_failures" = 0 ] || failures=$((failures+1))
log=$(find /www/wwwlogs /www/server/nginx/logs /var/log/nginx -type f -name '*.log' 2>/dev/null | head -n 1 || true)
if [ -n "$log" ]; then
  echo "log_file=$log"
  grep -i 'Googlebot' "$log" | tail -n 20000 | wc -l | awk '{print "googlebot_recent=" $1}'
  grep -i 'bingbot' "$log" | tail -n 20000 | wc -l | awk '{print "bingbot_recent=" $1}'
  grep -E ' /go/[^ ]* ' "$log" | tail -n 20000 | wc -l | awk '{print "go_hits_recent=" $1}'
  grep ' 404 ' "$log" | tail -n 20 | awk '{print $7}' | sort | uniq -c | sort -nr | head -n 20
else
  echo 'WARN access log not found; skipped bot/404 summary'
fi
echo "rn_post_deploy_check failures=$failures"
[ "$failures" = 0 ]
