#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const signs = yaml.parse(fs.readFileSync(path.join(__dir, "data", "sign-traits.yaml"), "utf8"));

const BASE_SCORE = 64;
const MIN_SCORE = 35;
const MAX_SCORE = 95;

const RULER_TONE = {
  Mars: "fire",
  Sun: "fire",
  Jupiter: "fire",
  Venus: "water",
  Moon: "water",
  Mercury: "air",
  Uranus: "air",
  Saturn: "earth",
  Neptune: "water",
  Pluto: "water",
};

const SUPPORTIVE_ELEMENT_PAIRS = new Set(["air+fire", "earth+water"]);
const TRANSLATION_ELEMENT_PAIRS = new Set(["fire+water", "air+earth"]);

function cap(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pairKey(a, b) {
  return [a, b].sort().join("+");
}

function addScores(scores, delta) {
  for (const [key, value] of Object.entries(delta)) scores[key] += value;
}

function clampScore(value) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

function getSign(sign) {
  const key = String(sign || "").toLowerCase();
  const data = signs[key];
  if (!data) throw new Error(`unknown sign: ${sign}`);
  return { key, ...data, keywords: Array.isArray(data.keywords) ? data.keywords : [] };
}

function applyElementScores(scores, elementA, elementB) {
  if (elementA === elementB) {
    addScores(scores, { love: 10, communication: 9, passion: 4, trust: 8, longterm: 5 });
    return;
  }

  const key = pairKey(elementA, elementB);
  if (key === "air+fire") {
    addScores(scores, { love: 8, communication: 7, passion: 9, trust: 3, longterm: 4 });
  } else if (key === "earth+water") {
    addScores(scores, { love: 8, communication: 5, passion: 4, trust: 9, longterm: 8 });
  } else if (TRANSLATION_ELEMENT_PAIRS.has(key)) {
    addScores(scores, { love: -2, communication: -9, passion: 4, trust: -8, longterm: -5 });
  } else {
    addScores(scores, { love: -1, communication: -3, passion: 2, trust: -2, longterm: -1 });
  }
}

function applyModalityScores(scores, modalityA, modalityB) {
  if (modalityA === modalityB) {
    addScores(scores, { communication: -6, passion: 2, trust: -3, longterm: -7 });
  } else {
    addScores(scores, { communication: 3, trust: 3, longterm: 6 });
  }
}

function applyRulerScores(scores, rulerA, rulerB) {
  if (rulerA === rulerB) {
    addScores(scores, { love: 1, communication: 2, trust: 2, longterm: 1 });
    return;
  }

  const toneA = RULER_TONE[rulerA];
  const toneB = RULER_TONE[rulerB];
  if (!toneA || !toneB) return;

  if (toneA === toneB) {
    addScores(scores, { love: 2, communication: 1, trust: 1 });
    return;
  }

  const key = pairKey(toneA, toneB);
  if (SUPPORTIVE_ELEMENT_PAIRS.has(key)) {
    addScores(scores, { love: 1, communication: 1, passion: 1, longterm: 1 });
  } else if (TRANSLATION_ELEMENT_PAIRS.has(key)) {
    addScores(scores, { communication: -2, passion: 2, trust: -2 });
  } else {
    addScores(scores, { passion: 1, communication: -1 });
  }
}

function elementBasis(elementA, elementB) {
  if (elementA === elementB) return `same-${elementA} fluency raises love, communication, and trust`;
  const key = pairKey(elementA, elementB);
  if (key === "air+fire") return "fire-air tends to turn ideas into momentum, lifting passion and communication";
  if (key === "earth+water") return "earth-water tends to hold feeling with stability, lifting trust and long-term pace";
  if (TRANSLATION_ELEMENT_PAIRS.has(key)) return `${elementA}-${elementB} needs translation, so communication and trust score lower while attraction can stay lively`;
  return `${elementA}-${elementB} is a mixed-element pairing, so the score stays moderate rather than automatic`;
}

function modalityBasis(modalityA, modalityB) {
  if (modalityA === modalityB) return `shared ${modalityA} modality can create standoffs, lowering communication and long-term ease`;
  return `${modalityA}-${modalityB} modalities add pacing contrast, which supports long-term adjustment`;
}

export function scoreCompatibility(signA, signB) {
  const A = getSign(signA);
  const B = getSign(signB);
  const scores = {
    love: BASE_SCORE,
    communication: BASE_SCORE,
    passion: BASE_SCORE,
    trust: BASE_SCORE,
    longterm: BASE_SCORE,
  };

  applyElementScores(scores, A.element, B.element);
  applyModalityScores(scores, A.modality, B.modality);
  applyRulerScores(scores, A.ruler, B.ruler);

  const finalScores = Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, clampScore(value)]),
  );

  return {
    scores: finalScores,
    basis: `How we score this: ${cap(A.key)} is ${A.element}/${A.modality} and ${cap(B.key)} is ${B.element}/${B.modality}; ${elementBasis(A.element, B.element)}, while ${modalityBasis(A.modality, B.modality)}.`,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [signA = "aries", signB = "leo"] = process.argv.slice(2);
  console.log(JSON.stringify(scoreCompatibility(signA, signB), null, 2));
}
