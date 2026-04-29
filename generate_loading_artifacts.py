#!/usr/bin/env python3
"""
Generate loading artifacts and static SEO pages from the canonical sahasranama dataset.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from html import escape
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:  # pragma: no cover - fallback for minimal environments
    Image = None

ROOT = Path(__file__).resolve().parent
SOURCE_DATA = ROOT / "sahasranama_meanings.json"
BOOTSTRAP_PATH = ROOT / "data" / "bootstrap-names.json"
MANIFEST_PATH = ROOT / "data" / "names-manifest.json"
CHUNKS_DIR = ROOT / "data" / "name-chunks"
HERO_SOURCE = ROOT / "MaaAdyaKali_5.webp"
HERO_MOBILE = ROOT / "MaaAdyaKali_5-mobile.webp"
NAMES_DIR = ROOT / "names"
SITEMAP_PATH = ROOT / "sitemap.xml"
LAST_UPDATED_PATH = ROOT / "last-updated.txt"

SITE_URL = "https://bhairavakalikenamosthute.com"
INITIAL_BATCH_SIZE = 11
TRANSPORT_CHUNK_SIZE = 44
MOBILE_HERO_WIDTH = 1280
RANGE_SIZE = 100
STATIC_NAMES_CSS = NAMES_DIR / "static-pages.css"


def load_source_data() -> list[dict]:
    return json.loads(SOURCE_DATA.read_text(encoding="utf-8"))


def ensure_dirs() -> None:
    BOOTSTRAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    NAMES_DIR.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: object) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def to_html_text(value: object) -> str:
    return escape(str(value), quote=True)


def to_html_paragraphs(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return "<p>—</p>"

    paragraphs = [segment.strip() for segment in text.split("\n\n") if segment.strip()]
    return "\n".join(
        f"<p>{to_html_text(paragraph).replace(chr(10), '<br>')}</p>" for paragraph in paragraphs
    )


def to_json_ld_script(payload: dict) -> str:
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return serialized.replace("</", "<\\/")


def read_lastmod() -> str:
    if LAST_UPDATED_PATH.exists():
        candidate = LAST_UPDATED_PATH.read_text(encoding="utf-8").strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", candidate):
            return candidate
    return datetime.now(timezone.utc).date().isoformat()


def generate_name_artifacts(data: list[dict]) -> None:
    ensure_dirs()
    bootstrap = data[:INITIAL_BATCH_SIZE]
    remainder = data[INITIAL_BATCH_SIZE:]

    chunk_entries = []
    for offset, start in enumerate(range(0, len(remainder), TRANSPORT_CHUNK_SIZE), start=1):
        chunk = remainder[start : start + TRANSPORT_CHUNK_SIZE]
        file_name = f"chunk-{offset:02d}.json"
        file_path = CHUNKS_DIR / file_name
        write_json(file_path, chunk)
        chunk_entries.append(
            {
                "id": f"chunk-{offset:02d}",
                "path": f"data/name-chunks/{file_name}",
                "startIndex": chunk[0]["index"],
                "endIndex": chunk[-1]["index"],
                "count": len(chunk),
            }
        )

    manifest = {
        "version": 1,
        "initialBatchSize": INITIAL_BATCH_SIZE,
        "transportChunkSize": TRANSPORT_CHUNK_SIZE,
        "totalNames": len(data),
        "chunkCount": len(chunk_entries),
        "searchSourcePath": "sahasranama_meanings.json",
        "chunks": chunk_entries,
    }

    write_json(BOOTSTRAP_PATH, bootstrap)
    write_json(MANIFEST_PATH, manifest)


def page_shell(
    *,
    title: str,
    description: str,
    canonical_url: str,
    h1: str,
    body_html: str,
    json_ld: dict,
    stylesheet_href: str,
    page_class: str,
    page_kicker: str,
) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{to_html_text(title)}</title>
  <meta name="description" content="{to_html_text(description)}">
  <link rel="canonical" href="{to_html_text(canonical_url)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="stylesheet" href="{to_html_text(stylesheet_href)}">
  <script type="application/ld+json">{to_json_ld_script(json_ld)}</script>
</head>
<body class="{to_html_text(page_class)}">
  <main>
    <p class="page-kicker">{to_html_text(page_kicker)}</p>
    <h1>{to_html_text(h1)}</h1>
    {body_html}
  </main>
</body>
</html>
"""


