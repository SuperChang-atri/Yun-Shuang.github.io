/* Activity gallery carousel: auto-advances left, dots below for manual
   navigation, hover pauses, off-screen/hidden-tab pauses, touch swipe. */
(function () {
  "use strict";

  var root = document.getElementById("gallery-carousel");
  if (!root) return;

  var INTERVAL = 4500;
  var items = [];
  var idx = 0;
  var timer = null;
  var hovered = false;
  var offscreen = false;

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var track, dotsBox, prevBtn, nextBtn;

  function esc(s) { return window.MSB.esc(s); }
  function lang() { return window.MSB.lang(); }
  function cap(it) {
    return lang() === "zh" ? (it.caption_zh || it.caption || "") : (it.caption || it.caption_zh || "");
  }

  function build() {
    root.innerHTML =
      '<div class="carousel-viewport"><div class="carousel-track"></div></div>' +
      '<button class="carousel-arrow carousel-prev" aria-label="Previous">‹</button>' +
      '<button class="carousel-arrow carousel-next" aria-label="Next">›</button>' +
      '<div class="carousel-dots" role="tablist"></div>';

    track = root.querySelector(".carousel-track");
    dotsBox = root.querySelector(".carousel-dots");
    prevBtn = root.querySelector(".carousel-prev");
    nextBtn = root.querySelector(".carousel-next");

    track.innerHTML = items.map(function (it, i) {
      var c = cap(it);
      return '<figure class="carousel-slide">' +
        '<img src="/' + esc(it.src) + '" alt="' + esc(c || "Group activity") + '"' +
        (i === 0 ? "" : ' loading="lazy"') + ">" +
        (c ? '<figcaption class="carousel-cap">' + esc(c) + "</figcaption>" : "") +
        "</figure>";
    }).join("");

    dotsBox.innerHTML = items.map(function (_, i) {
      return '<button class="carousel-dot" data-i="' + i + '" aria-label="' + (i + 1) + '"></button>';
    }).join("");
    dotsBox.querySelectorAll(".carousel-dot").forEach(function (d) {
      d.addEventListener("click", function () {
        go(parseInt(d.getAttribute("data-i"), 10));
      });
    });

    prevBtn.addEventListener("click", function () { go(idx - 1); });
    nextBtn.addEventListener("click", function () { go(idx + 1); });

    root.addEventListener("mouseenter", function () { hovered = true; });
    root.addEventListener("mouseleave", function () { hovered = false; });

    var startX = null;
    root.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? go(idx + 1) : go(idx - 1); }
      startX = null;
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      offscreen = document.hidden;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
      }, { threshold: 0.1 }).observe(root);
    }

    update();
  }

  function update() {
    track.style.transform = "translateX(" + (-idx * 100) + "%)";
    dotsBox.querySelectorAll(".carousel-dot").forEach(function (d, i) {
      d.classList.toggle("active", i === idx);
      d.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  }

  function go(i) {
    idx = (i + items.length) % items.length;
    update();
    restart();
  }

  function tick() {
    if (!hovered && !offscreen && items.length > 1) go(idx + 1);
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = window.setInterval(tick, INTERVAL);
  }

  function restart() {
    if (timer) { window.clearInterval(timer); timer = null; }
    start();
  }

  document.addEventListener("langchange", function () {
    if (!track) return;
    track.querySelectorAll(".carousel-slide").forEach(function (el, i) {
      var c = cap(items[i]);
      var img = el.querySelector("img");
      var capEl = el.querySelector(".carousel-cap");
      if (img) img.alt = c || "Group activity";
      if (capEl) capEl.textContent = c;
    });
  });

  window.MSB.fetchJSON("/_data/gallery.json").then(function (data) {
    items = data.items || [];
    if (!items.length) { root.style.display = "none"; return; }
    build();
    start();
  }).catch(function () { root.style.display = "none"; });
})();
