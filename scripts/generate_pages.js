import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "yaml";

const root = process.cwd();
const dataPath = path.join(root, "data", "pseo", "pages.yaml");
const outDir = path.join(root, "content");
const pages = yaml.parse(fs.readFileSync(dataPath, "utf8"));

for (const page of pages) {
  const dir = path.join(outDir, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "index.md");
  const content = [
    "---",
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    "---",
    "",
    "Generated from structured PSEO data. Edit data/pseo/pages.yaml, then rerun scripts/generate_pages.js.",
    ""
  ].join("\n");
  fs.writeFileSync(file, content, "utf8");
}

console.log(`generated=${pages.length}`);

// --- Affiliate redirect pages -> static/go/<slug>/index.html ---
const linksPath = path.join(root, "data", "affiliate", "links.yaml");
if (fs.existsSync(linksPath)) {
  const links = yaml.parse(fs.readFileSync(linksPath, "utf8")) || [];
  // Read Fiverr affiliate id from hugo.toml params (empty => fallback).
  let affId = "";
  try {
    const toml = fs.readFileSync(path.join(root, "hugo.toml"), "utf8");
    const m = toml.match(/fiverrAffiliateId\s*=\s*"([^"]*)"/);
    affId = m ? m[1].trim() : "";
  } catch (_) {}

  const goDir = path.join(root, "static", "go");
  fs.mkdirSync(goDir, { recursive: true });

  const deepLink = (target) => {
    if (!affId) {
      const u = new URL(target);
      u.searchParams.set("utm_source", "roamsnotes.com");
      u.searchParams.set("utm_medium", "affiliate");
      u.searchParams.set("utm_campaign", "go");
      return u.toString();
    }
    return `https://go.fiverr.com/visit/?bta=${encodeURIComponent(affId)}&brand=fiverrmarketplace&landingPage=${encodeURIComponent(target)}`;
  };

  for (const link of links) {
    // Prefer an individual gig (single-product) landingPage when set; fall back to
    // the query-matched search URL if no gig is assigned or a gig has gone dead.
    const dest = deepLink(link.gig || link.target);
    const dir = path.join(goDir, link.slug);
    fs.mkdirSync(dir, { recursive: true });
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer-when-downgrade">
<title>Redirecting to ${link.label}...</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:32rem;margin:18vh auto;padding:0 1.5rem;color:#1a1a1a;text-align:center}a{color:#2563eb}</style>
</head>
<body>
<p>Taking you to ${link.label}...</p>
<p>If nothing happens, <a href="${dest}" rel="sponsored noopener nofollow">continue &rarr;</a></p>
<script>setTimeout(function(){location.replace(${JSON.stringify(dest)});}, 250);</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  }
  console.log(`go_redirects=${links.length} affiliate_id=${affId ? "set" : "FALLBACK"}`);
}
