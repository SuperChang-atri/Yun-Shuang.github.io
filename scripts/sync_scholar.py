# -*- coding: utf-8 -*-
"""Sync publications from Google Scholar into _data/publications.json.

Designed to run in GitHub Actions (weekly) but can also be run locally:

    pip install scholarly
    python scripts/sync_scholar.py

Safety: if the scrape fails or returns suspiciously few papers, the existing
_data/publications.json is left untouched and the script exits non-zero
(so the scheduled workflow sends a failure notification instead of
publishing empty data).
"""
import io
import json
import os
import sys
import time

SCHOLAR_ID = "CY_RlkAAAAAJ"
MIN_PAPERS = 10  # sanity threshold; we know the profile has 30+ papers

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_data", "publications.json")


def scrape():
    from scholarly import scholarly

    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "indices", "publications"])

    pubs = []
    for p in author.get("publications", []):
        bib = p.get("bib", {})
        year = bib.get("pub_year") or ""
        try:
            year = int(year)
        except (TypeError, ValueError):
            year = None
        venue = bib.get("journal") or bib.get("venue") or bib.get("conference") or ""
        pub_id = p.get("author_pub_id") or ""
        link = ("https://scholar.google.com/citations?view_op=view_citation&citation_for_view=" + pub_id) if pub_id else ""
        pubs.append({
            "title": (bib.get("title") or "").strip(),
            "authors": (bib.get("author") or "").strip(),
            "venue": venue.strip(),
            "year": year,
            "citations": int(p.get("num_citations") or 0),
            "link": link,
        })

    pubs = [p for p in pubs if p["title"]]
    pubs.sort(key=lambda x: (-(x["year"] or 0), -x["citations"], x["title"]))

    indices = author.get("indices", {}) or {}
    profile = {
        "name": author.get("name", ""),
        "affiliation": author.get("affiliation", ""),
        "citedby": indices.get("citedby"),
        "hindex": indices.get("hindex"),
        "i10index": indices.get("i10index"),
    }
    return profile, pubs


def main():
    try:
        profile, pubs = scrape()
    except Exception as e:
        print("Scrape failed: %s" % e)
        print("Keeping existing publications.json (if any).")
        return 1

    if len(pubs) < MIN_PAPERS:
        print("Only %d papers scraped (< %d). Refusing to overwrite." % (len(pubs), MIN_PAPERS))
        return 1

    payload = {
        "updated": time.strftime("%Y-%m-%d"),
        "scholar_id": SCHOLAR_ID,
        "profile": profile,
        "publications": pubs,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2))
        f.write(u"\n")
    print("Synced %d publications (citations=%s, h-index=%s)." %
          (len(pubs), profile.get("citedby"), profile.get("hindex")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
