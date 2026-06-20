#!/usr/bin/env node
// RoamsNotes 日更天象文：data/sky/today.yaml(真实月相/水逆) → 人格 → 单页 /todays-sky/。
// update-in-place：每天重写 pages.yaml 里 slug=todays-sky 的那一条（不堆页）。
//   node content-engine/generate_sky_article.mjs           # 干跑(不调API/不写盘)
//   node content-engine/generate_sky_article.mjs --write   # 生成+落盘
// env: OPENAI_BASE_URL, OPENAI_API_KEY, RN_MODEL

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");
const DATE = new Date().toISOString().slice(0, 10);
const WRITE = process.argv.includes("--write");

// load gitignored .env (don't override existing env)
for (const envPath of [path.join(root, ".env"), path.join(__dir, ".env")]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const read = (p) => fs.readFileSync(path.join(__dir, p), "utf8");
const VOICE = read("voice.md");
const SYSTEM = read("prompts/system.md");
const TPL = read("prompts/type-sky.md");
const sky = yaml.parse(fs.readFileSync(path.join(root, "data", "sky", "today.yaml"), "utf8")) || {};

// ---- derive real, computable facts only ----
const SUN = [ // [endDay, sign, season(N hemisphere)]
  [[1,19],"Capricorn","winter"],[[2,18],"Aquarius","winter"],[[3,20],"Pisces","late winter"],
  [[4,19],"Aries","spring"],[[5,20],"Taurus","spring"],[[6,20],"Gemini","late spring"],
  [[7,22],"Cancer","summer"],[[8,22],"Leo","summer"],[[9,22],"Virgo","late summer"],
  [[10,22],"Libra","autumn"],[[11,21],"Scorpio","autumn"],[[12,21],"Sagittarius","late autumn"],
];
function sunSign(d) {
  const mo = d.getMonth() + 1, day = d.getDate();
  for (const [[em, ed], sign, season] of SUN) if (mo < em || (mo === em && day <= ed)) return { sign, season };
  return { sign: "Capricorn", season: "winter" }; // late Dec wraps
}
// phase meaning = reflection rhythm only (never prediction)
const PHASE_MEANING = {
  "New Moon": "a quiet reset — good for naming an intention, not for big launches",
  "Waxing Crescent": "early momentum — small first steps and gentle commitment",
  "First Quarter": "a decision point — push through friction or adjust the plan",
  "Waxing Gibbous": "refinement — tighten what you started, edit, prepare",
  "Full Moon": "peak visibility — see clearly, complete, and notice what surfaces emotionally",
  "Waning Gibbous": "share and digest — gratitude, teaching, giving back what you learned",
  "Last Quarter": "release — let go of what no longer fits, forgive, clear space",
  "Waning Crescent": "rest and surrender — low-energy reflection before the next cycle",
};
const moon = sky.moon || { name: "Waning Crescent", emoji: "🌘", illumination: 0 };
const { sign: sunSignName, season } = sunSign(new Date());
const mercRx = sky.mercury_retrograde
  ? `RETROGRADE${sky.mercury_retrograde_until ? ` (until ${sky.mercury_retrograde_until})` : ""}`
  : "direct (not retrograde)";

const HERO_SRC = "/img/tarot/the-star.jpg";
const RELATED = ["/tools/tarot-question-generator/", "/tools/astrology-reading-cost-calculator/", "/birth-chart-reading-on-fiverr/"];
const vars = {
  "{{DATE}}": DATE,
  "{{MOON_NAME}}": moon.name, "{{MOON_EMOJI}}": moon.emoji || "", "{{MOON_ILLUM}}": String(moon.illumination ?? 0),
  "{{SUN_SIGN}}": sunSignName, "{{SUN_SEASON}}": season,
  "{{MERCURY_RX}}": mercRx,
  "{{PHASE_MEANING}}": PHASE_MEANING[moon.name] || "a reflective beat in the lunar cycle",
  "{{TOOL_PATH}}": "/tools/tarot-question-generator/",
  "{{RELATED}}": JSON.stringify(RELATED),
  "{{HERO_SRC}}": HERO_SRC,
  "{{HERO_ALT}}": `The Star tarot card, evoking tonight's ${moon.name.toLowerCase()} moon`,
};
let user = TPL;
for (const [k, v] of Object.entries(vars)) user = user.split(k).join(String(v));
const system = `${VOICE}\n\n---\n\n${SYSTEM}`;

// ---- validation mirror (subset of quality_gate) ----
function validate(p) {
  const errs = [];
  for (const k of ["slug","title","h1","description","intent","audience","primary_cta","cta_url","tldr","sections","faq","related","budget","delivery","last_updated"])
    if (!p[k] || (Array.isArray(p[k]) && p[k].length === 0)) errs.push(`missing ${k}`);
  if (Array.isArray(p.sections) && p.sections.length < 5) errs.push("sections<5");
  if (Array.isArray(p.related) && p.related.length !== 3) errs.push("related!=3");
  if (!(p.hero && p.hero.src)) errs.push("no hero");
  const text = JSON.stringify(p).toLowerCase();
  if (!/\$\d|\d+\s*(day|days|card|cards|min|week|%)/i.test(text)) errs.push("no anchor");
  for (const s of p.sections || []) {
    const b = String(s.body || "");
    if (b.length > 300 && !(/\n\s*[-*\d]/.test(b) || b.includes("|") || /\n\s*\n/.test(b))) errs.push(`tofu:${(s.heading||"?").slice(0,16)}`);
  }
  return errs;
}

async function callModel() {
  const base = process.env.OPENAI_BASE_URL, key = process.env.OPENAI_API_KEY;
  if (!base || !key) throw new Error("set OPENAI_BASE_URL and OPENAI_API_KEY");
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.RN_MODEL || "gpt-4o", temperature: 0.8,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}
const stripFence = (s) => s.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
const parsePage = (raw) => { const c = raw.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); try { return JSON.parse(c); } catch (_) { return yaml.parse(c); } };

console.log(`sky facts: ${moon.emoji} ${moon.name} ${moon.illumination}% | sun=${sunSignName}(${season}) | mercury=${mercRx}`);
if (!WRITE) { console.log("\n[USER PROMPT]\n" + user); console.log("\ndry-run only. add --write to generate."); process.exit(0); }

const pagesPath = path.join(root, "data", "pseo", "pages.yaml");
let saved = false;
for (let attempt = 1; attempt <= 2 && !saved; attempt++) {
  try {
    console.log(`GEN todays-sky (try ${attempt}) ...`);
    const page = parsePage(stripFence(await callModel()));
    page.slug = "todays-sky";
    const errs = validate(page);
    if (errs.length) throw new Error(`validate: ${errs.join(", ")}`);
    // update-in-place: drop old todays-sky, append fresh
    const all = (yaml.parse(fs.readFileSync(pagesPath, "utf8")) || []).filter((p) => p.slug !== "todays-sky");
    all.push(page);
    fs.writeFileSync(pagesPath, yaml.stringify(all), "utf8");
    console.log(`OK   todays-sky written (pages.yaml now ${all.length} pages)`);
    saved = true;
  } catch (e) {
    console.error(`${attempt < 2 ? "RETRY" : "FAIL "} todays-sky: ${e.message}`);
    if (attempt === 2) process.exit(1);
  }
}
