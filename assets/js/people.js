/* People renderer: loads _data/members.json and renders PI / PhD / Master / Alumni */
(function () {
  "use strict";

  var ICONS = {
    scholar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.5V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-4.5l-7 3.82-7-3.82z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
    gitlab: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.1 1.7a.42.42 0 0 1 .79.13l2.44 7.51h7.34l2.44-7.51a.42.42 0 0 1 .79-.13.42.42 0 0 1 .39.46l2.44 7.51 1.22 3.78c.1.32 0 .68-.3.94z"/></svg>',
    orcid: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM7.37 18.32h-1.6V7.1h1.6v11.22zM6.57 6.16a1.03 1.03 0 1 1 0-2.06 1.03 1.03 0 0 1 0 2.06zm10.65 12.16h-1.55v-5.6c0-1.4-.5-2.35-1.74-2.35-.95 0-1.51.64-1.76 1.25-.09.22-.11.53-.11.84v5.86h-1.56s.02-9.5 0-10.49h1.56v1.5c.21-.67 1.36-1.62 3.05-1.62 2.23 0 3.67 1.46 3.67 4.6v6.01z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    homepage: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7 9h-3a15.6 15.6 0 0 0-1.2-5.1A8.02 8.02 0 0 1 19 11zM12 4a13.9 13.9 0 0 1 2 7h-4a13.9 13.9 0 0 1 2-7zM4.26 13a8.04 8.04 0 0 1 0-2H7.3a16.5 16.5 0 0 0 0 2H4.26zM5 11a8.02 8.02 0 0 1 4.2-5.1A15.6 15.6 0 0 0 8 11H5zm4 9a8 8 0 0 1-4-4h3a15.6 15.6 0 0 0 1.2 5.1zm3 0a13.9 13.9 0 0 1-2-7h4a13.9 13.9 0 0 1-2 7zm3.8-1.9A15.6 15.6 0 0 0 17 13h3a8.02 8.02 0 0 1-4.2 5.1z"/></svg>'
  };

  function esc(s) { return window.MSB.esc(s); }
  function lang() { return window.MSB.lang(); }
  function pick(m, key) {
    var v = lang() === "zh" ? (m[key + "_zh"] || m[key]) : m[key];
    return v || "";
  }

  function initials(name) {
    return (name || "?").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
  }

  function avatar(m, lg) {
    var cls = "avatar" + (lg ? " lg" : "");
    if (m.photo) {
      return '<img class="' + cls + '" src="/' + esc(m.photo) + '" alt="' + esc(m.name) + '" loading="lazy">';
    }
    return '<span class="' + cls + '">' + esc(initials(m.name)) + "</span>";
  }

  function links(m) {
    var out = [];
    var L = m.links || {};
    if (L.scholar) out.push('<a href="' + esc(L.scholar) + '" target="_blank" rel="noopener" title="Google Scholar">' + ICONS.scholar + "</a>");
    if (L.github) out.push('<a href="' + esc(L.github) + '" target="_blank" rel="noopener" title="GitHub">' + ICONS.github + "</a>");
    if (L.gitlab) out.push('<a href="' + esc(L.gitlab) + '" target="_blank" rel="noopener" title="GitLab">' + ICONS.gitlab + "</a>");
    if (L.orcid) out.push('<a href="' + esc(L.orcid) + '" target="_blank" rel="noopener" title="ORCID">' + ICONS.orcid + "</a>");
    if (L.homepage) out.push('<a href="' + esc(L.homepage) + '" target="_blank" rel="noopener" title="Homepage">' + ICONS.homepage + "</a>");
    if (m.email) out.push('<a href="mailto:' + esc(m.email) + '" title="Email">' + ICONS.email + "</a>");
    return out.length ? '<div class="member-links">' + out.join("") + "</div>" : "";
  }

  function piCard(m) {
    return '<div class="pi-card">' + avatar(m, true) + "<div>" +
      "<h3>" + esc(pick(m, "name")) + "</h3>" +
      '<div class="pi-role">' + esc(pick(m, "title")) + "</div>" +
      "<p>" + esc(pick(m, "bio")) + "</p>" +
      '<p class="muted">' + esc(pick(m, "research")) + "</p>" +
      links(m) + "</div></div>";
  }

  var ROLE_LABELS = {
    phd: ["PhD student", "博士生"],
    master: ["Master student", "硕士生"],
    alumni: ["Alumni", "毕业校友"]
  };

  function memberCard(m) {
    var pair = ROLE_LABELS[m.role] || ["", ""];
    var role = lang() === "zh" ? pair[1] : pair[0];
    var sincePart = "";
    if (m.since) {
      sincePart = lang() === "zh"
        ? " · " + m.since + " " + window.MSB.t("people.since")
        : " · " + window.MSB.t("people.since") + " " + m.since;
    }
    var dest = lang() === "zh" ? (m.destination_zh || m.destination) : (m.destination || m.destination_zh);
    return '<div class="member-card">' + avatar(m) + '<div class="member-info">' +
      '<div class="member-name">' + esc(pick(m, "name")) + "</div>" +
      '<div class="member-role">' + esc(role + sincePart) + "</div>" +
      '<div class="member-research">' + esc(pick(m, "research")) + "</div>" +
      (dest ? '<div class="member-dest">' + esc(window.MSB.t("people.now") + ": " + dest) + "</div>" : "") +
      links(m) + "</div></div>";
  }

  function byRole(members, role) {
    return members.filter(function (m) { return m.role === role; });
  }

  function renderAll(data) {
    var members = data.members || [];
    var pi = byRole(members, "pi")[0];

    var piSlot = document.getElementById("pi-slot");
    if (piSlot && pi) piSlot.innerHTML = piCard(pi);

    [["phd", "phd-slot"], ["master", "master-slot"]].forEach(function (pair) {
      var el = document.getElementById(pair[1]);
      if (el) el.innerHTML = byRole(members, pair[0]).map(memberCard).join("");
    });

    var al = document.getElementById("alumni-slot");
    if (al) al.innerHTML = byRole(members, "alumni").map(memberCard).join("");
  }

  var cached = null;
  function load() {
    if (cached) return Promise.resolve(cached);
    return window.MSB.fetchJSON("/_data/members.json").then(function (d) { cached = d; return d; });
  }

  function rerender() { if (cached) renderAll(cached); }

  window.MSBPeople = {
    renderPage: function () {
      load().then(renderAll);
      document.addEventListener("langchange", rerender);
    },
    /* compact PI card for the home page */
    renderPI: function (el) {
      load().then(function (data) {
        var pi = (data.members || []).filter(function (m) { return m.role === "pi"; })[0];
        if (pi && el) el.innerHTML = piCard(pi);
      });
      document.addEventListener("langchange", function () {
        if (!cached || !el) return;
        var pi = (cached.members || []).filter(function (m) { return m.role === "pi"; })[0];
        if (pi) el.innerHTML = piCard(pi);
      });
    }
  };
})();
