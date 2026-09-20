/* Member info JSON generator: form -> live preview -> download/copy.
   Pure client-side; members then submit the file via the PR flow. */
(function () {
  "use strict";

  var form = document.getElementById("member-form");
  if (!form) return;

  var out = document.getElementById("mj-output");
  var status = document.getElementById("mj-status");
  var nameInput = form.elements["name"];
  var idInput = form.elements["id"];
  var idTouched = false;

  function t(k) { return window.MSB.t(k); }

  function slugify(s) {
    return (s || "").toLowerCase()
      .replace(/['\u2019]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function val(n) {
    return (form.elements[n] && form.elements[n].value || "").trim();
  }

  function build() {
    var id = val("id") || slugify(val("name"));
    var sinceRaw = val("since");
    var since = /^\d{4}$/.test(sinceRaw) ? parseInt(sinceRaw, 10) : "";
    var photo = form.elements["photo"].checked
      ? "assets/people/" + (id || "your-id") + ".jpg"
      : "";
    var obj = {
      id: id,
      name: val("name"),
      name_zh: val("name_zh"),
      role: val("role") || "master",
      since: since,
      research: val("research"),
      research_zh: val("research_zh"),
      photo: photo,
      email: val("email"),
      links: {
        scholar: val("scholar"),
        github: val("github"),
        gitlab: val("gitlab"),
        orcid: val("orcid"),
        homepage: val("homepage")
      },
      bio: "",
      bio_zh: "",
      destination: val("destination"),
      destination_zh: val("destination_zh")
    };
    return { id: id, obj: obj };
  }

  function refresh() {
    out.textContent = JSON.stringify(build().obj, null, 2) + "\n";
  }

  function statusMsg(msg) {
    status.textContent = msg;
    window.setTimeout(function () { status.textContent = ""; }, 3000);
  }

  function validate() {
    var r = build();
    var missing = false;
    ["name", "name_zh", "id", "since", "research", "research_zh"].forEach(function (k) {
      if (!r.obj[k]) missing = true;
    });
    if (missing || !/^[a-z0-9-]+$/.test(r.obj.id)) {
      statusMsg(t("memberjson.error"));
      return null;
    }
    return r;
  }

  nameInput.addEventListener("input", function () {
    if (!idTouched) idInput.value = slugify(nameInput.value);
    refresh();
  });
  idInput.addEventListener("input", function () { idTouched = true; refresh(); });
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);

  document.getElementById("mj-download").addEventListener("click", function () {
    var r = validate();
    if (!r) return;
    var blob = new Blob([JSON.stringify(r.obj, null, 2) + "\n"], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = r.id + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    statusMsg(t("memberjson.saved"));
  });

  document.getElementById("mj-copy").addEventListener("click", function () {
    var r = validate();
    if (!r) return;
    var text = JSON.stringify(r.obj, null, 2) + "\n";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        statusMsg(t("memberjson.copied"));
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); statusMsg(t("memberjson.copied")); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  refresh();
})();
