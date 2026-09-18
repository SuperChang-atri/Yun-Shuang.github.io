# -*- coding: utf-8 -*-
"""Validate member JSON files in _data/members/ (used by CI on pull requests).

Checks:
  - valid JSON, UTF-8
  - required fields: id, name, name_zh, role, research, research_zh
  - role in {pi, phd, master, alumni}
  - id matches filename, unique across members
  - URLs (if any) start with http(s)://
  - photo path (if any) points to assets/people/ and the file exists
Exit code 1 on any error.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEMBERS_DIR = os.path.join(ROOT, "_data", "members")

REQUIRED = ["id", "name", "name_zh", "role", "research", "research_zh"]
ROLES = {"pi", "phd", "master", "alumni"}
URL_RE = re.compile(r"^https?://")

errors = []


def err(fname, msg):
    errors.append("%s: %s" % (fname, msg))


def main():
    seen_ids = set()
    fnames = [f for f in sorted(os.listdir(MEMBERS_DIR))
              if f.endswith(".json") and not f.startswith("_")]

    if not fnames:
        err("_data/members", "no member files found")

    for fname in fnames:
        path = os.path.join(MEMBERS_DIR, fname)
        try:
            with io.open(path, encoding="utf-8") as f:
                m = json.load(f)
        except Exception as e:
            err(fname, "invalid JSON: %s" % e)
            continue

        for field in REQUIRED:
            if not m.get(field):
                err(fname, "missing required field '%s'" % field)

        role = m.get("role")
        if role and role not in ROLES:
            err(fname, "role must be one of %s, got '%s'" % (sorted(ROLES), role))

        mid = m.get("id", "")
        if mid:
            if mid + ".json" != fname:
                err(fname, "id '%s' does not match filename '%s'" % (mid, fname))
            if mid in seen_ids:
                err(fname, "duplicate id '%s'" % mid)
            seen_ids.add(mid)

        links = m.get("links") or {}
        for k, v in links.items():
            if v and not URL_RE.match(v):
                err(fname, "links.%s must start with http(s)://" % k)

        photo = m.get("photo")
        if photo:
            if not photo.startswith("assets/people/"):
                err(fname, "photo must live under assets/people/")
            elif not os.path.exists(os.path.join(ROOT, photo)):
                err(fname, "photo file not found: %s" % photo)

        since = m.get("since")
        if since is not None and not isinstance(since, int):
            err(fname, "'since' must be an integer year")

    if errors:
        print("Member validation FAILED:")
        for e in errors:
            print("  - " + e)
        return 1
    print("Member validation passed (%d files)." % len(fnames))
    return 0


if __name__ == "__main__":
    sys.exit(main())
