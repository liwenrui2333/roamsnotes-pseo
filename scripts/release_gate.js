import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const output = path.join(root, "public");
const siteOrigin = "https://www.roamsnotes.com";
const coreRoutes = ["/", "/sitemap.xml", "/tools/", "/fiverr-tarot-reading/", "/is-my-ex-coming-back-tarot/"];
const ignoredHrefPrefixes = ["mailto:", "tel:", "javascript:", "data:", "#"];

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`FAIL ${message}`);
};

// 元数据缺失只警告不阻断：门禁该拦内容质量与死链，不该让一条 frontmatter 缺字段瘫痪整条发布链。
let warnings = 0;
const warn = (message) => {
  warnings += 1;
  console.warn(`WARN ${message}`);
};

if (!fs.existsSync(output)) {
  fail("public directory is missing; run npm run build first");
  process.exit(1);
}

const read = (file) => fs.readFileSync(file, "utf8");
const exists = (route) => fs.existsSync(routeToFile(route));

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function routeToFile(route) {
  const pathname = route.split(/[?#]/, 1)[0];
  const safePath = pathname.replace(/^\/+/, "");
  if (!safePath) return path.join(output, "index.html");
  if (path.extname(safePath)) return path.join(output, safePath);
  return path.join(output, safePath, "index.html");
}

function allHtmlFiles(dir) {
  const found = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) found.push(...allHtmlFiles(fullPath));
    else if (item.isFile() && item.name.endsWith(".html")) found.push(fullPath);
  }
  return found;
}

for (const route of coreRoutes) {
  if (!exists(route)) fail(`core route missing: ${route}`);
}

const robotsPath = path.join(output, "robots.txt");
if (!fs.existsSync(robotsPath)) {
  fail("robots.txt is missing");
} else {
  const robots = read(robotsPath);
  if (!/^Disallow:\s*\/go\/$/m.test(robots)) fail("robots.txt must contain Disallow: /go/");
}

if (!fs.existsSync(path.join(output, "llms.txt"))) {
  fail("llms.txt is missing");
}

const homePath = path.join(output, "index.html");
if (fs.existsSync(homePath)) {
  const home = read(homePath);
  const h1Count = (home.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) fail(`homepage h1 count=${h1Count}; expected 1`);
  for (const [source, alt] of [
    ["/img/icons/cards.svg", "Tarot cards"],
    ["/img/icons/heart.svg", "Heart"],
    ["/img/icons/receipt.svg", "Receipt"],
    ["/img/icons/user-search.svg", "Reader search"],
  ]) {
    const image = [...home.matchAll(/<img\b[^>]*>/gi)].find((tag) => attribute(tag[0], "src") === source);
    if (!image || !attribute(image[0], "alt").trim()) fail(`homepage icon missing non-empty alt: ${source}`);
  }
}

const htmlFiles = allHtmlFiles(output);
let noindexCount = 0;
let missingCanonical = 0;
let brokenInternalLinks = 0;
for (const file of htmlFiles) {
  const html = read(file);
  const relativeFile = path.relative(output, file).replaceAll("\\", "/");
  if (/\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html)) noindexCount += 1;
  const hasCanonical = [...html.matchAll(/<link\b[^>]*>/gi)].some((tag) => (
    attribute(tag[0], "rel").toLowerCase() === "canonical" && /^https?:\/\//i.test(attribute(tag[0], "href"))
  ));
  if (!relativeFile.startsWith("go/") && !hasCanonical) {
    missingCanonical += 1;
    fail(`missing canonical: /${relativeFile}`);
  }

  const hrefPattern = /\bhref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (const match of html.matchAll(hrefPattern)) {
    const href = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (!href.startsWith("/") || href.startsWith("//") || ignoredHrefPrefixes.some((prefix) => href.startsWith(prefix))) continue;
    const route = href.split(/[?#]/, 1)[0];
    if (!route || route === "/") continue;
    if (!exists(route)) {
      brokenInternalLinks += 1;
      fail(`broken internal link: /${relativeFile} -> ${href}`);
    }
  }
}

const sitemapPath = path.join(output, "sitemap.xml");
let sitemapCount = 0;
let sitemapNoindexCount = 0;
if (!fs.existsSync(sitemapPath)) {
  fail("sitemap.xml is missing");
} else {
  const sitemap = read(sitemapPath);
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
  sitemapCount = entries.length;
  for (const entry of entries) {
    const url = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!url) {
      fail("sitemap URL entry missing loc");
      continue;
    }
    if (!/<lastmod>[^<]+<\/lastmod>/.test(entry)) warn(`sitemap URL missing lastmod: ${url}`);
    if (/localhost/i.test(url)) {
      fail(`sitemap URL must not contain localhost: ${url}`);
      continue;
    }
    if (!url.startsWith(siteOrigin)) {
      fail(`sitemap URL has unexpected origin: ${url}`);
      continue;
    }
    const route = new URL(url).pathname;
    const file = routeToFile(route);
    if (!fs.existsSync(file)) {
      fail(`sitemap route missing from output: ${route}`);
      continue;
    }
    const page = read(file);
    if (/\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(page)) {
      sitemapNoindexCount += 1;
      fail(`noindex route present in sitemap: ${route}`);
    }
    const ogImage = [...page.matchAll(/<meta\b[^>]*>/gi)].some((tag) => (
      attribute(tag[0], "property").toLowerCase() === "og:image" && /^https?:\/\//i.test(attribute(tag[0], "content"))
    ));
    if (!ogImage) fail(`sitemap route missing absolute og:image: ${route}`);
  }
}

const goDir = path.join(output, "go");
const goRoutes = fs.existsSync(goDir) ? fs.readdirSync(goDir, { withFileTypes: true }).filter((item) => item.isDirectory()) : [];
for (const item of goRoutes) {
  const route = `/go/${item.name}/`;
  if (!exists(route)) fail(`go route missing: ${route}`);
}

console.log(`release_gate=finished html=${htmlFiles.length} sitemap=${sitemapCount} noindex=${noindexCount} sitemap_noindex=${sitemapNoindexCount} go_routes=${goRoutes.length} broken_internal_links=${brokenInternalLinks} missing_canonical=${missingCanonical} warnings=${warnings}`);
if (failures) process.exit(1);
console.log("release_gate=passed");
