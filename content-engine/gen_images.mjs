#!/usr/bin/env node
// RoamsNotes image pipeline: pages.yaml -> ComfyUI FLUX schnell -> static/img/gen/<slug>/.
// Dry-run by default prints workflow JSON only. --write calls ComfyUI and writes images.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] || true) : fallback;
};

const slug = flag("--slug", null);
const WRITE = args.includes("--write");
const COMFY = String(flag("--comfy", "http://127.0.0.1:8188")).replace(/\/$/, "");
const MODEL = "flux1-schnell-fp8.safetensors";
const CLIENT_ID = `rn-images-${Date.now()}`;
const STYLE = fs.readFileSync(path.join(__dir, "style-image.md"), "utf8");
const pages = yaml.parse(fs.readFileSync(path.join(root, "data/pseo/pages.yaml"), "utf8"));

if (!slug) {
  console.error("Missing --slug. Example: node content-engine/gen_images.mjs --slug fiverr-tarot-reading --write");
  process.exit(1);
}

const page = pages.find((p) => p.slug === slug);
if (!page) {
  console.error(`Slug not found in data/pseo/pages.yaml: ${slug}`);
  process.exit(1);
}

const positivePrefix = matchBlock(STYLE, "POSITIVE Prefix");
const negative = matchBlock(STYLE, "NEGATIVE");
const outputDir = path.join(root, "static/img/gen", slug);

const jobs = [
  {
    id: "hero",
    width: 1024,
    height: 768,
    brief: heroBrief(page),
    out: path.join(outputDir, "hero.png"),
  },
  ...(page.sections || []).map((section, i) => ({
    id: `s${i + 1}`,
    width: 768,
    height: 768,
    brief: sectionBrief(page, section),
    out: path.join(outputDir, `s${i + 1}.png`),
  })),
];

if (!WRITE) {
  const preview = Object.fromEntries(jobs.map((job) => [job.id, buildWorkflow(job)]));
  console.log(JSON.stringify({ slug, mode: "dry-run", jobs: jobs.length, workflow: preview }, null, 2));
  process.exit(0);
}

await assertComfy();
fs.mkdirSync(outputDir, { recursive: true });

const written = [];
for (const job of jobs) {
  const workflow = buildWorkflow(job);
  const promptId = await queuePrompt(workflow);
  const output = await waitForImage(promptId);
  const png = await fetchImage(output);
  fs.writeFileSync(job.out, Buffer.from(png));

  let finalPath = job.out;
  const converted = await tryWebp(job.out);
  if (converted) finalPath = converted;

  const dims = await imageDimensions(finalPath);
  written.push({ id: job.id, path: rel(finalPath), width: dims.width, height: dims.height });
  console.log(`${job.id}: ${rel(finalPath)} ${dims.width}x${dims.height}`);
}

console.log(JSON.stringify({ slug, count: written.length, files: written }, null, 2));

function matchBlock(markdown, heading) {
  const re = new RegExp(`## ${escapeRegex(heading)}\\s+([\\s\\S]*?)(?=\\n## |$)`);
  const m = markdown.match(re);
  if (!m) throw new Error(`Missing style block: ${heading}`);
  return m[1].replace(/^[-*]\s*/gm, "").trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function heroBrief(p) {
  return [
    `Create a calm hero illustration for an editorial guide titled "${p.h1 || p.title}".`,
    `Show symbolic tarot cards, moon phases, quiet astrology chart lines, and a safe fixed-price reading mood.`,
    `No readable letters, no UI, no human faces, no logos.`,
  ].join(" ");
}

function sectionBrief(p, section) {
  const heading = section?.heading || "guide section";
  const category = p.category || "tarot and astrology";
  return [
    `Create a square editorial illustration for the section "${heading}" in a ${category} buyer guide.`,
    `Use one clear visual metaphor from tarot cards, moonlight, constellations, candles, paper notes, or protective boundaries.`,
    `No readable letters, no UI, no human faces, no logos.`,
  ].join(" ");
}

function promptFor(job) {
  return `${positivePrefix}, ${job.brief}`;
}

function buildWorkflow(job) {
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: MODEL },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["1", 1], text: promptFor(job) },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["1", 1], text: negative },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: { width: job.width, height: job.height, batch_size: 1 },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
        seed: randomSeed(),
        steps: 4,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1.0,
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { images: ["6", 0], filename_prefix: `rn_${slug}_${job.id}` },
    },
  };
}

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

async function assertComfy() {
  const res = await fetch(`${COMFY}/system_stats`);
  if (!res.ok) throw new Error(`ComfyUI not responding: GET /system_stats -> ${res.status}`);
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, prompt: workflow }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ComfyUI queue failed: ${res.status} ${text}`);
  const data = JSON.parse(text);
  if (!data.prompt_id) throw new Error(`ComfyUI response missing prompt_id: ${text}`);
  return data.prompt_id;
}

async function waitForImage(promptId) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const res = await fetch(`${COMFY}/history/${promptId}`);
    if (!res.ok) throw new Error(`ComfyUI history failed: ${res.status}`);
    const data = await res.json();
    const record = data[promptId];
    const images = record?.outputs?.["7"]?.images;
    if (images?.length) return images[0];
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ComfyUI prompt: ${promptId}`);
}

async function fetchImage(image) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || "",
    type: image.type || "output",
  });
  const res = await fetch(`${COMFY}/view?${params.toString()}`);
  if (!res.ok) throw new Error(`ComfyUI image download failed: ${res.status}`);
  return res.arrayBuffer();
}

async function tryWebp(pngPath) {
  try {
    const sharp = (await import("sharp")).default;
    const out = pngPath.replace(/\.png$/i, ".webp");
    await sharp(pngPath).webp({ quality: 86 }).toFile(out);
    fs.unlinkSync(pngPath);
    return out;
  } catch {
    return null;
  }
}

async function imageDimensions(filePath) {
  if (/\.png$/i.test(filePath)) return pngDimensions(filePath);
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(filePath).metadata();
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

function pngDimensions(filePath) {
  const b = fs.readFileSync(filePath);
  if (b.toString("ascii", 1, 4) !== "PNG") return { width: 0, height: 0 };
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rel(p) {
  return path.relative(root, p).replace(/\\/g, "/");
}
