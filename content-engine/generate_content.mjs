#!/usr/bin/env node
// RoamsNotes 内容引擎：数据 → 人格 → 稿。
// 干跑（默认）只组装并打印 prompt，不调 API、不写盘。--write 才花钱+落盘。
//
//   node content-engine/generate_content.mjs --wave wave1                 # 干跑全波
//   node content-engine/generate_content.mjs --wave wave1 --slug X --write
//   node content-engine/generate_content.mjs --wave wave1 --write          # 整波，跳过已存在
//
// env: OPENAI_BASE_URL, OPENAI_API_KEY, RN_MODEL(默认 gpt-4o)

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import { scoreCompatibility } from "./score_compatibility.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");
const DATE = new Date().toISOString().slice(0, 10);

// 自动加载 gitignored .env（无需依赖）：KEY=VALUE，已存在的 env 不覆盖。
for (const envPath of [path.join(root, ".env"), path.join(__dir, ".env")]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---------- args ----------
const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] || true) : d; };
const wave = flag("--wave", "wave1");
const onlySlug = flag("--slug", null);
const WRITE = args.includes("--write");
const PREVIEW = args.includes("--preview");
const FORCE = args.includes("--force");

// ---------- load assets ----------
const read = (p) => fs.readFileSync(path.join(__dir, p), "utf8");
const loadYaml = (p) => yaml.parse(read(p));

const VOICE = read("voice.md");
const SYSTEM = read("prompts/system.md");
const TEMPLATES = {
  emotional: read("prompts/type-emotional.md"),
  spread: read("prompts/type-spread.md"),
  compatibility: read("prompts/type-compatibility.md"),
  question: read("prompts/type-question.md"),
  explainer: read("prompts/type-explainer.md"),
};

const SKELETONS = {
  compatibility: [
    [
      "Compatibility scorecard",
      "Element chemistry between the two signs",
      "Modality friction and pacing",
      "How this pair works in daily life",
      "What a full chart reading would check",
    ],
    [
      "The fast answer for this pairing",
      "Where attraction starts",
      "Where translation is needed",
      "Habits that make the match easier",
      "Limits of a Sun-sign match",
    ],
    [
      "What the scores say",
      "The strongest shared pattern",
      "The pressure point to watch",
      "A repair script for this pairing",
      "Before you pay for synastry",
    ],
    [
      "First-date energy",
      "Communication over time",
      "Trust and conflict rhythm",
      "Long-term fit signals",
      "What the Sun signs cannot tell you",
    ],
    [
      "The headline compatibility read",
      "Why the elements matter here",
      "How the modalities change the outcome",
      "Practical boundaries for this pair",
      "A grounded next step",
    ],
  ],
  spread: [
    [
      "What this spread is for",
      "Set up the question",
      "Read each position in order",
      "Try these named variations",
      "The interpretation step most people skip",
      "When outside help is useful",
    ],
    [
      "The quickest way to use this spread",
      "Position-by-position meaning",
      "A worked example question",
      "Variations for different moods",
      "Common mistakes with this layout",
      "How to close the reading",
    ],
    [
      "Choose the right question",
      "Lay out the cards",
      "Turn positions into a story",
      "Named versions to test",
      "What not to force from the spread",
      "A reader's role",
    ],
    [
      "Best use case",
      "The position map",
      "A simple reading workflow",
      "Alternative layouts",
      "Troubleshooting unclear cards",
      "Next step after the spread",
    ],
    [
      "Before you pull the cards",
      "How each card position behaves",
      "Example: mapping a real question",
      "Useful spread variants",
      "The main misuse to avoid",
      "If you want a second opinion",
    ],
  ],
  emotional: [
    [
      "Start with the real worry",
      "Rewrite the question",
      "Reality check",
      "A small worked example",
      "What to do next",
      "When to ask someone else",
    ],
    [
      "Why this question feels urgent",
      "A healthier version of the question",
      "The red flag in this search",
      "Try the reflection spread",
      "How to keep agency",
      "A grounded next step",
    ],
    [
      "The short answer",
      "Move from prediction to reflection",
      "What this reading cannot decide",
      "Example: using the reframed question",
      "Boundaries for emotional readings",
      "If you still want a reading",
    ],
    [
      "Name the emotional pull",
      "Turn it into an answerable question",
      "Reality check before the cards",
      "A worked reflection path",
      "Avoiding fear-based sellers",
      "What help should look like",
    ],
    [
      "What you are really asking",
      "The better question to bring to tarot",
      "The risk to watch",
      "A practical mini-reading",
      "Keep the decision with you",
      "Where an outside reader can help",
    ],
  ],
};

