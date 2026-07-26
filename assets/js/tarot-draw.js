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
  var isEmbedded = root.classList.contains("rn-tarot-tool--embedded");
  var state = "idle";
  var drawn = [];
  var revealed = 0;
  var started = false;
  var positions = ["Past", "Present", "Next Step"];

  function escapeHtml(value) { return String(value).replace(/[&<>\"']/g, function (character) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]; }); }

  function mode() { if (isEmbedded) return "three_card"; var checked = root.querySelector('input[name="tarot-spread"]:checked'); return checked ? checked.value : "one_card"; }
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
  function cardReading(card) { var reversed = card.reversed; return { love: reversed ? card.reversedLove : card.uprightLove, general: reversed ? card.reversedGeneral : card.uprightGeneral, orientation: reversed ? "Reversed" : "Upright" }; }
  function renderResults() {
    if (!results) return;
    var visible = drawn.filter(function (card) { return card.revealed; });
    if (mode() !== "three_card") {
      results.innerHTML = visible.map(function (card) { var reading = cardReading(card); return '<article class="rn-tarot-result"><div class="rn-tarot-result__heading"><p class="rn-tarot-result__position">Your card</p><h2>' + escapeHtml(card.name) + ' <span>· ' + reading.orientation + '</span></h2></div><div class="rn-tarot-result__summary-grid"><div><strong>Core read</strong><p>' + escapeHtml(reading.love) + '</p></div><div><strong>What may be influencing this</strong><p>' + escapeHtml(reading.general) + '</p></div><div><strong>Next grounded step</strong><p>' + escapeHtml(card.reflection) + '</p></div></div></article>'; }).join("");
      return;
    }
    var activeIndex = Math.max(0, visible.length - 1);
    var cards = visible.map(function (card, index) { var reading = cardReading(card); var selected = index === activeIndex; return '<button class="rn-tarot-result-card' + (selected ? ' is-selected' : '') + '" type="button" role="tab" id="tarot-result-tab-' + index + '" aria-label="View details for ' + escapeHtml(card.name) + ', ' + escapeHtml(reading.orientation) + '" aria-selected="' + selected + '" aria-controls="tarot-result-panel" tabindex="' + (selected ? '0' : '-1') + '" data-result-index="' + index + '"><span class="rn-tarot-result__position">' + positions[index] + '</span><strong>' + escapeHtml(card.name) + '</strong><span class="rn-tarot-result-card__orientation">' + reading.orientation + '</span><span class="rn-tarot-result-card__read">' + escapeHtml(reading.love) + '</span><span class="rn-tarot-result-card__link">View details</span></button>'; }).join("");
    results.innerHTML = '<div class="rn-tarot-result-set"><div class="rn-tarot-result-cards" role="tablist" aria-label="Your three-card reading">' + cards + '</div><section class="rn-tarot-detail" id="tarot-result-panel" role="tabpanel" tabindex="0" aria-labelledby="tarot-result-tab-' + activeIndex + '"></section></div>';
    function selectResult(index, focusPanel) { var card = visible[index]; if (!card) return; var reading = cardReading(card); var buttons = results.querySelectorAll("[data-result-index]"); buttons.forEach(function (button, buttonIndex) { var selected = buttonIndex === index; button.classList.toggle("is-selected", selected); button.setAttribute("aria-selected", selected); button.tabIndex = selected ? 0 : -1; }); var panel = results.querySelector(".rn-tarot-detail"); panel.setAttribute("aria-labelledby", "tarot-result-tab-" + index); panel.innerHTML = '<p class="rn-tarot-result__position">' + positions[index] + '</p><h2>' + escapeHtml(card.name) + ' <span>· ' + reading.orientation + '</span></h2><p><strong>Love context:</strong> ' + escapeHtml(reading.love) + '</p><p><strong>What may be influencing this:</strong> ' + escapeHtml(reading.general) + '</p><p><strong>Reflection prompt:</strong> ' + escapeHtml(card.reflection) + '</p>'; if (focusPanel) panel.focus(); }
    results.querySelectorAll("[data-result-index]").forEach(function (button) { button.addEventListener("click", function () { selectResult(Number(button.dataset.resultIndex), true); }); button.addEventListener("keydown", function (event) { if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return; event.preventDefault(); var next = (Number(button.dataset.resultIndex) + (event.key === "ArrowRight" ? 1 : visible.length - 1)) % visible.length; var nextButton = results.querySelector('[data-result-index="' + next + '"]'); nextButton.focus(); selectResult(next, false); }); });
    selectResult(activeIndex, false);
  }
  function complete() { state = "result_shown"; var summary = mode() === "three_card" ? "Taken together, these cards are a prompt to notice the pattern, the present choice, and the next grounded step — not a fixed prediction." : "Let this card sharpen the question you are asking yourself; it cannot guarantee another person’s choice or a future outcome."; results.insertAdjacentHTML("beforeend", '<p class="rn-tarot-summary"><strong>Takeaway:</strong> ' + summary + '</p>'); if (!resultActions.querySelector("[data-affiliate]")) resultActions.insertAdjacentHTML("beforeend", '<a class="rn-tarot-guide rn-tarot-guide--soft" href="/go/fiverr-tarot/" data-affiliate data-cta="tarot-result-fiverr" rel="sponsored nofollow noopener">Compare love tarot readers →</a>'); resultActions.hidden = false; resetButton.hidden = false; shuffleButton.disabled = false; shuffleButton.textContent = isEmbedded ? "Reveal my three-card answer" : "Start reading"; setStatus("Your reading is complete. Keep what helps and leave what does not."); track("spread_complete", { card_name: drawn.map(function (c) { return c.name; }).join("|") }); }
  function reset() { state = "idle"; drawn = []; revealed = 0; results.innerHTML = ""; resultActions.hidden = true; resetButton.hidden = true; shuffleButton.disabled = false; shuffleButton.textContent = isEmbedded ? "Reveal my three-card answer" : "Start reading"; setStatus(isEmbedded ? "One click. Your three cards reveal automatically." : "Choose a spread, hold your question in mind, then start."); hint.textContent = "Your cards will reveal one at a time."; renderSlots(); }
  function copyResult() { var text = Array.from(results.querySelectorAll(".rn-tarot-result, .rn-tarot-result-set, .rn-tarot-summary")).map(function (el) { return el.innerText; }).join("\n\n"); if (!text) return; var done = function () { copyButton.textContent = "Copied"; track("copy_result"); window.setTimeout(function () { copyButton.textContent = "Copy result"; }, 1400); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(function () {}); }
  modeInputs.forEach(function (input) { input.addEventListener("change", function () { start(); reset(); }); });
  questionChips.forEach(function (chip) { chip.addEventListener("click", function () { start(); if (questionInput) { questionInput.value = chip.getAttribute("data-question") || ""; questionInput.focus(); } }); });
  if (questionInput) questionInput.addEventListener("focus", start, { once: true });
  shuffleButton.addEventListener("click", prepare); resetButton.addEventListener("click", function () { track("draw_again"); reset(); }); copyButton.addEventListener("click", copyResult);
  root.querySelectorAll("[data-tarot-guide]").forEach(function (link) { link.addEventListener("click", function () { track("tarot_guide_click", { destination: link.getAttribute("href") }); }); });
  renderSlots();
}());
