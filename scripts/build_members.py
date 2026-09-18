# -*- coding: utf-8 -*-
"""Aggregate _data/members/*.json into _data/members.json (consumed by the site).

Run:  python scripts/build_members.py
Skips files starting with "_". Sorts: pi -> phd -> master -> alumni,
then by enrollment year (older first), then name.
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEMBERS_DIR = os.path.join(ROOT, "_data", "members")
OUT = os.path.join(ROOT, "_data", "members.json")

ROLE_ORDER = {"pi": 0, "phd": 1, "master": 2, "alumni": 3}


def load_members():
    members = []
    for fname in sorted(os.listdir(MEMBERS_DIR)):
        if not fname.endswith(".json") or fname.startswith("_"):
            continue
        path = os.path.join(MEMBERS_DIR, fname)
        with io.open(path, encoding="utf-8") as f:
            m = json.load(f)
        # strip documentation helper keys like "_comment_"
        m = {k: v for k, v in m.items() if not (k.startswith("_") and k.endswith("_"))}
        members.append(m)
    return members


def sort_key(m):
    return (ROLE_ORDER.get(m.get("role"), 9), -(m.get("since") or 0), m.get("name", ""))


def main():
    members = load_members()
    members.sort(key=sort_key)
    payload = {"count": len(members), "members": members}
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2))
        f.write(u"\n")
    print("Wrote %s (%d members)" % (OUT, len(members)))


if __name__ == "__main__":
    sys.exit(main())
