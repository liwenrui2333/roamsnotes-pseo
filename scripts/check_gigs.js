import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import https from "node:https";
import yaml from "yaml";

// Monthly gig liveness check for data/affiliate/links.yaml `gig:` targets.
//
// HARD LIMIT: Fiverr fronts every gig with anti-bot (Cloudflare/PerimeterX) that
// returns 403 to any non-browser client. So a script CANNOT distinguish "gig was
// removed" (really 404/410) from "bot blocked" (403) with certainty. This tool is
// therefore a TRIAGE aid, not an oracle:
//   200          -> OK (rare; Fiverr usually blocks)
//   404 / 410    -> DEAD  (gig gone -> delete the `gig:` line, build reverts to search)
//   403 / 429    -> BLOCKED (inconclusive -> open the URL in a real browser to confirm)
//   30x          -> MOVED (Fiverr redirected -> manual check, gig may be renamed)
//   other / err  -> REVIEW
// Run: node scripts/check_gigs.js     (exit 1 if any DEAD found)

const root = process.cwd();
const links = yaml.parse(
  fs.readFileSync(path.join(root, "data", "affiliate", "links.yaml"), "utf8")
) || [];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function head(url) {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      { method: "GET", headers: { "User-Agent": UA, Accept: "text/html" }, timeout: 20000 },
      (res) => {
        res.resume(); // drain
        resolve(res.statusCode || 0);
      }
    );
    req.on("timeout", () => { req.destroy(); resolve(-1); });
    req.on("error", () => resolve(0));
    req.end();
  });
}

function classify(code) {
  if (code === 200) return ["OK", false];
  if (code === 404 || code === 410) return ["DEAD", true];
  if (code === 403 || code === 429) return ["BLOCKED", false];
  if (code >= 300 && code < 400) return ["MOVED", false];
  if (code === -1) return ["TIMEOUT", false];
  return ["REVIEW", false];
}

const gigs = links.filter((l) => l.gig);
console.log(`# RN gig check — ${new Date().toISOString().slice(0, 10)} — ${gigs.length} gigs\n`);

let dead = 0;
const blocked = [];
for (const l of gigs) {
  const code = await head(l.gig);
  const [verdict, isDead] = classify(code);
  if (isDead) dead++;
  if (verdict === "BLOCKED" || verdict === "MOVED" || verdict === "TIMEOUT") blocked.push(l.slug);
  console.log(`${verdict.padEnd(8)} | HTTP ${String(code).padStart(3)} | ${l.slug.padEnd(24)} | ${l.gig}`);
}

console.log(`\nDEAD: ${dead}  (delete the gig: line -> build falls back to search)`);
if (blocked.length)
  console.log(
    `MANUAL CHECK (403/redirect/timeout = inconclusive, open in browser): ${blocked.join(", ")}`
  );
process.exit(dead > 0 ? 1 : 0);