def build_range_pages(data: list[dict]) -> list[str]:
    generated_paths: list[str] = []
    total = len(data)
    page_starts = list(range(0, total, RANGE_SIZE))

    for page_number, start_offset in enumerate(page_starts):
        entries = data[start_offset : start_offset + RANGE_SIZE]
        start_index = entries[0]["index"]
        end_index = entries[-1]["index"]
        slug = f"{start_index}-{end_index}"
        relative_path = f"/names/{slug}/"
        canonical_url = f"{SITE_URL}{relative_path}"

        prev_link = ""
        if page_number > 0:
            previous_entries = data[page_starts[page_number - 1] : page_starts[page_number - 1] + RANGE_SIZE]
            prev_slug = f"{previous_entries[0]['index']}-{previous_entries[-1]['index']}"
            prev_link = f'<li><a href="../{prev_slug}/">&larr; Previous range ({prev_slug})</a></li>'

        next_link = ""
        if page_number < len(page_starts) - 1:
            next_entries = data[page_starts[page_number + 1] : page_starts[page_number + 1] + RANGE_SIZE]
            next_slug = f"{next_entries[0]['index']}-{next_entries[-1]['index']}"
            next_link = f'<li><a href="../{next_slug}/">Next range ({next_slug}) &rarr;</a></li>'

        entries_html = []
        item_list_entries = []
        for position, entry in enumerate(entries, start=1):
            index_value = entry["index"]
            english_name = entry["english_name"]
            entry_anchor = f"name-{index_value}"
            item_list_entries.append(
                {
                    "@type": "ListItem",
                    "position": position,
                    "url": f"{canonical_url}#{entry_anchor}",
                    "name": english_name,
                }
            )

            entries_html.append(
                "\n".join(
                    [
                        f'<article class="entry" id="{entry_anchor}">',
                        f"  <h2>{to_html_text(index_value)}. {to_html_text(english_name)}</h2>",
                        f"  <p><strong>English meaning:</strong> {to_html_text(entry['english_one_line'])}</p>",
                        "  <h3>Elaboration</h3>",
                        f"  {to_html_paragraphs(entry['english_elaboration'])}",
                        "</article>",
                    ]
                )
            )

        title = f"Kalabhairava Names {start_index}-{end_index} (English Meanings)"
        description = (
            f"Browse Kalabhairava names {start_index}-{end_index} with English meanings, "
            "one-line summaries, and detailed elaboration."
        )

        json_ld = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": f"Kalabhairava Names {start_index}-{end_index}",
            "itemListOrder": "https://schema.org/ItemListOrderAscending",
            "numberOfItems": len(entries),
            "url": canonical_url,
            "inLanguage": "en",
            "itemListElement": item_list_entries,
        }

        body = f"""
    <section class="hero-panel">
      <p class="intro">This page is a static collection of Kalabhairava names {start_index}-{end_index} with English meanings. It is designed to remain useful without JavaScript.</p>
      <nav class="page-nav" aria-label="Page navigation">
        <ul>
          <li><a href="../../">Open the interactive homepage reader</a></li>
          <li><a href="../">Browse all ranges</a></li>
          {prev_link}
          {next_link}
        </ul>
      </nav>
    </section>
    <div class="entries-stack">
      {''.join(entries_html)}
    </div>
    <section class="source-notes" aria-labelledby="source-notes-heading">
      <h2 id="source-notes-heading">Sources and notes</h2>
      <p>This project compiles devotional material and meaning notes from public references plus the maintainer's explanatory summaries.</p>
      <p>Primary references used during compilation:</p>
      <ul>
        <li><a href="https://sanskritdocuments.org/" rel="noopener">SanskritDocuments.org</a></li>
      </ul>
      <p>Use this website for spiritual study and personal chanting support. Report inaccuracies to <a href="mailto:kaliputraashish@gmail.com">kaliputraashish@gmail.com</a> for correction.</p>
    </section>
"""

        page_html = page_shell(
            title=title,
            description=description,
            canonical_url=canonical_url,
            h1=f"Kalabhairava Names {start_index}-{end_index}",
            body_html=body,
            json_ld=json_ld,
            stylesheet_href="../static-pages.css",
            page_class="names-static names-static--range",
            page_kicker="Static devotional reference",
        )

        output_dir = NAMES_DIR / slug
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "index.html").write_text(page_html, encoding="utf-8")
        generated_paths.append(relative_path)

    return generated_paths

