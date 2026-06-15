// Reports PSEO pages whose data anchors (last_updated) are aging past the freshness
// window, so a human re-checks the prices/turnarounds before they go stale. It never
// rewrites last_updated automatically — bumping the date without re-checking the data
// would be dishonest and is exactly what we don't want. Non-fatal: prints a list.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const pages = yaml.parse(fs.readFileSync(path.join(root, "data", "pseo", "pages.yaml"), "utf8"));
const FRESH_DAYS = Number(process.env.RN_FRESH_DAYS || 60);
const now = Date.now();

const stale = [];
for (const p of pages) {
  if (!p.last_updated) { stale.push([p.slug, "no date"]); continue; }
  const age = Math.round((now - Date.parse(p.last_updated)) / 86400000);
  if (Number.isNaN(age)) stale.push([p.slug, "bad date"]);
  else if (age > FRESH_DAYS) stale.push([p.slug, `${age}d old`]);
}

if (stale.length) {
  console.log(`freshness_audit: ${stale.length}/${pages.length} pages need a data re-check (window ${FRESH_DAYS}d):`);
  for (const [slug, why] of stale) console.log(`  - ${slug} (${why})`);
} else {
  console.log(`freshness_audit: all ${pages.length} pages within ${FRESH_DAYS}d window`);
}
