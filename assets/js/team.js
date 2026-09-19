/* Team photo scroll-linked reveal: a page-colored curtain slides up as you
   scroll, uncovering the photo bottom-to-top (no clipping, no distortion).
   Graceful fallback: full reveal without JS. */
(function () {
  "use strict";

  var section = document.getElementById("team-section");
  if (!section) return;

  var wrap = section.querySelector(".team-photo-wrap");

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) return; // photo stays fully visible

  // Curtain overlay (created by JS only, so no-JS users see the photo directly)
  var curtain = document.createElement("div");
  curtain.className = "team-curtain";
  curtain.setAttribute("aria-hidden", "true");
  wrap.appendChild(curtain);
  section.classList.add("team-scroll");

  var revealed = false;
  var ticking = false;

  function update() {
    ticking = false;
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;

    // p: 0 when photo top is at 92% of viewport height, 1 when at 38%
    var start = vh * 0.92;
    var end = vh * 0.38;
    var p = (start - rect.top) / (start - end);
    if (p < 0) p = 0;
    if (p > 1) p = 1;

    curtain.style.transform = "translateY(" + (-p * 100).toFixed(2) + "%)";

    if (p > 0.82 && !revealed) {
      revealed = true;
      section.classList.add("is-revealed");
    } else if (p < 0.5 && revealed) {
      revealed = false;
      section.classList.remove("is-revealed");
    }
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();
