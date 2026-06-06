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

let failures = 0;
for (const page of pages) {
  const text = JSON.stringify(page).toLowerCase();
  const missing = [];
  for (const key of ["slug", "title", "description", "intent", "audience", "primary_cta", "cta_url", "sections", "related"]) {
    if (!page[key] || (Array.isArray(page[key]) && page[key].length === 0)) missing.push(key);
  }
  const hits = banned.filter((term) => text.includes(term));
  if (missing.length || hits.length) {
    failures += 1;
    console.error(`FAIL ${page.slug}: missing=${missing.join(",") || "-"} banned=${hits.join(",") || "-"}`);
  }
}

if (failures) {
  console.error(`quality_gate=failed pages=${failures}`);
  process.exit(1);
}

console.log(`quality_gate=passed pages=${pages.length}`);