function stableHash(input) {
  let hash = 2166136261;
  for (const char of String(input)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickSkeleton(slug, type) {
  const list = SKELETONS[type];
  if (!list) return "";
  return list[stableHash(`${type}:${slug}`) % list.length].map((heading) => `- ${heading}`).join("\n");
}
const reframeMap = loadYaml("data/reframe-map.yaml");
const signs = loadYaml("data/sign-traits.yaml");
const assets = loadYaml("data/assets.yaml");
const topics = loadYaml(`topics/${wave}.yaml`);

// Load sky data for explainer-type injections (retrograde windows, moon phase, etc.)
const skyDataPath = path.join(root, "data", "sky");
const mercuryRetro = fs.existsSync(path.join(skyDataPath, "mercury_retrograde.yaml"))
  ? yaml.parse(fs.readFileSync(path.join(skyDataPath, "mercury_retrograde.yaml"), "utf8"))
  : [];
const skyToday = fs.existsSync(path.join(skyDataPath, "today.yaml"))
  ? yaml.parse(fs.readFileSync(path.join(skyDataPath, "today.yaml"), "utf8"))
  : {};
function buildSkyData() {
  const lines = [];
  if (Array.isArray(mercuryRetro)) {
    for (const r of mercuryRetro) {
      if (r.start && r.end) {
        const sign = r.sign ? ` in ${r.sign}` : "";
        lines.push(`- Mercury retrograde${sign}: ${r.start} to ${r.end}`);
      }
    }
  }
  if (skyToday.moon) {
    lines.push(`- Current moon phase: ${skyToday.moon.name || "unknown"}`);
  }
  return lines.length ? lines.join("\n") : "(no sky data available today)";
}

const pagesPath = path.join(root, "data", "pseo", "pages.yaml");
const existingSlugs = new Set((yaml.parse(fs.readFileSync(pagesPath, "utf8")) || []).map((p) => p.slug));

// ---------- data assembly per type ----------
const ELEMENT_REL = (a, b) => {
  if (a === b) return `same element (${a}): naturally fluent, but can lack friction`;
  const fireAir = ["fire", "air"], earthWater = ["earth", "water"];
  const both = (set) => set.includes(a) && set.includes(b);
  if (both(fireAir)) return "fire + air: they ignite each other (energy feeds ideas)";
  if (both(earthWater)) return "earth + water: they nourish each other (stability holds feeling)";
  return `${a} + ${b}: a translation gap — they speak different emotional languages and must work to read each other`;
};
const MODALITY_REL = (a, b) =>
  a === b
    ? `same modality (${a}): prone to a standoff — both want to lead / hold / drift the same way`
    : `different modalities (${a} vs ${b}): usually complementary, one moves while the other anchors`;

function assemble(topic) {
  const t = TEMPLATES[topic.type];
  if (!t) throw new Error(`no template for type=${topic.type}`);
  const base = {
    "{{SLUG}}": topic.slug,
    "{{TARGET_KW}}": topic.target_kw,
    "{{TOOL_PATH}}": topic.tool_path,
    "{{MONEY_PATH}}": topic.money_path,
    "{{MONEY_CONTEXT}}": topic.money_context || "a grounded reader for outside perspective",
    "{{RELATED}}": JSON.stringify(topic.related),
    "{{DATE}}": DATE,
    "{{SKELETON}}": pickSkeleton(topic.slug, topic.type),
    "{{SKY_DATA}}": buildSkyData(),
  };
  // hero 配图：按类型映射到零成本资产（星座 SVG / 公共领域 RWS 牌）
  let hero = null, heroAlt = "";
  if (topic.type === "compatibility") {
    hero = `/img/zodiac/${topic.sign_a}-${topic.sign_b}.svg`;
    heroAlt = `Zodiac glyphs for ${cap(topic.sign_a)} and ${cap(topic.sign_b)}`;
  } else if (topic.type === "emotional") {
    const c = assets.emotional_cards[topic.reframe_key];
    if (c) { hero = `/img/tarot/${c}.jpg`; heroAlt = `${c.replace(/-/g, " ")} tarot card`; }
  } else if (topic.type === "spread") {
    const c = assets.spread_cards[topic.slug];
    if (c) { hero = `/img/tarot/${c}.jpg`; heroAlt = `${c.replace(/-/g, " ")} tarot card`; }
  } else if (topic.type === "question") {
    hero = "/img/tarot/the-lovers.jpg";
    heroAlt = "The Lovers tarot card";
  } else if (topic.type === "explainer") {
    hero = "/img/tarot/the-magician.jpg";
    heroAlt = "The Magician tarot card";
  }
  base["{{HERO_SRC}}"] = hero || "";
  base["{{HERO_ALT}}"] = heroAlt;

  let vars = { ...base };
  if (topic.type === "emotional") {
    const r = reframeMap[topic.reframe_key];
    if (!r) throw new Error(`reframe_key not found: ${topic.reframe_key}`);
    vars = { ...vars, "{{RAW_QUERY}}": topic.target_kw, "{{REFRAMED}}": r.reframed,
      "{{WHY}}": r.why, "{{RED_FLAG}}": r.red_flag, "{{SPREAD_HINT}}": r.spread_hint };
  } else if (topic.type === "spread") {
    const s = topic.spread_data;
    vars = { ...vars, "{{SPREAD_NAME}}": s.spread_name, "{{POSITIONS}}": s.positions,
      "{{BEST_FOR}}": s.best_for, "{{COMMON_MISTAKE}}": s.common_mistake };
  } else if (topic.type === "compatibility") {
    const A = signs[topic.sign_a], B = signs[topic.sign_b];
    const compatibility = scoreCompatibility(topic.sign_a, topic.sign_b);
    vars = { ...vars,
      "{{SIGN_A}}": cap(topic.sign_a), "{{A_ELEMENT}}": A.element, "{{A_MODALITY}}": A.modality, "{{A_RULER}}": A.ruler, "{{A_KEYWORDS}}": A.keywords.join(", "),
      "{{SIGN_B}}": cap(topic.sign_b), "{{B_ELEMENT}}": B.element, "{{B_MODALITY}}": B.modality, "{{B_RULER}}": B.ruler, "{{B_KEYWORDS}}": B.keywords.join(", "),
      "{{ELEMENT_RELATION}}": ELEMENT_REL(A.element, B.element),
      "{{MODALITY_RELATION}}": MODALITY_REL(A.modality, B.modality),
      "{{SCORE_LOVE}}": compatibility.scores.love,
      "{{SCORE_COMMUNICATION}}": compatibility.scores.communication,
      "{{SCORE_PASSION}}": compatibility.scores.passion,
      "{{SCORE_TRUST}}": compatibility.scores.trust,
      "{{SCORE_LONGTERM}}": compatibility.scores.longterm,
      "{{SCORE_BASIS}}": compatibility.basis };
  }
  let user = t;
  for (const [k, v] of Object.entries(vars)) user = user.split(k).join(String(v));
  return { system: `${VOICE}\n\n---\n\n${SYSTEM}`, user };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- local validation (mirror of quality_gate, pre-flight) ----------
// 与 scripts/quality_gate.js 的禁词表对齐：禁的是"承诺式短语"，不是警示语里出现的单词。
const BANNED = ["guaranteed result", "guaranteed love", "remove curse", "curse removal",
  "wealth leak", "medical advice", "legal advice", "financial certainty"];
function validate(page) {
  const errs = [];
  for (const k of ["slug", "title", "h1", "description", "intent", "audience", "primary_cta", "cta_url", "tldr", "sections", "faq", "related"])
    if (!page[k] || (Array.isArray(page[k]) && page[k].length === 0)) errs.push(`missing ${k}`);
  if (Array.isArray(page.sections) && page.sections.length < 5) errs.push("sections<5");
  if (Array.isArray(page.related) && page.related.length !== 3) errs.push("related!=3");
  const text = JSON.stringify(page).toLowerCase();
  if (/[^\x00-\x7F]/.test(text)) errs.push("non-ascii");
  for (const b of BANNED) if (text.includes(b)) errs.push(`banned:${b}`);
  if (!/\$\d|\d+\s*(day|days|card|cards|min|week|%)/i.test(text)) errs.push("no price/anchor");
  // 资产门禁：必须有 hero 或至少一节配图
  const hasImg = (page.hero && page.hero.src) || (Array.isArray(page.sections) && page.sections.some((s) => s.image && s.image.src));
  if (!hasImg) errs.push("no image (hero/section)");
  // 豆腐块门禁：每节正文必须有结构（列表/表格/多段），不能是一坨
  for (const s of page.sections || []) {
    const b = String(s.body || "");
    const structured = /\n\s*[-*\d]/.test(b) || b.includes("|") || /\n\s*\n/.test(b);
    if (b.length > 300 && !structured) errs.push(`tofu:${(s.heading || "?").slice(0, 20)}`);
  }
  return errs;
}

// ---------- API ----------
async function callModel({ system, user }) {
  const base = process.env.OPENAI_BASE_URL;
  const key = process.env.OPENAI_API_KEY;
  if (!base || !key) throw new Error("set OPENAI_BASE_URL and OPENAI_API_KEY");
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.RN_MODEL || "gpt-4o",
      temperature: 0.8,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices[0].message.content;
}
const stripFence = (s) => s.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
// 容错解析：先归一化智能引号(避免 YAML 解析报错)，JSON 优先，回退 YAML。
function parsePage(raw) {
  const cleaned = raw.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  try { return JSON.parse(cleaned); } catch (_) {}
  return yaml.parse(cleaned);
}

function renderReviewPage(page) {
  const lines = [];
  lines.push(`## ${page.slug}`);
  lines.push("");
  lines.push(`- type: ${page.type || ""}`);
  lines.push(`- category: ${page.category || ""}`);
  lines.push(`- title: ${page.title || ""}`);
  lines.push(`- h1: ${page.h1 || ""}`);
  lines.push(`- description: ${page.description || ""}`);
  lines.push(`- intent: ${page.intent || ""}`);
  lines.push(`- audience: ${page.audience || ""}`);
  lines.push(`- primary_cta: ${page.primary_cta || ""}`);
  lines.push(`- cta_url: ${page.cta_url || ""}`);
  lines.push(`- related: ${(page.related || []).join(", ")}`);
  lines.push("");
  lines.push("### TL;DR");
  lines.push("");
  lines.push(page.tldr || "");
  lines.push("");
  if (page.hero) {
    lines.push("### Hero");
    lines.push("");
    lines.push(`- src: ${page.hero.src || ""}`);
    lines.push(`- alt: ${page.hero.alt || ""}`);
    lines.push(`- caption: ${page.hero.caption || ""}`);
    lines.push("");
  }
  for (const section of page.sections || []) {
    lines.push(`### ${section.heading || "Section"}`);
    lines.push("");
    lines.push(String(section.body || "").trim());
    lines.push("");
  }
  lines.push("### FAQ");
  lines.push("");
  for (const item of page.faq || []) {
    lines.push(`#### ${item.q || ""}`);
    lines.push("");
    lines.push(item.a || "");
    lines.push("");
  }
  return lines.join("\n");
}

// ---------- run ----------
let queue = topics.filter((t) => !onlySlug || t.slug === onlySlug);
let done = 0, skipped = 0, failed = 0;
const previewPages = [];

for (const topic of queue) {
  if (existingSlugs.has(topic.slug) && !FORCE && !PREVIEW) { console.log(`SKIP ${topic.slug} (already in pages.yaml)`); skipped++; continue; }
  const prompt = assemble(topic);

  if (!WRITE && !PREVIEW) {
    console.log(`\n===== DRY ${topic.slug} (${topic.type}) =====`);
    console.log("[SYSTEM]\n" + prompt.system.slice(0, 400) + "\n...[truncated]\n");
    console.log("[USER]\n" + prompt.user);
    continue;
  }

  // 最多 2 次：解析或校验失败自动重试一次（模型偶发坏 YAML/缺结构）
  let saved = false;
  for (let attempt = 1; attempt <= 2 && !saved; attempt++) {
    try {
      console.log(`GEN ${topic.slug} (try ${attempt}) ...`);
      const raw = stripFence(await callModel(prompt));
      const page = parsePage(raw);
      page.slug = topic.slug; // enforce
      const errs = validate(page);
      if (errs.length) throw new Error(`validate: ${errs.join(", ")}`);
      if (PREVIEW) {
        previewPages.push(page);
        console.log(`OK   ${topic.slug} previewed`);
      } else {
        fs.appendFileSync(pagesPath, "\n" + yaml.stringify([page]), "utf8");
        existingSlugs.add(topic.slug);
        console.log(`OK   ${topic.slug} appended -> data/pseo/pages.yaml`);
      }
      done++; saved = true;
    } catch (e) {
      console.error(`${attempt < 2 ? "RETRY" : "FAIL "} ${topic.slug}: ${e.message}`);
      if (attempt === 2) failed++;
    }
  }
}

if (PREVIEW) {
  const reviewDir = path.join(__dir, "_review");
  fs.mkdirSync(reviewDir, { recursive: true });
  const reviewPath = path.join(reviewDir, `${wave}.md`);
  const body = [`# ${wave} preview`, "", `Generated: ${DATE}`, "", ...previewPages.map(renderReviewPage)].join("\n");
  fs.writeFileSync(reviewPath, body, "utf8");
  console.log(`preview written -> ${path.relative(root, reviewPath).replace(/\\/g, "/")}`);
  console.log("preview only. pages.yaml unchanged.");
}

if (failed > 0) process.exitCode = 1;

console.log(`\nwave=${wave} write=${WRITE} done=${done} skipped=${skipped} failed=${failed}`);
console.log(WRITE ? "next: npm run quality && npm run dev  (人工扫一眼) then bash deploy.sh" : "dry-run only. add --write to generate.");
