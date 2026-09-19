/* Activity gallery: renders _data/gallery.json as a grid with staggered
   scroll-in animation and a lightbox (click to enlarge, arrows/ESC). */
(function () {
  "use strict";

  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  var items = [];
  var lb = null, lbImg = null, lbCap = null, idx = 0;
  var io = null;

  function esc(s) { return window.MSB.esc(s); }
  function lang() { return window.MSB.lang(); }
  function cap(it) {
    return lang() === "zh" ? (it.caption_zh || it.caption || "") : (it.caption || it.caption_zh || "");
  }

  function render() {
    grid.innerHTML = items.map(function (it, i) {
      var c = cap(it);
      return '<figure class="gallery-item" data-i="' + i + '" style="transition-delay:' + ((i % 3) * 80) + 'ms">' +
        '<img src="/' + esc(it.src) + '" alt="' + esc(c || "Group activity") + '" loading="lazy">' +
        (c ? '<figcaption class="gallery-cap">' + esc(c) + "</figcaption>" : "") +
        "</figure>";
    }).join("");

    grid.querySelectorAll(".gallery-item").forEach(function (el) {
      el.addEventListener("click", function () {
        open(parseInt(el.getAttribute("data-i"), 10));
      });
    });
    observe();
  }

  function observe() {
    if (!("IntersectionObserver" in window)) {
      grid.querySelectorAll(".gallery-item").forEach(function (el) { el.classList.add("in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.15 });
    }
    grid.querySelectorAll(".gallery-item:not(.in)").forEach(function (el) { io.observe(el); });
  }

  /* ---------------- lightbox ---------------- */
  function buildLB() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.innerHTML =
      '<img alt="">' +
      '<div class="lightbox-cap"></div>' +
      '<button class="lb-btn lb-close" aria-label="Close">×</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous">‹</button>' +
      '<button class="lb-btn lb-next" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lbCap = lb.querySelector(".lightbox-cap");

    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); nav(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); nav(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") nav(-1);
      else if (e.key === "ArrowRight") nav(1);
    });
  }

  function open(i) {
    if (!items.length) return;
    if (!lb) buildLB();
    idx = i;
    show();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  function nav(d) {
    idx = (idx + d + items.length) % items.length;
    show();
  }

  function show() {
    var it = items[idx];
    lbImg.src = "/" + it.src;
    lbImg.alt = cap(it);
    lbCap.textContent = cap(it);
  }

  window.MSB.fetchJSON("/_data/gallery.json").then(function (data) {
    items = data.items || [];
    render();
  }).catch(function () { /* keep empty */ });

  document.addEventListener("langchange", render);
})();
