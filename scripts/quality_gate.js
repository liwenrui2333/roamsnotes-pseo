import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const dataPath = path.join(root, "data", "pseo", "pages.yaml");
const pages = yaml.parse(fs.readFileSync(dataPath, "utf8"));
const banned = [
  "guaranteed result",
  "guaranteed love",
  "remove curse",
  "curse removal",
  "wealth leak",
  "medical advice",
  "legal advice",
  "financial certainty"
];

// Freshness window (L3): data anchors should be re-checked within this many days.
const FRESH_DAYS = Number(process.env.RN_FRESH_DAYS || 60);
const now = Date.now();

let failures = 0;
let warnings = 0;
for (const page of pages) {
  const text = JSON.stringify(page).toLowerCase();
  const missing = [];
  for (const key of ["slug", "title", "description", "intent", "audience", "primary_cta", "cta_url", "sections", "related"]) {
    if (!page[key] || (Array.isArray(page[key]) && page[key].length === 0)) missing.push(key);
  }
  const hits = banned.filter((term) => text.includes(term));

  // L0 — data anchors: a page must carry concrete, verifiable anchors, not just prose.
  const l0 = [];
  if (!page.budget) l0.push("budget");
  if (!page.delivery) l0.push("delivery");
  if (!Array.isArray(page.sections) || page.sections.length < 4) l0.push("sections>=4");
  // At least one numeric/price anchor somewhere on the page.
  if (!/\$\d|\d+\s*(day|days|min|week)/i.test(text)) l0.push("price/time anchor");

  // L3 — freshness: last_updated present and within window.
  const l3 = [];
  if (!page.last_updated) {
    l3.push("last_updated missing");
  } else {
    const age = (now - Date.parse(page.last_updated)) / 86400000;
    if (Number.isNaN(age)) l3.push("last_updated unparseable");
    else if (age > FRESH_DAYS) l3.push(`stale ${Math.round(age)}d`);
  }

  // L4 — readability: every section body should carry structure (list/table/paragraph breaks),
  // not a single "tofu block". WARN-level so legacy prose pages don't break the build.
  const l4 = [];
  for (const s of (Array.isArray(page.sections) ? page.sections : [])) {
    const b = String(s.body || "");
    // 只抓"长"豆腐块：短小节(<300字符)单段是正常的，不算墙。
    if (b.length > 300 && !(/\n\s*[-*\d]/.test(b) || b.includes("|") || /\n\s*\n/.test(b))) l4.push((s.heading || "?").slice(0, 16));
  }
  // L5 — visual asset: page should have a hero or at least one section image.
  const l5 = !(page.hero && page.hero.src) && !((Array.isArray(page.sections) ? page.sections : []).some((s) => s.image && s.image.src));

  if (missing.length || hits.length || l0.length) {
    failures += 1;
    console.error(`FAIL ${page.slug}: missing=${missing.join(",") || "-"} banned=${hits.join(",") || "-"} L0=${l0.join(",") || "-"}`);
  }
  if (l3.length || l4.length || l5) {
    warnings += 1;
    const parts = [l3.length ? `L3 ${l3.join(",")}` : "", l4.length ? `L4 tofu:${l4.join("/")}` : "", l5 ? "L5 no-image" : ""].filter(Boolean);
    console.warn(`WARN ${page.slug}: ${parts.join(" | ")}`);
  }
}

if (failures) {
  console.error(`quality_gate=failed pages=${failures} warnings=${warnings}`);
  process.exit(1);
}

console.log(`quality_gate=passed pages=${pages.length} warnings=${warnings}`);
