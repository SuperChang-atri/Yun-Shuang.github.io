/* News list renderer: single data file (_data/news.json), bilingual. */
(function () {
  "use strict";

  var box = document.getElementById("news-list");
  if (!box) return;

  var items = null;

  function esc(s) { return window.MSB.esc(s); }
  function lang() { return window.MSB.lang(); }

  function render() {
    if (!items) return;
    box.innerHTML = items.map(function (it) {
      var text = lang() === "zh" ? (it.text_zh || it.text) : (it.text || it.text_zh);
      return '<li><span class="news-date">' + esc(it.date || "") + "</span>" +
        "<span>" + esc(text || "") + "</span></li>";
    }).join("");
  }

  window.MSB.fetchJSON("/_data/news.json").then(function (data) {
    items = data.items || [];
    render();
  }).catch(function () { /* keep empty */ });

  document.addEventListener("langchange", render);
})();
