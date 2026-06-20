#!/usr/bin/env node
// RN 事件页生成：读 event_calendar.yaml 里"未来 WINDOW 天内、尚未建页"的事件，
// 用 type-event.md(人格+真实日期) 提前卡位生成 [event]-[month]-[year] 页。append + skip 已存在。
//   node content-engine/generate_event_pages.mjs            # 干跑
//   node content-engine/generate_event_pages.mjs --write    # 生成+落盘
//   node content-engine/generate_event_pages.mjs --window 60 --write
// env: OPENAI_BASE_URL, OPENAI_API_KEY, RN_MODEL
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");
const DATE = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const argVal = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d; };
const WINDOW = argVal("--window", 60);
const MAX = argVal("--max", 4);

for (const envPath of [path.join(root, ".env"), path.join(__dir, ".env")]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const read = (p) => fs.readFileSync(path.join(__dir, p), "utf8");
const VOICE = read("voice.md"), SYSTEM = read("prompts/system.md"), TPL = read("prompts/type-event.md");
const cal = yaml.parse(read("topics/event_calendar.yaml")) || {};
const pagesPath = path.join(root, "data", "pseo", "pages.yaml");
const existing = new Set((yaml.parse(fs.readFileSync(pagesPath, "utf8")) || []).map((p) => p.slug));

const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date(DATE);
// 候选 = moons + 已填日期的 retrogrades/eclipses，在窗口内、未建页
let events = [...(cal.moons || [])];
for (const r of cal.retrogrades || []) if (r.start) {
  const d = new Date(r.start);
  events.push({ kind: `${r.planet}-retrograde`, date: r.start, month: MONTH[d.getUTCMonth()], year: d.getUTCFullYear(),
    slug: `${r.planet}-retrograde-${MONTH[d.getUTCMonth()].toLowerCase()}-${d.getUTCFullYear()}`,
    target_kw: `${r.planet} retrograde ${MONTH[d.getUTCMonth()].toLowerCase()} ${d.getUTCFullYear()}`,
    event_name: `${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()} ${r.planet[0].toUpperCase()+r.planet.slice(1)} Retrograde` });
}
const inWindow = events.filter((e) => {
  const diff = (new Date(e.date) - today) / 86400000;
  return diff >= -2 && diff <= WINDOW && !existing.has(e.slug);
}).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, MAX);

const HERO_SRC = "/img/tarot/the-star.jpg";
const RELATED = ["/tools/tarot-question-generator/", "/tools/astrology-reading-cost-calculator/", "/birth-chart-reading-on-fiverr/"];
function assemble(e) {
  const vars = {
    "{{EVENT_NAME}}": e.event_name, "{{EVENT_KIND}}": e.kind, "{{EVENT_DATE}}": e.date,
    "{{MONTH}}": e.month, "{{YEAR}}": String(e.year), "{{TARGET_KW}}": e.target_kw, "{{SLUG}}": e.slug,
    "{{TOOL_PATH}}": "/tools/tarot-question-generator/", "{{MONEY_PATH}}": "/birth-chart-reading-on-fiverr/",
    "{{RELATED}}": JSON.stringify(RELATED), "{{HERO_SRC}}": HERO_SRC, "{{DATE}}": DATE,
  };
  let user = TPL;
  for (const [k, v] of Object.entries(vars)) user = user.split(k).join(String(v));
  return { system: `${VOICE}\n\n---\n\n${SYSTEM}`, user };
}
function validate(p) {
  const errs = [];
  for (const k of ["slug","title","h1","description","intent","audience","primary_cta","cta_url","tldr","sections","faq","related","budget","delivery","last_updated"])
    if (!p[k] || (Array.isArray(p[k]) && p[k].length === 0)) errs.push(`missing ${k}`);
  if (Array.isArray(p.sections) && p.sections.length < 5) errs.push("sections<5");
  if (Array.isArray(p.related) && p.related.length !== 3) errs.push("related!=3");
  if (!(p.hero && p.hero.src)) errs.push("no hero");
  if (!/\$\d|\d+\s*(day|days|card|cards|min|week|%)/i.test(JSON.stringify(p).toLowerCase())) errs.push("no anchor");
  for (const s of p.sections || []) { const b = String(s.body || "");
    if (b.length > 300 && !(/\n\s*[-*\d]/.test(b) || b.includes("|") || /\n\s*\n/.test(b))) errs.push(`tofu:${(s.heading||"?").slice(0,14)}`); }
  return errs;
}
async function call(prompt) {
  const base = process.env.OPENAI_BASE_URL, key = process.env.OPENAI_API_KEY;
  if (!base || !key) throw new Error("set OPENAI_BASE_URL and OPENAI_API_KEY");
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.RN_MODEL || "gpt-4o", temperature: 0.8,
      messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }] }) });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}
const strip = (s) => s.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
const parse = (r) => { const c = r.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); try { return JSON.parse(c); } catch { return yaml.parse(c); } };

console.log(`window=${WINDOW}d max=${MAX} → ${inWindow.length} events to build:`, inWindow.map((e) => e.slug).join(", ") || "(none)");
if (!WRITE) { if (inWindow[0]) { console.log("\n[DRY first prompt USER]\n" + assemble(inWindow[0]).user.slice(0, 600)); } console.log("\ndry-run. add --write."); process.exit(0); }
let done = 0, failed = 0;
for (const e of inWindow) {
  let saved = false;
  for (let a = 1; a <= 2 && !saved; a++) {
    try {
      console.log(`GEN ${e.slug} (try ${a}) ...`);
      const page = parse(strip(await call(assemble(e)))); page.slug = e.slug;
      const errs = validate(page); if (errs.length) throw new Error(`validate: ${errs.join(", ")}`);
      fs.appendFileSync(pagesPath, "\n" + yaml.stringify([page]), "utf8"); existing.add(e.slug);
      console.log(`OK   ${e.slug}`); done++; saved = true;
    } catch (err) { console.error(`${a < 2 ? "RETRY" : "FAIL "} ${e.slug}: ${err.message}`); if (a === 2) failed++; }
  }
}
console.log(`\nevents done=${done} failed=${failed}`);
