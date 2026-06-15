// Refreshes data/sky/today.yaml with today's moon phase (computed) and whether
// Mercury is retrograde (looked up from an authoritative, user-maintained table —
// we never fabricate astronomical dates). Rendered by partials/sky-today.html as a
// small "sky today" band: an astro-seek-style freshness + return-visit hook with a
// restrained, compliant soft link. Run daily via rn_daily.sh.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const outDir = path.join(root, "data", "sky");
fs.mkdirSync(outDir, { recursive: true });

const now = new Date();
const SYNODIC = 29.530588853; // mean synodic month (days)

// Julian date from a JS Date, then age since a known new moon (2000-01-06 18:14 UTC).
function moonAgeDays(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  let age = (jd - 2451550.1) % SYNODIC;
  if (age < 0) age += SYNODIC;
  return age;
}

function phaseFor(age) {
  // Illuminated fraction (0..1) and an 8-phase label.
  const illum = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2) * 100);
  const phases = [
    ["New Moon", "🌑"],
    ["Waxing Crescent", "🌒"],
    ["First Quarter", "🌓"],
    ["Waxing Gibbous", "🌔"],
    ["Full Moon", "🌕"],
    ["Waning Gibbous", "🌖"],
    ["Last Quarter", "🌗"],
    ["Waning Crescent", "🌘"]
  ];
  // Bin by age; quarters/new/full get a narrow band so labels feel right.
  const f = age / SYNODIC;
  let idx;
  if (f < 0.02 || f >= 0.98) idx = 0;
  else if (f < 0.23) idx = 1;
  else if (f < 0.27) idx = 2;
  else if (f < 0.48) idx = 3;
  else if (f < 0.52) idx = 4;
  else if (f < 0.73) idx = 5;
  else if (f < 0.77) idx = 6;
  else idx = 7;
  return { name: phases[idx][0], emoji: phases[idx][1], illumination: illum };
}

// Mercury retrograde: read authoritative windows from a user-maintained table.
function mercuryRetrograde(date) {
  const f = path.join(outDir, "mercury_retrograde.yaml");
  if (!fs.existsSync(f)) return { active: false, known: false };
  const windows = yaml.parse(fs.readFileSync(f, "utf8")) || [];
  const today = date.toISOString().slice(0, 10);
  for (const w of windows) {
    if (w && w.start && w.end && today >= String(w.start) && today <= String(w.end)) {
      return { active: true, known: true, until: String(w.end) };
    }
  }
  return { active: false, known: windows.length > 0 };
}

const moon = phaseFor(moonAgeDays(now));
const merc = mercuryRetrograde(now);

const out = {
  updated: now.toISOString().slice(0, 10),
  moon,
  mercury_retrograde: merc.active,
  mercury_retrograde_until: merc.until || null,
  mercury_known: merc.known
};

fs.writeFileSync(path.join(outDir, "today.yaml"), yaml.stringify(out), "utf8");
console.log(`sky updated: ${moon.emoji} ${moon.name} ${moon.illumination}% | mercury_rx=${merc.active}${merc.known ? "" : " (no table)"}`);
