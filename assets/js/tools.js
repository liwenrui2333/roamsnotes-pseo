// RoamsNotes interactive tools. Client-side only, no tracking beyond the shared
// affiliate_click listener in analytics.html. Each tool renders a real, varied
// result (not a single canned string) and soft-places a matching reader link
// that routes through /go/<slug>/ (see data/affiliate/links.yaml).

/* ---------- shared helpers ---------- */

function trackEvent(name, params) {
  if (window.rnSendGaEvent) {
    window.rnSendGaEvent(name, params || {});
  } else if (typeof gtag === "function") {
    gtag("event", name, params || {});
  }
}

function softLink(slug, label, tool) {
  return `<a class="soft-cta" href="/go/fiverr-tarot/" data-affiliate data-cta="tool-result-cta" data-tool="${tool || "reader-tool"}" rel="sponsored nofollow noopener">Now find a reader on Fiverr &rarr;</a>`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Render a soft-placed reader link under a result container.
function appendSoftLink(container, link) {
  if (!link) return;
  const note = document.createElement("p");
  note.className = "result-soft";
  note.innerHTML = link;
  container.appendChild(note);
  const cta = note.querySelector("a[data-affiliate]");
  if (cta) {
    cta.addEventListener("click", () => {
      trackEvent("cta_click", {
        cta_label: cta.getAttribute("data-cta") || "tool-result-cta",
        tool: cta.getAttribute("data-tool") || "reader-tool",
        destination: cta.getAttribute("href")
      });
    });
  }
}

function setResult(id, mainText, link) {
  const element = document.getElementById(id);
  if (!element) return;
  const main = document.createElement("p");
  main.className = "result-main";
  main.textContent = mainText;
  element.replaceChildren(main);
  appendSoftLink(element, link);
}

/* ---------- 1. Tarot Question Generator (combinatorial) ---------- */

// Question = opener (carries the style) + focus phrase (carries the topic).
// Dozens of openers x focuses produce hundreds of well-formed, on-framework
// questions, so the tool actually generates rather than looking one up.
const QG = {
  openers: {
    clear: [
      "What should I understand about {f} before I decide my next step?",
      "What am I not seeing clearly about {f} right now?",
      "What should I weigh before I act on {f}?",
      "What is the most useful thing to focus on about {f} this month?",
      "What question am I really asking underneath {f}?"
    ],
    gentle: [
      "What can I gently reflect on when it comes to {f}?",
      "What would help me feel more grounded about {f}?",
      "What strength can I lean on as I navigate {f}?",
      "What do I most need to be patient with myself about regarding {f}?",
      "What small step would feel kind and honest around {f}?"
    ],
    boundary: [
      "What boundary would help me approach {f} with more clarity?",
      "What am I carrying for other people around {f} that I can set down?",
      "Where do I need a clearer limit when it comes to {f}?",
      "What expectation about {f} would be healthier to let go of?",
      "What am I tolerating around {f} that I shouldn't have to?"
    ]
  },
  focuses: {
    love: ["this relationship", "my part in this connection", "how I show up with a partner", "my next step in dating", "this situation with someone I care about"],
    career: ["this work decision", "my current role", "the choice between these directions", "a conflict at work", "my professional next step"],
    money: ["this financial decision", "my spending habits", "this money worry", "a commitment I'm considering"],
    decision: ["the choice I'm facing", "this decision", "the option I keep avoiding", "what's holding me back here"],
    timing: ["the timing of this decision", "when to make my move", "this stretch of waiting", "whether to act now or hold"],
    self: ["this pattern I keep repeating", "what I actually want right now", "how I've been feeling lately", "my growth this season"]
  },
  topicLink: {
    love: ["love-tarot", "Find a reader for this love question"],
    career: ["career-tarot", "Find a reader for this career question"],
    money: ["fiverr-tarot", "Find a reader for this money question"],
    decision: ["fiverr-tarot", "Find a reader for this decision"],
    timing: ["fiverr-astrology", "Find a reader for timing questions"],
    self: ["fiverr-tarot", "Find a reader for this reflection"]
  }
};

function buildQuestions(topic, style, context) {
  const openers = shuffle(QG.openers[style] || QG.openers.clear);
  let focuses = shuffle((QG.focuses[topic] || QG.focuses.self).slice());
  // If the user described their situation, lead with a question built on it.
  const cleaned = (context || "").trim().replace(/[.!?]+$/, "");
  if (cleaned) focuses = [cleaned, ...focuses];
  const out = [];
  const used = new Set();
  for (const opener of openers) {
    const f = focuses[out.length % focuses.length];
    const q = opener.replace("{f}", f);
    if (!used.has(q)) {
      used.add(q);
      out.push(q);
    }
    if (out.length === 3) break;
  }
  return out;
}

function renderQuestions(container, questions, link) {
  const intro = document.createElement("p");
  intro.className = "result-main";
  intro.textContent = "Three questions you could bring to a reading — pick the one that fits, then tweak the wording so it sounds like you:";
  container.replaceChildren(intro);

  const list = document.createElement("ol");
  list.className = "result-questions";
  questions.forEach((q) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = q;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-btn";
    copy.textContent = "Copy";
    copy.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(q).then(() => {
          copy.textContent = "Copied";
          setTimeout(() => (copy.textContent = "Copy"), 1500);
        });
      }
    });
    li.append(span, copy);
    list.appendChild(li);
  });
  container.appendChild(list);

  const hint = document.createElement("p");
  hint.className = "result-hint";
  hint.textContent = "Want different options? Press Generate again.";
  container.appendChild(hint);

  appendSoftLink(container, link);
}

