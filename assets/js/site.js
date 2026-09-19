/* MSB site runtime: header/footer injection + i18n (EN/中文) + helpers */
(function () {
  "use strict";

  var LANG_KEY = "msb-lang";
  var dict = {};
  var lang = "en";
  var page = document.body.getAttribute("data-page") || "";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function t(key) {
    return dict[key] != null ? dict[key] : key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    var btn = document.getElementById("lang-toggle");
    if (btn) btn.textContent = lang === "en" ? "中文" : "EN";
  }

  /* ---------- chrome (header / footer) ---------- */
  function renderChrome() {
    var header = document.getElementById("site-header");
    if (header) {
      header.innerHTML =
        '<div class="site-header"><div class="wrap nav-wrap">' +
        '<a class="brand" href="/">' +
        '<img class="brand-logo" src="/assets/img/logo.svg" alt="MSB — Mapping Schizophrenia Brain">' +
        "</a>" +
        '<button class="menu-btn" id="menu-btn" aria-label="menu">☰</button>' +
        '<ul class="nav-links" id="nav-links">' +
        li("home", "/", "nav.home") +
        li("research", "/research/", "nav.research") +
        li("people", "/people/", "nav.people") +
        li("publications", "/publications/", "nav.publications") +
        li("contact", "/contact/", "nav.contact") +
        '<li class="lang-item"><button class="lang-toggle" id="lang-toggle">中文</button></li>' +
        "</ul></div></div>";

      document.getElementById("menu-btn").addEventListener("click", function () {
        document.getElementById("nav-links").classList.toggle("open");
      });
      document.getElementById("lang-toggle").addEventListener("click", function () {
        setLang(lang === "en" ? "zh" : "en");
      });
    }

    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML =
        '<div class="site-footer"><div class="wrap footer-inner">' +
        '<span data-i18n="footer.copy"></span>' +
        '<span><a href="mailto:fmrifanys@uestc.edu.cn" data-i18n="footer.contact"></a>' +
        '<a href="https://scholar.google.com/citations?user=CY_RlkAAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a>' +
        '<a href="https://github.com/Yun-Shuang/Yun-Shuang.github.io" target="_blank" rel="noopener">GitHub</a></span>' +
        "</div></div>";
    }

    function li(pg, href, key) {
      return '<li><a href="' + href + '"' + (pg === page ? ' class="active"' : "") +
        ' data-i18n="' + key + '"></a></li>';
    }
  }

  /* ---------- language ---------- */
  function setLang(l) {
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    loadDict(l).then(function () {
      applyI18n();
      document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
    });
  }

  function loadDict(l) {
    return fetch("/assets/i18n/" + l + ".json")
      .then(function (r) { return r.json(); })
      .then(function (d) { dict = d; })
      .catch(function () { dict = {}; });
  }

  /* ---------- boot ---------- */
  var initial = "en";
  try { initial = localStorage.getItem(LANG_KEY) || "en"; } catch (e) {}

  renderChrome();
  loadDict(initial).then(function () {
    lang = initial;
    applyI18n();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  });

  /* expose */
  window.MSB = {
    t: t,
    esc: esc,
    lang: function () { return lang; },
    fetchJSON: function (url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("fetch failed: " + url);
        return r.json();
      });
    }
  };
})();
