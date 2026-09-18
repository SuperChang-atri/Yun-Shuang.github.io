/* Publications renderer: loads _data/publications.json, groups by year,
   client-side search + pagination. */
(function () {
  "use strict";

  var PER_PAGE = 15;
  var data = null;
  var filtered = [];
  var page = 1;
  var query = "";

  function esc(s) { return window.MSB.esc(s); }
  function t(k) { return window.MSB.t(k); }

  function renderStats() {
    var el = document.getElementById("pub-stats");
    var p = (data && data.profile) || {};
    var pubs = (data && data.publications) || [];
    el.innerHTML =
      stat(p.citedby != null ? p.citedby : "—", t("publications.citations")) +
      stat(p.hindex != null ? p.hindex : "—", t("publications.hindex")) +
      stat(pubs.length, t("publications.count"));
    var up = document.getElementById("pub-updated");
    var stamp = (data && data.updated) || "—";
    if (data && data.source) stamp += " · " + data.source;
    up.textContent = t("publications.updated") + ": " + stamp;

    function stat(num, lbl) {
      return '<div class="pub-stat"><div class="num">' + esc(num) + '</div><div class="lbl">' + esc(lbl) + "</div></div>";
    }
  }

  function applyFilter() {
    var pubs = (data && data.publications) || [];
    if (!query) { filtered = pubs; return; }
    var q = query.toLowerCase();
    filtered = pubs.filter(function (p) {
      return (p.title || "").toLowerCase().indexOf(q) >= 0 ||
             (p.authors || "").toLowerCase().indexOf(q) >= 0 ||
             (p.venue || "").toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderList() {
    var el = document.getElementById("pub-list");
    if (!filtered.length) {
      el.innerHTML = '<p class="muted" style="padding:32px 0">' + esc(t("publications.noresult")) + "</p>";
      return;
    }
    var start = (page - 1) * PER_PAGE;
    var slice = filtered.slice(start, start + PER_PAGE);

    var html = "";
    var lastYear = null;
    slice.forEach(function (p) {
      var y = p.year || "n.d.";
      if (y !== lastYear) { html += '<div class="pub-year">' + esc(y) + "</div>"; lastYear = y; }
      var title = p.link
        ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
        : esc(p.title);
      html += '<div class="pub-item">' +
        '<div class="pub-title">' + title + "</div>" +
        '<div class="pub-authors">' + esc(p.authors) + "</div>" +
        (p.venue ? '<div class="pub-venue">' + esc(p.venue) + "</div>" : "") +
        (p.citations > 0 ? '<span class="pub-cite">' + esc(t("publications.citedby")) + " " + esc(p.citations) + "</span>" : "") +
        "</div>";
    });
    el.innerHTML = html;
  }

  function renderPages() {
    var el = document.getElementById("pub-pages");
    var total = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (total <= 1) { el.innerHTML = ""; return; }
    var html = '<button data-p="prev"' + (page === 1 ? " disabled" : "") + ">‹</button>";
    for (var i = 1; i <= total; i++) {
      html += '<button data-p="' + i + '"' + (i === page ? ' class="cur"' : "") + ">" + i + "</button>";
    }
    html += '<button data-p="next"' + (page === total ? " disabled" : "") + ">›</button>";
    el.innerHTML = html;

    el.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = b.getAttribute("data-p");
        if (p === "prev") page = Math.max(1, page - 1);
        else if (p === "next") page = Math.min(total, page + 1);
        else page = parseInt(p, 10);
        renderList();
        renderPages();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function refresh() {
    applyFilter();
    renderStats();
    renderList();
    renderPages();
  }

  window.MSB.fetchJSON("/_data/publications.json").then(function (d) {
    data = d;
    refresh();

    var box = document.getElementById("pub-search");
    box.addEventListener("input", function () {
      query = box.value.trim();
      page = 1;
      applyFilter();
      renderList();
      renderPages();
    });

    document.addEventListener("langchange", refresh);
  }).catch(function () {
    document.getElementById("pub-list").innerHTML =
      '<p class="muted" style="padding:32px 0">Publication data unavailable. Please visit Google Scholar directly.</p>';
  });
})();