function initQuestionGenerator() {
  const form = document.getElementById("question-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const style = form.elements.style.value;
    const context = form.elements.context ? form.elements.context.value : "";
    const container = document.getElementById("question-result");
    if (!container) return;
    const questions = buildQuestions(topic, style, context);
    const [slug, label] = QG.topicLink[topic] || QG.topicLink.self;
    renderQuestions(container, questions, softLink(slug, label, "tarot-question-generator"));
    trackEvent("tool_result", { tool: "tarot-question-generator", topic, style });
  });
}

/* ---------- 2. Reading Cost Calculator (priced model) ---------- */

// Base ranges by category x depth, derived from the price anchors used across
// the money pages. Format and speed add to the base. Output is a range, since
// real seller prices vary, plus what that band typically buys.
const CC = {
  base: {
    tarot:        { short: [5, 15],  standard: [15, 35], detailed: [40, 90] },
    natal:        { short: [15, 30], standard: [35, 70], detailed: [70, 120] },
    compatibility:{ short: [25, 45], standard: [45, 90], detailed: [90, 150] },
    yearly:       { short: [25, 45], standard: [45, 90], detailed: [90, 150] }
  },
  formatAdd: { text: 0, audio: 10, video: 20 },
  rushAdd: 20,
  buys: {
    tarot: {
      short: "a single-question or one-to-three-card reading, delivered fast",
      standard: "a multi-card written spread with a paragraph per position",
      detailed: "a long multi-card spread or recorded audio/video covering options and timing"
    },
    natal: {
      short: "a sun/moon/rising overview",
      standard: "a structured birth chart report tying the core placements into themes",
      detailed: "a detailed natal report, sometimes with current transits"
    },
    compatibility: {
      short: "a brief two-chart overview",
      standard: "a synastry report on how two charts interact",
      detailed: "an in-depth synastry or composite report with full data for both people"
    },
    yearly: {
      short: "a short seasonal overview",
      standard: "a themed year-ahead reading from transits or a solar return",
      detailed: "a month-by-month year-ahead report"
    }
  },
  slug: {
    tarot: ["fiverr-tarot", "Compare tarot readers in this range"],
    natal: ["birth-chart", "Compare birth chart readers in this range"],
    compatibility: ["compatibility-astrology", "Compare compatibility readers in this range"],
    yearly: ["fiverr-astrology", "Compare year-ahead readers in this range"]
  }
};

function initCostCalculator() {
  const form = document.getElementById("cost-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = form.elements.category ? form.elements.category.value : "natal";
    const depth = form.elements.depth.value;
    const format = form.elements.format ? form.elements.format.value : "text";
    const speed = form.elements.speed.value;
    const range = (CC.base[category] || CC.base.natal)[depth] || [20, 50];
    const add = (CC.formatAdd[format] || 0) + (speed === "fast" ? CC.rushAdd : 0);
    const low = range[0] + add;
    const high = range[1] + add;
    const buys = (CC.buys[category] || CC.buys.natal)[depth] || "a reading matched to your inputs";
    const [slug, label] = CC.slug[category] || CC.slug.natal;
    const speedNote = speed === "fast" ? " Rush delivery is included in this estimate." : "";
    setResult(
      "cost-result",
      `Budget anchor: $${low}-$${high}. At this level you can expect ${buys}.${speedNote} Treat it as a comparison range for browsing, not a fixed market price.`,
      softLink(slug, label, "astrology-reading-cost-calculator")
    );
    trackEvent("tool_result", { tool: "astrology-reading-cost-calculator", category, depth, format, speed });
  });
}

