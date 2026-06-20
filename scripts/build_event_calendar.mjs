#!/usr/bin/env node
// 计算指定年份的新月/满月日期（synodic 算法，与 update_sky.js 同源，无依赖、可验证、非臆造），
// 写入 content-engine/topics/event_calendar.yaml 的 moons 段。
// retrogrades / eclipses 段是【用户维护的权威表】——脚本不计算、不臆造，留空带说明。
//   node scripts/build_event_calendar.mjs [year]   # 默认次年起跨 14 个月
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const calPath = path.resolve(__dir, "..", "content-engine", "topics", "event_calendar.yaml");
const SYNODIC = 29.530588853;
const KNOWN_NEW = Date.UTC(2000, 0, 6, 18, 14) / 86400000; // 2000-01-06 18:14 UTC, in days
const ageDays = (d) => { const a = ((d.getTime() / 86400000 - KNOWN_NEW) % SYNODIC + SYNODIC) % SYNODIC; return a; };
const iso = (d) => d.toISOString().slice(0, 10);
const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// 扫描区间：今天起 14 个月，覆盖"提前卡位"窗口
const start = new Date(); start.setHours(12, 0, 0, 0);
const days = 430;
const moons = [];
let prev = ageDays(start);
for (let i = 1; i <= days; i++) {
  const d = new Date(start.getTime() + i * 86400000);
  const a = ageDays(d);
  // 新月：age 回绕（从~29 跳回~0）
  if (prev > a && prev > SYNODIC - 3) moons.push({ kind: "new-moon", date: iso(d), month: MONTH[d.getUTCMonth()], year: d.getUTCFullYear() });
  // 满月：age 跨越 14.765
  if ((prev - 14.765) <= 0 && (a - 14.765) > 0) moons.push({ kind: "full-moon", date: iso(d), month: MONTH[d.getUTCMonth()], year: d.getUTCFullYear() });
  prev = a;
}
// 为每个事件预生成 slug + target_kw（与 trend_harvest 的事件词对齐）
for (const m of moons) {
  const label = m.kind === "full-moon" ? "full moon" : "new moon";
  m.slug = `${label.replace(" ", "-")}-${m.month.toLowerCase()}-${m.year}`;
  m.target_kw = `${label} ${m.month.toLowerCase()} ${m.year}`;
  m.event_name = `${m.month} ${m.year} ${m.kind === "full-moon" ? "Full" : "New"} Moon`;
}

const existing = fs.existsSync(calPath) ? yaml.parse(fs.readFileSync(calPath, "utf8")) || {} : {};
const out = {
  generated: iso(new Date()),
  note: "moons 段由 scripts/build_event_calendar.mjs 用 synodic 算法计算（±1天，可验证、非臆造）。retrogrades/eclipses 段必须人工从权威星历(timeanddate/astro.com)填入，脚本绝不计算或猜测——错误日期会毁掉页面可信度。",
  moons,
  // 保留已有人工维护表；首次运行给空模板 + 说明
  retrogrades: existing.retrogrades || [
    { planet: "mercury", start: "", end: "", note: "★从权威源填入 ISO 日期后才会被事件页引用；空=不生成" },
  ],
  eclipses: existing.eclipses || [
    { kind: "solar|lunar", date: "", saros: "", note: "★人工权威填入；空=跳过" },
  ],
};
fs.writeFileSync(calPath, yaml.stringify(out), "utf8");
const full = moons.filter((m) => m.kind === "full-moon").length, nw = moons.length - full;
console.log(`event_calendar.yaml written: ${full} full moons + ${nw} new moons over ${days}d (computed).`);
console.log("next 6 events:", moons.slice(0, 6).map((m) => `${m.date} ${m.kind}`).join(" | "));
console.log("retrogrades/eclipses: 空模板，待人工填权威日期（脚本不臆造）。");
