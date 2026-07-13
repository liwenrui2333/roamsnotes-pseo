(function () {
  "use strict";
  var root = document.querySelector("[data-tarot-tool]");
  if (!root || !window.RN_TAROT_MAJOR) return;

  var deck = window.RN_TAROT_MAJOR;
  var spread = root.querySelector("#tarot-spread");
  var status = root.querySelector("#tarot-status");
  var hint = root.querySelector("#tarot-hint");
  var results = root.querySelector("#tarot-results");
  var shuffleButton = root.querySelector("#tarot-shuffle");
  var resetButton = root.querySelector("#tarot-reset");
  var resultActions = root.querySelector("#tarot-result-actions");
  var copyButton = root.querySelector("#tarot-copy");
  var modeInputs = root.querySelectorAll('input[name="tarot-spread"]');
  var questionInput = root.querySelector("#tarot-question");
  var questionChips = root.querySelectorAll("[data-question]");
  var state = "idle";
  var drawn = [];
  var revealed = 0;
  var started = false;
  var positions = ["Past", "Present", "Next Step"];

  function mode() { var checked = root.querySelector('input[name="tarot-spread"]:checked'); return checked ? checked.value : "one_card"; }
  function payload(extra) { var p = { tool_name: "free_love_tarot", spread_type: mode(), card_count: drawn.length, source_page: "homepage" }; return Object.assign(p, extra || {}); }
  function track(name, extra) { if (typeof window.rnSendGaEvent === "function") window.rnSendGaEvent(name, payload(extra)); else if (typeof window.gtag === "function") window.gtag("event", name, payload(extra)); }
  function start() { if (!started) { started = true; track("tool_start"); } }
  function shuffle(list) { for (var i = list.length - 1; i > 0; i -= 1) { var j = Math.floor(Math.random() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; } return list; }
  function cardTemplate(index) { return '<button class="rn-tarot-card" type="button" data-card-index="' + index + '" aria-label="Face-down tarot card. It will reveal automatically." disabled><span class="rn-tarot-card__inner"><span class="rn-tarot-card__back" aria-hidden="true"></span><span class="rn-tarot-card__front"></span></span></button>'; }
  function renderSlots() { var count = mode() === "three_card" ? 3 : 1; spread.className = "rn-tarot-spread rn-tarot-spread--" + (count === 3 ? "three" : "one"); spread.dataset.spread = count === 3 ? "three_card" : "one_card"; spread.innerHTML = Array.from({ length: count }, function (_, i) { return cardTemplate(i); }).join(""); }
  function setStatus(text) { if (status) status.textContent = text; }
  function prepare() {
    start(); state = "shuffling"; revealed = 0; drawn = shuffle(deck.slice()).slice(0, mode() === "three_card" ? 3 : 1).map(function (card) { return Object.assign({}, card, { reversed: Math.random() < 0.5 }); });
    track("card_shuffle"); setStatus("Shuffling your spread…"); if (hint) hint.textContent = "Your cards will reveal one at a time."; if (results) results.innerHTML = ""; if (resultActions) resultActions.hidden = true; resetButton.hidden = true; shuffleButton.disabled = true; shuffleButton.textContent = "Reading…";
    renderSlots(); var cards = root.querySelectorAll(".rn-tarot-card"); cards.forEach(function (button) { button.classList.add("is-ready"); button.style.setProperty("--scatter", (Math.random() * 12 - 6).toFixed(1) + "deg"); });
    window.setTimeout(function () { state = "ready_to_draw"; setStatus("Reading your spread…"); window.setTimeout(function () { reveal(0); }, 320); }, 520);
  }
  function reveal(index) {
    if ((state !== "ready_to_draw" && state !== "card_drawn") || !drawn[index] || drawn[index].revealed) return;
    state = "revealing"; var card = drawn[index]; card.revealed = true; revealed += 1; var button = root.querySelector('.rn-tarot-card[data-card-index="' + index + '"]'); var front = button.querySelector(".rn-tarot-card__front"); front.innerHTML = '<img src="' + card.image + '" alt="' + card.name + '" loading="eager"><span class="rn-tarot-card__orientation">' + (card.reversed ? "Reversed" : "Upright") + '</span>'; if (card.reversed) button.classList.add("is-reversed"); button.classList.add("is-flipped"); button.setAttribute("aria-label", card.name + ", " + (card.reversed ? "reversed" : "upright")); track("card_draw", { card_name: card.name }); window.setTimeout(function () { track("card_reveal", { card_name: card.name }); renderResults(); state = "card_drawn"; if (revealed === drawn.length) complete(); else { setStatus("Card " + revealed + " of " + drawn.length + " revealed…"); window.setTimeout(function () { state = "ready_to_draw"; reveal(revealed); }, 380); } }, 560);
  }
  function renderResults() { if (!results) return; results.innerHTML = drawn.map(function (card, index) { if (!card.revealed) return ""; var reversed = card.reversed; var love = reversed ? card.reversedLove : card.uprightLove; var general = reversed ? card.reversedGeneral : card.uprightGeneral; return '<article class="rn-tarot-result"><div class="rn-tarot-result__heading"><p class="rn-tarot-result__position">' + (mode() === "three_card" ? positions[index] : "Your card") + '</p><h2>' + card.name + ' <span>· ' + (reversed ? "Reversed" : "Upright") + '</span></h2></div><div class="rn-tarot-result__summary-grid"><div><strong>Core read</strong><p>' + love + '</p></div><div><strong>What may be influencing this</strong><p>' + general + '</p></div><div><strong>Next grounded step</strong><p>' + card.reflection + '</p></div></div><details class="rn-tarot-result__details"><summary>Read the card context</summary><p><strong>Love context:</strong> ' + love + '</p><p><strong>General theme:</strong> ' + general + '</p><p><strong>Reflection prompt:</strong> ' + card.reflection + '</p></details></article>'; }).join(""); }
  function complete() { state = "result_shown"; var summary = mode() === "three_card" ? "Taken together, these cards are a prompt to notice the pattern, the present choice, and the next grounded step — not a fixed prediction." : "Let this card sharpen the question you are asking yourself; it cannot guarantee another person’s choice or a future outcome."; results.insertAdjacentHTML("beforeend", '<p class="rn-tarot-summary"><strong>Takeaway:</strong> ' + summary + '</p>'); if (!resultActions.querySelector("[data-affiliate]")) resultActions.insertAdjacentHTML("beforeend", '<a class="rn-tarot-guide rn-tarot-guide--soft" href="/go/fiverr-tarot/" data-affiliate data-cta="tarot-result-fiverr" rel="sponsored nofollow noopener">Compare love tarot readers →</a>'); resultActions.hidden = false; resetButton.hidden = false; setStatus("Your reading is complete. Keep what helps and leave what does not."); track("spread_complete", { card_name: drawn.map(function (c) { return c.name; }).join("|") }); }
  function reset() { state = "idle"; drawn = []; revealed = 0; results.innerHTML = ""; resultActions.hidden = true; resetButton.hidden = true; shuffleButton.disabled = false; shuffleButton.textContent = "Start reading"; setStatus("Choose a spread, hold your question in mind, then start."); hint.textContent = "Your cards will reveal one at a time."; renderSlots(); }
  function copyResult() { var text = Array.from(results.querySelectorAll(".rn-tarot-result, .rn-tarot-summary")).map(function (el) { return el.innerText; }).join("\n\n"); if (!text) return; var done = function () { copyButton.textContent = "Copied"; track("copy_result"); window.setTimeout(function () { copyButton.textContent = "Copy result"; }, 1400); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(function () {}); }
  modeInputs.forEach(function (input) { input.addEventListener("change", function () { start(); reset(); }); });
  questionChips.forEach(function (chip) { chip.addEventListener("click", function () { start(); if (questionInput) { questionInput.value = chip.getAttribute("data-question") || ""; questionInput.focus(); } }); });
  if (questionInput) questionInput.addEventListener("focus", start, { once: true });
  shuffleButton.addEventListener("click", prepare); resetButton.addEventListener("click", function () { track("draw_again"); reset(); }); copyButton.addEventListener("click", copyResult);
  root.querySelectorAll("[data-tarot-guide]").forEach(function (link) { link.addEventListener("click", function () { track("tarot_guide_click", { destination: link.getAttribute("href") }); }); });
  renderSlots();
}());
