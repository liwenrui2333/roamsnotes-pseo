#!/usr/bin/env node
// 下载 Rider-Waite-Smith 牌面（1909，美国公共领域）到 static/img/tarot/<card_slug>.jpg。
// 源：Wikimedia Commons Special:FilePath（会 302 到真实图）。按需运行，已存在则跳过。
//   用法: node scripts/fetch_rws.mjs
// 说明：RWS 牌面在美国属公共领域；用于本站合法。若需更稳，可改下载到本地后自行托管（本脚本即如此）。

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const assets = yaml.parse(fs.readFileSync(path.join(root, "content-engine/data/assets.yaml"), "utf8"));
const rws = assets.rws || {};
const outDir = path.join(root, "static/img/tarot");
fs.mkdirSync(outDir, { recursive: true });

let ok = 0, skip = 0, fail = 0;
for (const [slug, file] of Object.entries(rws)) {
  const dest = path.join(outDir, `${slug}.jpg`);
  if (fs.existsSync(dest)) { skip++; continue; }
  await new Promise((r) => setTimeout(r, 1200)); // 限速，避开 Wikimedia 429
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=600`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "RoamsNotes/1.0 (content-engine; public-domain RWS)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`OK   ${slug} <- ${file} (${buf.length}b)`);
    ok++;
  } catch (e) {
    console.error(`FAIL ${slug} (${file}): ${e.message}`);
    fail++;
  }
}
console.log(`\nrws fetch ok=${ok} skip=${skip} fail=${fail} -> static/img/tarot/`);
