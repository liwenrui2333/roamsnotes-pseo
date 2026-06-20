#!/usr/bin/env node
// 用 content-engine/data/assets.yaml 的字形+元素色，生成星座 SVG（零成本，无外部依赖）。
//   - 单星座: static/img/zodiac/<sign>.svg
//   - 配对图: static/img/zodiac/<a>-<b>.svg（按 content-engine/topics/wave1.yaml 的 compatibility 题）
// 用法: node scripts/make_zodiac_svg.mjs

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const assets = yaml.parse(fs.readFileSync(path.join(root, "content-engine/data/assets.yaml"), "utf8"));
const topics = yaml.parse(fs.readFileSync(path.join(root, "content-engine/topics/wave1.yaml"), "utf8"));
const Z = assets.zodiac;
const outDir = path.join(root, "static/img/zodiac");
fs.mkdirSync(outDir, { recursive: true });

const single = (sign) => {
  const s = Z[sign];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="${sign}">
  <rect width="200" height="200" rx="16" fill="${s.color}" opacity="0.12"/>
  <text x="100" y="120" font-size="110" text-anchor="middle" fill="${s.color}">${s.glyph}</text>
  <text x="100" y="170" font-size="20" text-anchor="middle" fill="#555" font-family="sans-serif">${cap(sign)}</text>
</svg>`;
};

const pair = (a, b) => {
  const A = Z[a], B = Z[b];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" role="img" aria-label="${a} and ${b}">
  <rect width="420" height="200" rx="16" fill="#f5f3ef"/>
  <text x="120" y="115" font-size="96" text-anchor="middle" fill="${A.color}">${A.glyph}</text>
  <text x="120" y="165" font-size="18" text-anchor="middle" fill="#555" font-family="sans-serif">${cap(a)}</text>
  <text x="210" y="110" font-size="40" text-anchor="middle" fill="#bbb" font-family="sans-serif">&amp;</text>
  <text x="300" y="115" font-size="96" text-anchor="middle" fill="${B.color}">${B.glyph}</text>
  <text x="300" y="165" font-size="18" text-anchor="middle" fill="#555" font-family="sans-serif">${cap(b)}</text>
</svg>`;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let n = 0;
for (const sign of Object.keys(Z)) { fs.writeFileSync(path.join(outDir, `${sign}.svg`), single(sign)); n++; }
for (const t of topics.filter((t) => t.type === "compatibility")) {
  fs.writeFileSync(path.join(outDir, `${t.sign_a}-${t.sign_b}.svg`), pair(t.sign_a, t.sign_b)); n++;
}
console.log(`zodiac svg written=${n} -> static/img/zodiac/`);
