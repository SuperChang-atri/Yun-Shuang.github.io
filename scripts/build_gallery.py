# -*- coding: utf-8 -*-
"""Reconcile _data/gallery.json with the files in assets/img/gallery/.

- New image files  -> appended as new items (empty captions, date guessed
  from a leading YYYY-MM or YYYY-MM-DD in the filename if present)
- Deleted files    -> their items are removed
- Existing items   -> order and captions are preserved

Run:  python scripts/build_gallery.py
Members/admins normally never run this manually: the build-gallery GitHub
Actions workflow runs it automatically whenever the folder changes.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(ROOT, "assets", "img", "gallery")
OUT = os.path.join(ROOT, "_data", "gallery.json")
EXTS = (".jpg", ".jpeg", ".png", ".webp")
DATE_RE = re.compile(r"^(\d{4}-\d{2})(-\d{2})?")


def main():
    files = sorted(f for f in os.listdir(GALLERY_DIR) if f.lower().endswith(EXTS))

    existing = {}
    if os.path.exists(OUT):
        with io.open(OUT, encoding="utf-8") as f:
            for it in json.load(f).get("items", []):
                existing[it.get("src", "")] = it

    items = []
    for fname in files:
        src = "assets/img/gallery/" + fname
        if src in existing:
            items.append(existing[src])
            continue
        m = DATE_RE.match(fname)
        items.append({
            "src": src,
            "caption": "",
            "caption_zh": "",
            "date": m.group(1) if m else "",
        })

    payload = {"items": items}
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2))
        f.write(u"\n")
    print("Wrote %s (%d photos)" % (OUT, len(items)))


if __name__ == "__main__":
    sys.exit(main())