/* ---------- 3. Psychic Reader Matcher (priority-aware) ---------- */

function initReaderMatcher() {
  const form = document.getElementById("matcher-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const format = form.elements.format.value;
    const budget = Number(form.elements.budget.value || 0);
    const priority = form.elements.priority ? form.elements.priority.value : "record";

    const reader = topic === "astrology"
      ? "birth chart or astrology reader"
      : topic === "compatibility"
        ? "synastry or compatibility astrologer"
        : topic === "love"
          ? "tarot reader focused on relationship questions"
          : topic === "career"
            ? "tarot reader who handles work and decision questions"
            : "general tarot or intuitive reader";

    const budgetNote = budget < 20
      ? "At this budget, start with a short fixed-price package and avoid add-ons."
      : budget <= 45
        ? "This budget opens up multi-card spreads, structured reports, and audio."
        : "This budget suits detailed reports, two-person readings, or video delivery.";

    const priorityNote = {
      price: "Since cost matters most, sort by package price and pick the clearest scope you can afford.",
      depth: "Since depth matters most, favor sellers who describe their method and show a sample.",
      speed: "Since speed matters most, filter for 24-hour or rush delivery and confirm the turnaround.",
      record: "Since keeping a record matters most, prefer a written or PDF report you can revisit."
    }[priority] || "Prefer a format you will actually revisit.";

    // Route to the most relevant /go/ slug.
    let slug = "fiverr-tarot";
    let label = "See matching tarot readers";
    if (topic === "astrology") { slug = "birth-chart"; label = "See matching astrology readers"; }
    else if (topic === "compatibility") { slug = "compatibility-astrology"; label = "See matching compatibility readers"; }
    else if (priority === "record" || format === "written") { slug = "written-tarot"; label = "See written-report readers"; }
    else if (topic === "love") { slug = "love-tarot"; label = "See matching love tarot readers"; }
    else if (topic === "career") { slug = "career-tarot"; label = "See matching career tarot readers"; }

    setResult(
      "matcher-result",
      `Look for a ${reader} offering ${format} delivery. ${budgetNote} ${priorityNote}`,
      softLink(slug, label, "psychic-reader-matcher")
    );
    trackEvent("tool_result", { tool: "psychic-reader-matcher", topic, format, priority });
  });
}

initQuestionGenerator();
initReaderMatcher();
initCostCalculator();

/* ---------- Hero pull interaction (homepage) ---------- */

const HERO_CARDS = [
  { name: "The Star",          img: "/img/tarot/the-star.jpg",           hint: "Hope after difficulty. A sign to rest and trust the process." },
  { name: "Two of Cups",       img: "/img/tarot/two-of-cups.jpg",        hint: "A meaningful connection forms. Don't force — let it develop." },
  { name: "The High Priestess",img: "/img/tarot/the-high-priestess.jpg", hint: "Clarity comes from going inward, not from answers outside you." },
  { name: "Three of Swords",   img: "/img/tarot/three-of-swords.jpg",    hint: "Pain that's real. But naming it is the first step past it." },
  { name: "The Moon",          img: "/img/tarot/the-moon.jpg",           hint: "Uncertainty is the environment right now — not a verdict on the outcome." },
  { name: "Ace of Cups",       img: "/img/tarot/ace-of-cups.jpg",        hint: "Something is opening emotionally. Keep your expectations loose." },
  { name: "The Lovers",        img: "/img/tarot/the-lovers.jpg",         hint: "A real choice is involved — not just between people, but values." },
  { name: "Eight of Cups",     img: "/img/tarot/eight-of-cups.jpg",      hint: "You may already know you need to walk away. The question is when." },
  { name: "The Tower",         img: "/img/tarot/the-tower.jpg",          hint: "Something is breaking down so something better can replace it." },
  { name: "Wheel of Fortune",  img: "/img/tarot/wheel-of-fortune.jpg",   hint: "A cycle is turning. Timing is out of your control; positioning is not." },
  { name: "Six of Cups",       img: "/img/tarot/six-of-cups.jpg",        hint: "The past is asking for attention. Nostalgia and healing overlap." },
  { name: "The Magician",      img: "/img/tarot/the-magician.jpg",       hint: "You have more tools available than you're using right now." }
];

