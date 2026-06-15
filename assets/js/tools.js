const questions = {
  love: {
    clear: "What pattern should I understand before making my next relationship decision?",
    gentle: "What can I reflect on to communicate more clearly in this connection?",
    boundary: "What boundary would help me approach this relationship with more clarity?"
  },
  career: {
    clear: "What should I consider before choosing my next career step?",
    gentle: "What strength can I lean on while navigating this work situation?",
    boundary: "Where do I need better boundaries or expectations at work?"
  },
  money: {
    clear: "What habit should I review before making a money decision?",
    gentle: "What can help me feel more grounded around this financial question?",
    boundary: "What risk should I avoid before spending or committing?"
  },
  self: {
    clear: "What am I not seeing clearly about this situation?",
    gentle: "What would support my self-reflection this week?",
    boundary: "What do I need to stop carrying for other people?"
  }
};

// Map a tool result to the matching Fiverr search redirect (see data/affiliate/links.yaml).
function softLink(slug, label) {
  return `<a class="soft-cta" href="/go/${slug}/" data-affiliate data-cta="${label}" rel="sponsored nofollow noopener">${label} &rarr;</a>`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

// Renders a primary result line plus an optional soft-placed reader link underneath.
function setResult(id, mainText, link) {
  const element = document.getElementById(id);
  if (!element) return;
  const main = document.createElement("p");
  main.className = "result-main";
  main.textContent = mainText;
  element.replaceChildren(main);
  if (link) {
    const note = document.createElement("p");
    note.className = "result-soft";
    note.innerHTML = link;
    element.appendChild(note);
  }
}

function initQuestionGenerator() {
  const form = document.getElementById("question-tool");
  if (!form) return;
  const topicToReader = {
    love: ["love-tarot", "Find a reader for this love question"],
    career: ["career-tarot", "Find a reader for this career question"],
    money: ["fiverr-tarot", "Find a reader for this question"],
    self: ["fiverr-tarot", "Find a reader for this reflection"]
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const style = form.elements.style.value;
    const [slug, label] = topicToReader[topic] || topicToReader.self;
    setResult("question-result", questions[topic][style], softLink(slug, label));
  });
}

function initReaderMatcher() {
  const form = document.getElementById("matcher-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const format = form.elements.format.value;
    const budget = Number(form.elements.budget.value || 0);
    const reader = topic === "astrology"
      ? "birth chart or astrology reader"
      : topic === "love"
        ? "tarot reader focused on relationship questions"
        : "general tarot or intuitive reader";
    const budgetNote = budget < 20
      ? "Start with a short fixed-price package and avoid add-ons."
      : "Compare mid-range packages with clear samples and recent reviews.";
    // Match topic + delivery to the most relevant search.
    let slug;
    let label;
    if (topic === "astrology") {
      slug = "birth-chart";
      label = "See matching astrology readers";
    } else if (format === "written") {
      slug = "written-tarot";
      label = "See written-report tarot readers";
    } else if (topic === "love") {
      slug = "love-tarot";
      label = "See matching love tarot readers";
    } else {
      slug = "fiverr-tarot";
      label = "See matching tarot readers";
    }
    setResult("matcher-result", `Look for a ${reader}. Prefer ${format} delivery. ${budgetNote}`, softLink(slug, label));
  });
}

function initCostCalculator() {
  const form = document.getElementById("cost-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const depth = form.elements.depth.value;
    const speed = form.elements.speed.value;
    const base = depth === "short" ? 15 : depth === "standard" ? 45 : 85;
    const rush = speed === "fast" ? 15 : 0;
    const slug = depth === "deep" ? "compatibility-astrology" : "birth-chart";
    const label = `Compare astrology readers near $${base + rush}`;
    setResult("cost-result", `Estimated budget: $${base + rush}. Use this as a comparison anchor, not a guaranteed market price.`, softLink(slug, label));
  });
}

initQuestionGenerator();
initReaderMatcher();
initCostCalculator();
