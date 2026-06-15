# RoamsNotes Hugo PSEO

Static PSEO site for RoamsNotes' Fiverr affiliate funnel.

## Daily workflow

1. Add or edit page data in `data/pseo/pages.yaml` (and `data/affiliate/links.yaml` for /go/ targets).
2. Run `bash deploy.sh` — runs the quality gate, generates pages + /go/ redirects, builds with Hugo, backs up the remote webroot, pushes `public/` over ssh, prunes stale /go/ slugs, fixes ownership, and verifies the live site.

`deploy.sh` is the RN equivalent of hu-qian's `huqian_deploy.sh`, adapted because RN's Hugo source lives only locally — the VPS holds just built static files. Override host/paths via env: `RN_SSH_HOST`, `RN_SSH_PORT`, `RN_SSH_KEY`, `RN_WEB_ROOT`, `RN_SITE_URL`. For a build without deploying, use `npm run build`.

## Daily engine (`rn_daily.sh`)

The RN counterpart to hu-qian's `huqian_daily.sh` — but deliberately **not** a mass page generator. RN is in the 15-page validation phase, where churning out pages would dilute authority and trip Google's helpful-content signals. Instead the daily run does:

1. **Sky data** (`scripts/update_sky.js`) — today's moon phase (computed) + Mercury retrograde (from `data/sky/mercury_retrograde.yaml`, which you fill from a trusted source; never fabricated). Rendered as an astro-seek-style "sky today" band on the homepage with one restrained soft link — a freshness + return-visit hook.
2. **Freshness audit** (`scripts/freshness_audit.js`) — flags pages whose `last_updated` anchors are aging past `RN_FRESH_DAYS` (default 60) so you re-check prices; it never auto-bumps the date.
3. **Quality gate** → **build + deploy** (`deploy.sh`) → **health check** (canonical 301, homepage 200, sitemap count, /go/ resolve, and a warning if the 4 monetization/analytics ids are still empty).

Run it: `bash rn_daily.sh`. **Scheduling note:** unlike hu-qian (cron'd on the VPS, where its source lives), RN's source is local-only, so schedule `rn_daily.sh` on the **local machine** (Windows Task Scheduler running Git Bash, e.g. `"C:\Program Files\Git\bin\bash.exe" -lc "cd /e/Down/Cursor/codex-PSEO/roamsnotes.com/hugo-pseo && ./rn_daily.sh"`). Logs land in `logs/daily.log`.

## Commands

```bash
npm run dev
npm run build
npm run quality
npm run generate
```

## Architecture

- Hugo builds static HTML, so no WordPress-style backend is required for stage one.
- PSEO pages are generated from `data/pseo/pages.yaml`.
- Interactive tools run in the browser through `assets/js/tools.js`.
- `scripts/quality_gate.js` blocks risky claims and missing SEO basics before publishing.

## When to add a backend

Use a small API or Cloudflare Worker later only if the site needs live Fiverr data, login, saved results, payment, or server-side tracking.
