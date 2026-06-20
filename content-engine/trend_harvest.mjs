#!/usr/bin/env node
// RN 趋势词采集器：Google 自动补全(免key) → 去重(比 pages.yaml) → 打分 → topics/trending.yaml
// 抓"正在被搜、含事件/日期信号、低竞争"的长尾，喂 content-engine。
//   node content-engine/trend_harvest.mjs            # 采集并写 topics/trending.yaml
//   node content-engine/trend_harvest.mjs --dry      # 只打印 top 候选，不写盘
// 无需 API key。礼貌限速。Trends/Reddit 两路见 README（本脚本先落自动补全这一路）。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");
const DRY = process.argv.includes("--dry");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
// bare seeds: 自动补全本身会吐 "X 2026 / X june 2026" 这类事件长尾
const SEEDS = [
  "tarot","love tarot","tarot spread","tarot card meaning",
  "mercury retrograde","full moon","new moon","solar eclipse","lunar eclipse",
  "horoscope today","weekly horoscope","zodiac compatibility","birth chart",
  "twin flame","soulmate tarot","yes or no tarot","is my ex coming back",
  ...SIGNS.map((s) => `${s} horoscope`),
  ...SIGNS.map((s) => `${s} tarot`),
];
// 这些再做 a–z 扩展（事件/牌意类长尾最密集）
const EXPAND = ["mercury retrograde","full moon","new moon","tarot card","retrograde 2026","eclipse 2026"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

async function suggest(q) {
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(q)}`;
  try { const j = JSON.parse(await (await fetch(u)).text()); return Array.isArray(j[1]) ? j[1] : []; }
  catch { return []; }
}

const slugify = (s) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const existing = new Set((yaml.parse(fs.readFileSync(path.join(root, "data", "pseo", "pages.yaml"), "utf8")) || []).map((p) => p.slug));

const DATE_RE = /\b(20\d\d|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
function classify(q) {
  const l = q.toLowerCase();
  const signsIn = SIGNS.filter((s) => l.includes(s));
  if (/retrograde|full moon|new moon|eclipse|solstice|equinox/.test(l)) return "event";
  if (signsIn.length >= 2 || l.includes("compatibility")) return "compatibility";
  if (l.includes("spread") || /three card|celtic cross|yes or no/.test(l)) return "spread";
  if (/is my ex|does he|will i|is he thinking|soulmate|twin flame/.test(l)) return "emotional";
  if (/horoscope|today|this week|moon in/.test(l)) return "sky";
  return "info";
}

const pool = new Map(); // query -> {count, sources:Set}
function add(q, src) {
  q = q.trim();
  if (q.length < 8 || q.length > 70) return;
  const cur = pool.get(q) || { count: 0, sources: new Set() };
  cur.count++; cur.sources.add(src); pool.set(q, cur);
}

console.log(`harvesting ${SEEDS.length} bare seeds + ${EXPAND.length}×26 a–z expansions ...`);
for (const s of SEEDS) { (await suggest(s)).forEach((x) => add(x, s)); await sleep(120); }
for (const s of EXPAND) for (const L of LETTERS) { (await suggest(`${s} ${L}`)).forEach((x) => add(x, s)); await sleep(80); }

// 打分：被多个种子surface(+) × 含日期/事件信号(+) × 未建页(必)
const rows = [];
for (const [q, v] of pool) {
  const slug = slugify(q);
  if (!slug || existing.has(slug)) continue;
  const type = classify(q);
  const dateSig = DATE_RE.test(q) ? 2 : 0;
  const eventSig = type === "event" ? 2 : 0;
  const score = v.count + dateSig + eventSig;
  rows.push({ query: q, slug, suggested_type: type, score, freq: v.count, date_signal: !!dateSig });
}
rows.sort((a, b) => b.score - a.score);
// 按类型分桶取 top，保证候选库各意图都有料（event 是主打，给更大配额）
const CAP = { event: 30, compatibility: 12, emotional: 12, spread: 8, sky: 8, info: 10 };
const bucket = {};
const top = [];
for (const r of rows) {
  bucket[r.suggested_type] = bucket[r.suggested_type] || 0;
  if (bucket[r.suggested_type] >= (CAP[r.suggested_type] || 8)) continue;
  bucket[r.suggested_type]++; top.push(r);
}
top.sort((a, b) => b.score - a.score);

console.log(`\n== top 20 candidates (of ${rows.length} new) ==`);
for (const r of top.slice(0, 20)) console.log(`  [${r.score}] ${r.suggested_type.padEnd(13)} ${r.query}`);
const byType = top.reduce((m, r) => ((m[r.suggested_type] = (m[r.suggested_type] || 0) + 1), m), {});
console.log("\ntype mix(top80):", JSON.stringify(byType));

if (DRY) { console.log("\n--dry: not written."); process.exit(0); }
const out = { generated: new Date().toISOString().slice(0, 10), source: "google-autocomplete",
  note: "候选词。人工/打分挑 top N，按 suggested_type 转成对应 wave 选题再过 content-engine。event 类需配 event_calendar 真实日期。",
  candidates: top };
fs.writeFileSync(path.join(__dir, "topics", "trending.yaml"), yaml.stringify(out), "utf8");
console.log(`\nwrote topics/trending.yaml (${top.length} candidates).`);
