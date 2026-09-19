/* Team photo reveal: expandable section with staggered fade-in */
(function () {
  "use strict";

  var section = document.getElementById("team-section");
  if (!section) return;

  var toggle = document.getElementById("team-toggle");
  var reveal = document.getElementById("team-reveal");
  var hint = document.getElementById("team-hint");
  var chipsBox = document.getElementById("team-chips");
  var isOpen = false;
  var members = null;

  function esc(s) { return window.MSB.esc(s); }
  function lang() { return window.MSB.lang(); }
  function t(k) { return window.MSB.t(k); }
  function pick(m, key) {
    var v = lang() === "zh" ? (m[key + "_zh"] || m[key]) : m[key];
    return v || "";
  }
  function initials(name) {
    return (name || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
  }

  function setOpen(open) {
    isOpen = open;
    reveal.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    reveal.setAttribute("aria-hidden", open ? "false" : "true");
    if (hint) hint.textContent = open ? t("home.team.hintClose") : t("home.team.hint");
  }

  toggle.addEventListener("click", function () { setOpen(!isOpen); });

  function renderChips() {
    if (!members || !chipsBox) return;
    var cur = members.filter(function (m) { return m.role !== "alumni"; });
    chipsBox.innerHTML = cur.map(function (m, i) {
      return '<span class="team-chip" style="--i:' + i + '">' +
        '<span class="chip-avatar">' + esc(initials(m.name)) + "</span>" +
        "<span>" + esc(pick(m, "name")) + "</span></span>";
    }).join("");
  }

  window.MSB.fetchJSON("/_data/members.json").then(function (data) {
    members = data.members || [];
    renderChips();
  }).catch(function () { /* chips are decorative; ignore */ });

  document.addEventListener("langchange", function () {
    setOpen(isOpen);
    renderChips();
  });

  setOpen(false);
})();
