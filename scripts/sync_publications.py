# -*- coding: utf-8 -*-
"""Sync publications into _data/publications.json.

Default source is OpenAlex (open, no API key, works from GitHub Actions).
Use --source scholar locally (requires `pip install scholarly`) to fetch
exact Google Scholar numbers instead.

Usage:
    python scripts/sync_publications.py                 # OpenAlex (CI default)
    python scripts/sync_publications.py --source scholar  # local, needs scholarly

Safety: refuses to overwrite the JSON if it collected suspiciously few papers.
"""
import argparse
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

SCHOLAR_ID = "CY_RlkAAAAAJ"
OPENALEX_AUTHOR_ID = "A5001128668"
# OpenAlex 把部分论文拆到了另一个同名实体，该实体还混有化学/环境论文，
# 因此对其逐篇按 "作者名含 Fan 且单位为 UESTC" 过滤。
OPENALEX_EXTRA_AUTHOR_IDS = ("A5112368784",)
OPENALEX_UESTC_IDS = ("I150229711", "I4210164150")
MIN_PAPERS = 10
USER_AGENT = "MSB-lab-website/1.0 (mailto:fmrifanys@uestc.edu.cn)"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_data", "publications.json")

NAME_VARIANTS = {
    "yunshuang fan",
    "yun-shuang fan",
    "fan yunshuang",
    "fan yun-shuang",
    "fan yunshuang",
    "范云霜",
    "樊云霜",
}


def normalize_name(s):
    s = (s or "").lower()
    for ch in ("\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "-"):
        s = s.replace(ch, "-")
    return " ".join(s.split())


def http_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


# --------------------------------------------------------------------------
# OpenAlex
# --------------------------------------------------------------------------
def fmt_authors(names, cap=8):
    names = [n for n in names if n]
    if not names:
        return ""
    if len(names) > cap:
        return ", ".join(names[:cap]) + ", et al."
    return ", ".join(names)


def work_to_pub(w):
    authorships = w.get("authorships") or []
    names = [((a.get("author") or {}).get("display_name") or "") for a in authorships]
    loc = w.get("primary_location") or {}
    source = loc.get("source") or {}
    link = w.get("doi") or loc.get("landing_page_url") or w.get("id") or ""
    return {
        "title": (w.get("title") or "").strip(),
        "authors": fmt_authors(names),
        "venue": (source.get("display_name") or "").strip(),
        "year": w.get("publication_year"),
        "citations": int(w.get("cited_by_count") or 0),
        "link": link,
    }


def fetch_works_by_author(author_id):
    """All works of an OpenAlex author id (cursor paging)."""
    works = []
    cursor = "*"
    while cursor:
        url = ("https://api.openalex.org/works?filter=author.id:" + author_id +
               "&per-page=200&sort=publication_year:desc&cursor=" + urllib.parse.quote(cursor))
        data = http_json(url)
        results = data.get("results") or []
        if not results:
            break
        works.extend(results)
        cursor = (data.get("meta") or {}).get("next_cursor")
    return works


def fetch_openalex():
    author = http_json("https://api.openalex.org/authors/" + OPENALEX_AUTHOR_ID)

    works = fetch_works_by_author(OPENALEX_AUTHOR_ID)

    # Merge in works mis-assigned to other "Yunshuang Fan" entities, keeping
    # only entries where an author name contains "fan" and an affiliation is UESTC.
    for extra_id in OPENALEX_EXTRA_AUTHOR_IDS:
        for w in fetch_works_by_author(extra_id):
            ok_name = any("fan" in normalize_name(((a.get("author") or {}).get("display_name") or ""))
                          for a in (w.get("authorships") or []))
            ok_inst = any(
                any((inst.get("id") or "").rstrip("/").split("/")[-1] in OPENALEX_UESTC_IDS
                    for inst in (a.get("institutions") or []))
                for a in (w.get("authorships") or [])
            )
            if ok_name and ok_inst:
                works.append(w)

    pubs = []
    seen = set()
    for w in works:
        authorships = w.get("authorships") or []
        names = [((a.get("author") or {}).get("display_name") or "") for a in authorships]
        # safety for the main entity: keep only works with a known name variant
        if not any(normalize_name(n) in NAME_VARIANTS for n in names):
            continue
        pub = work_to_pub(w)
        key = (pub["link"] or pub["title"]).lower()
        if key in seen:
            continue
        seen.add(key)
        pubs.append(pub)

    stats = author.get("summary_stats") or {}
    profile = {
        "name": author.get("display_name", ""),
        "affiliation": "University of Electronic Science and Technology of China",
        "citedby": author.get("cited_by_count"),
        "hindex": stats.get("h_index"),
        "i10index": stats.get("i10_index"),
    }
    return profile, pubs


# --------------------------------------------------------------------------
# Google Scholar (local use; Google blocks datacenter IPs, so not used in CI)
# --------------------------------------------------------------------------
def fetch_scholar():
    from scholarly import scholarly  # imported lazily; only needed for this mode

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
        link = ("https://scholar.google.com/citations?view_op=view_citation&citation_for_view=" +
                pub_id) if pub_id else ""
        pubs.append({
            "title": (bib.get("title") or "").strip(),
            "authors": (bib.get("author") or "").strip(),
            "venue": venue.strip(),
            "year": year,
            "citations": int(p.get("num_citations") or 0),
            "link": link,
        })

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
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", choices=["openalex", "scholar"], default="openalex",
                    help="data source (default: openalex)")
    args = ap.parse_args()

    label = "OpenAlex" if args.source == "openalex" else "Google Scholar"
    try:
        if args.source == "openalex":
            profile, pubs = fetch_openalex()
        else:
            profile, pubs = fetch_scholar()
    except Exception as e:
        print("Sync failed (%s): %s" % (label, e))
        print("Keeping existing publications.json unchanged.")
        return 1

    pubs = [p for p in pubs if p["title"]]
    pubs.sort(key=lambda x: (-(x["year"] or 0), -x["citations"], x["title"]))

    if len(pubs) < MIN_PAPERS:
        print("Only %d papers collected (< %d). Refusing to overwrite." % (len(pubs), MIN_PAPERS))
        return 1

    payload = {
        "updated": time.strftime("%Y-%m-%d"),
        "source": label,
        "scholar_id": SCHOLAR_ID,
        "openalex_id": OPENALEX_AUTHOR_ID,
        "profile": profile,
        "publications": pubs,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2))
        f.write(u"\n")
    print("Synced %d publications from %s (citedby=%s, h-index=%s)." %
          (len(pubs), label, profile.get("citedby"), profile.get("hindex")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
