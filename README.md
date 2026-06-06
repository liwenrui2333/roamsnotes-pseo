# RoamsNotes Hugo PSEO

Static PSEO site for RoamsNotes' Fiverr affiliate funnel.

## Daily workflow

1. Add or edit page data in `data/pseo/pages.yaml`.
2. Run `npm run build`.
3. Deploy the `public/` folder.

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