def build_names_hub(data: list[dict], range_paths: list[str]) -> None:
    sections = []
    for range_path in range_paths:
        slug = range_path.rstrip("/").split("/")[-1]
        start_index, end_index = slug.split("-")
        start_entry = data[int(start_index) - 1]
        end_entry = data[int(end_index) - 1]
        sections.append(
            "\n".join(
                [
                    "<li>",
                    f'  <a href="./{slug}/">Kalabhairava names {slug}</a>',
                    f"  <div>Starts with {to_html_text(start_entry['english_name'])} and ends with {to_html_text(end_entry['english_name'])}.</div>",
                    "</li>",
                ]
            )
        )

    hub_title = "All 1000 Kalabhairava Names with Meanings | Browse by Range"
    hub_description = "Browse all 1000 Kalabhairava names in ten crawlable static pages with English meanings."
    hub_canonical = f"{SITE_URL}/names/"

    json_ld = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Kalabhairava Names Hub",
        "url": hub_canonical,
        "inLanguage": "en",
        "hasPart": [
            {
                "@type": "CollectionPage",
                "name": f"Kalabhairava Names {path.rstrip('/').split('/')[-1]}",
                "url": f"{SITE_URL}{path}",
            }
            for path in range_paths
        ],
    }

    hub_body = f"""
    <section class="hero-panel">
      <p class="intro">Use this static hub to browse all 1000 Kalabhairava names by 100-name sections. Each section page includes the full visible entries with English meanings and detailed elaboration.</p>
      <nav class="page-nav" aria-label="Hub navigation">
        <ul>
          <li><a href="../">Open the interactive homepage reader</a></li>
        </ul>
      </nav>
    </section>
    <section class="ranges-panel" aria-labelledby="ranges-heading">
      <div class="section-heading">
        <p class="section-kicker">Directory</p>
        <h2 id="ranges-heading">Browse by 100-name ranges</h2>
      </div>
      <ol class="range-list">
        {''.join(sections)}
      </ol>
    </section>
    <section class="source-notes" aria-labelledby="hub-source-notes-heading">
      <h2 id="hub-source-notes-heading">Sources and notes</h2>
      <p>This project compiles devotional material and meaning notes from public references plus the maintainer's explanatory summaries.</p>
      <p>Primary references used during compilation:</p>
      <ul>
        <li><a href="https://sanskritdocuments.org/" rel="noopener">SanskritDocuments.org</a></li>
      </ul>
      <p>Use this website for spiritual study and personal chanting support. Report inaccuracies to <a href="mailto:kaliputraashish@gmail.com">kaliputraashish@gmail.com</a> for correction.</p>
    </section>
"""

    hub_html = page_shell(
        title=hub_title,
        description=hub_description,
        canonical_url=hub_canonical,
        h1="Kalabhairava Names Hub",
        body_html=hub_body,
        json_ld=json_ld,
        stylesheet_href="./static-pages.css",
        page_class="names-static names-static--hub",
        page_kicker="Static study hub",
    )

    (NAMES_DIR / "index.html").write_text(hub_html, encoding="utf-8")

def generate_sitemap(range_paths: list[str], lastmod: str) -> None:
    url_entries = [
        ("/", "monthly", "1.0"),
        ("/names/", "weekly", "0.9"),
        *[(path, "weekly", "0.8") for path in range_paths],
    ]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, changefreq, priority in url_entries:
        lines.extend(
            [
                "  <url>",
                f"    <loc>{SITE_URL}{path}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                f"    <changefreq>{changefreq}</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
            ]
        )
    lines.append("</urlset>")
    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def generate_mobile_hero() -> None:
    if Image is None:
        if HERO_MOBILE.exists():
            return
        shutil.copy2(HERO_SOURCE, HERO_MOBILE)
        return

    with Image.open(HERO_SOURCE) as image:
        if image.width <= MOBILE_HERO_WIDTH:
            resized = image.copy()
        else:
            height = round(image.height * (MOBILE_HERO_WIDTH / image.width))
            resized = image.resize((MOBILE_HERO_WIDTH, height), Image.Resampling.LANCZOS)

        resized.save(
            HERO_MOBILE,
            format="WEBP",
            quality=74,
            method=6,
        )


def generate_seo_pages_and_sitemap(data: list[dict]) -> None:
    if not STATIC_NAMES_CSS.exists():
        raise FileNotFoundError(f"Missing static names stylesheet: {STATIC_NAMES_CSS}")

    range_paths = build_range_pages(data)
    build_names_hub(data, range_paths)
    generate_sitemap(range_paths, read_lastmod())

def main() -> None:
    data = load_source_data()
    generate_name_artifacts(data)
    generate_mobile_hero()
    generate_seo_pages_and_sitemap(data)
    print("Generated loading and SEO artifacts:")
    print(f"- {BOOTSTRAP_PATH.relative_to(ROOT)}")
    print(f"- {MANIFEST_PATH.relative_to(ROOT)}")
    print(f"- {CHUNKS_DIR.relative_to(ROOT)} ({len(list(CHUNKS_DIR.glob('*.json')))} chunks)")
    print(f"- {HERO_MOBILE.relative_to(ROOT)}")
    print(f"- {NAMES_DIR.relative_to(ROOT)}")
    print(f"- {SITEMAP_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