const HERO_POSITIONS = ["Past influence", "Present energy", "Likely direction"];

const HERO_NEXT = {
  love:    { guideHref: "/is-my-ex-coming-back-tarot/",     guideLabel: "Read the ex tarot guide",        fiverrSlug: "love-tarot" },
  career:  { guideHref: "/tools/tarot-question-generator/", guideLabel: "Shape a better career question", fiverrSlug: "fiverr-tarot" },
  default: { guideHref: "/tools/tarot-question-generator/", guideLabel: "Shape a clearer question",       fiverrSlug: "fiverr-tarot" }
};

function heroPickThree() {
  return shuffle(HERO_CARDS.slice()).slice(0, 3);
}

function heroDetectTopic(text) {
  const t = (text || "").toLowerCase();
  if (/\bex\b|come back|miss me|no contact|text.*ex|love|does he|will he|relationship/.test(t)) return "love";
  if (/\bjob\b|career|work|boss|salary|promotion/.test(t)) return "career";
  return "default";
}

function initHeroPull() {
  const panel         = document.getElementById("hero-pull-panel");
  const promptEl      = document.getElementById("pull-prompt");
  const btn           = document.getElementById("pull-btn");
  const resultEl      = document.getElementById("pull-result");
  const resultInner   = document.getElementById("pull-result-inner");
  const resultCtas    = document.getElementById("pull-result-ctas");
  const resultCardsEl = document.getElementById("pull-cards-result");
  const chips         = document.querySelectorAll(".rn-chip--panel");

  if (!panel || !btn) return;

  let activeTopic = "default";

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeTopic = chip.dataset.topic || "default";
    });
  });

  btn.addEventListener("click", doPull);

  function doPull() {
    const topic = activeTopic;
    const drawn = heroPickThree();
    const next  = HERO_NEXT[topic] || HERO_NEXT.default;

    // Inject real card images into result card slots, then flip
    const slots = resultCardsEl ? resultCardsEl.querySelectorAll(".rn-card-slot") : [];
    slots.forEach((slot, i) => {
      const front = slot.querySelector(".rn-card-front-face");
      if (front && drawn[i]) {
        front.innerHTML = `<img src="${drawn[i].img}" alt="${drawn[i].name}" loading="eager">`;
      }
      setTimeout(() => slot.classList.add("flipped"), i * 220);
    });

    // Build label row — position labels below result cards
    const labelsHTML = drawn.map((c, i) => `
      <div class="card-label" style="animation-delay:${i * 130 + 400}ms">
        <span class="card-pos">${HERO_POSITIONS[i]}</span>
        <span class="card-name">${c.name}</span>
        <span class="card-hint">${c.hint}</span>
      </div>`).join("");

    resultInner.innerHTML = `<div class="card-labels">${labelsHTML}</div>`;

    const fiverrHref = `/go/${next.fiverrSlug}/`;
    resultCtas.innerHTML = `
      <div class="result-cta-group">
        <a class="cta-secondary" href="${next.guideHref}">${next.guideLabel} &rarr;</a>
        <a class="cta-fiverr" href="${fiverrHref}" data-affiliate data-cta="hero-pull-result" rel="sponsored nofollow noopener">
          When you're ready: browse Fiverr readers &rarr;
        </a>
        <button class="rn-pull-reset" id="pull-reset-btn" type="button">Pull again</button>
      </div>`;

    const fiverrLink = resultCtas.querySelector("a[data-affiliate]");
    if (fiverrLink) {
      fiverrLink.addEventListener("click", () => {
        trackEvent("cta_click", { cta_label: "hero-pull-result", tool: "hero-pull", destination: fiverrLink.getAttribute("href") });
      });
    }

    const resetBtn = document.getElementById("pull-reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", doReset);

    if (promptEl) promptEl.hidden = true;
    if (resultEl) resultEl.hidden = false;

    trackEvent("tool_result", { tool: "hero-pull", topic, cards: drawn.map(c => c.name).join("|") });
  }

  function doReset() {
    if (promptEl) promptEl.hidden = false;
    if (resultEl) resultEl.hidden = true;
    activeTopic = "default";
    chips.forEach(c => c.classList.remove("active"));
    const slots = resultCardsEl ? resultCardsEl.querySelectorAll(".rn-card-slot") : [];
    slots.forEach(slot => {
      slot.classList.remove("flipped");
      const front = slot.querySelector(".rn-card-front-face");
      if (front) front.innerHTML = "";
    });
  }
}

initHeroPull();
