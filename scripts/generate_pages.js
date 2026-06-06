import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const dataPath = path.join(root, "data", "pseo", "pages.yaml");
const outDir = path.join(root, "content");
const pages = yaml.parse(fs.readFileSync(dataPath, "utf8"));

for (const page of pages) {
  const dir = path.join(outDir, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "index.md");
  const content = [
    "---",
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    "---",
    "",
    "Generated from structured PSEO data. Edit data/pseo/pages.yaml, then rerun scripts/generate_pages.js.",
    ""
  ].join("\n");
  fs.writeFileSync(file, content, "utf8");
}

console.log(`generated=${pages.length}`);
