#!/usr/bin/env node
// 旧页回炉（确定性·零 API·零内容漂移）：给缺 hero/tldr 的旧页加 hero 图 + tldr +
// 把每节正文按句分段（消 L4 豆腐块）。不改任何事实文字。
//   用法: node content-engine/reformat_legacy.mjs        (预览)
//         node content-engine/reformat_legacy.mjs --write (写回 pages.yaml)
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const pagesPath = path.join(root, "data", "pseo", "pages.yaml");
const raw = fs.readFileSync(pagesPath, "utf8");
const header = (raw.match(/^(#[^\n]*\n)+/) || [""])[0]; // 保留文件头注释
const pages = yaml.parse(raw);

// 按 category 选 hero（公共领域 RWS / 已生成资产）
const heroFor = (p) => {
  const c = (p.category || "").toLowerCase();
  if (c.includes("astro")) return ["/img/tarot/the-star.jpg", "The Star — celestial guidance"];
  if (c.includes("compar")) return ["/img/tarot/wheel-of-fortune.jpg", "Wheel of Fortune — weighing options"];
  if (c.includes("tarot") || c.includes("budget") || c.includes("safety")) return ["/img/tarot/the-high-priestess.jpg", "The High Priestess — inner knowing"];
  return ["/img/tarot/the-magician.jpg", "The Magician — making a choice"];
};

// 把一坨正文按句分段：每 2 句一段，保留原文不改字
const paragraphize = (body) => {
  const t = String(body).trim();
  if (/\n\s*\n/.test(t) || /\n\s*[-*\d]/.test(t) || t.includes("|")) return t; // 已有结构则不动
  const sents = t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t];
  const out = [];
  for (let i = 0; i < sents.length; i += 2) out.push(sents.slice(i, i + 2).join("").trim());
  return out.join("\n\n");
};

let changed = 0;
for (const p of pages) {
  if (p.hero && p.tldr) continue; // 引擎新页已合格，跳过
  if (!p.sections) continue;
  const [src, alt] = heroFor(p);
  if (!p.hero) p.hero = { src, alt };
  if (!p.tldr) p.tldr = String(p.description || p.intent || "").trim();
  for (const s of p.sections) if (s && s.body) s.body = paragraphize(s.body);
  changed++;
  console.log(`reformatted: ${p.slug}  hero=${src.split("/").pop()}`);
}

console.log(`\nlegacy pages reformatted=${changed} write=${WRITE}`);
if (WRITE && changed) {
  fs.writeFileSync(pagesPath, header + "\n" + yaml.stringify(pages), "utf8");
  console.log("written -> data/pseo/pages.yaml");
}
