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

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function initQuestionGenerator() {
  const form = document.getElementById("question-tool");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = form.elements.topic.value;
    const style = form.elements.style.value;
    setText("question-result", questions[topic][style]);
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
    setText("matcher-result", `Look for a ${reader}. Prefer ${format} delivery. ${budgetNote}`);
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
    setText("cost-result", `Estimated budget: $${base + rush}. Use this as a comparison anchor, not a guaranteed market price.`);
  });
}

initQuestionGenerator();
initReaderMatcher();
initCostCalculator();
