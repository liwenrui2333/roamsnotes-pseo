// RoamsNotes interactive tools. Client-side only, no tracking beyond the shared
// affiliate_click listener in analytics.html. Each tool renders a real, varied
// result (not a single canned string) and soft-places a matching reader link
// that routes through /go/<slug>/ (see data/affiliate/links.yaml).

/* ---------- shared helpers ---------- */

function softLink(slug, label) {
  return `<a class="soft-cta" href="/go/${slug}/" data-affiliate data-cta="${label}" rel="sponsored nofollow noopener">${label} &rarr;</a>`;
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
    renderQuestions(container, questions, softLink(slug, label));
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
      softLink(slug, label)
    );
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
      softLink(slug, label)
    );
  });
}

initQuestionGenerator();
initReaderMatcher();
initCostCalculator();
