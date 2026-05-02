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
    from PIL import Image  # type: ignore[import-not-found]
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


def markdown_heading_text(line: str) -> str | None:
    match = re.fullmatch(r"#{3,6}\s+(.+)", line.strip())
    if not match:
        return None
    return match.group(1).strip()


def to_html_paragraphs(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return "<p>—</p>"

    blocks: list[str] = []
    paragraphs = [segment.strip() for segment in text.split("\n\n") if segment.strip()]

    for paragraph in paragraphs:
        lines = [line.strip() for line in paragraph.splitlines() if line.strip()]
        if not lines:
            continue

        # The source elaborations occasionally contain Markdown fragments from
        # upstream notes. Render the useful structure and drop separator-only
        # artifacts so the static devotional pages stay clean without JS.
        if len(lines) == 1 and lines[0] in {"-", "—", "---"}:
            continue

        if all(line.startswith(("* ", "- ")) for line in lines):
            items = [f"<li>{to_html_text(line[2:].strip())}</li>" for line in lines]
            blocks.append("<ul>" + "".join(items) + "</ul>")
            continue

        if len(lines) == 1 and (heading_text := markdown_heading_text(lines[0])):
            blocks.append(f"<h4>{to_html_text(heading_text)}</h4>")
            continue

        rendered_lines = []
        for line in lines:
            if heading_text := markdown_heading_text(line):
                rendered_lines.append(f"</p>\n<h4>{to_html_text(heading_text)}</h4>\n<p>")
            elif line.startswith(("* ", "- ")):
                rendered_lines.append(to_html_text(line[2:].strip()))
            else:
                rendered_lines.append(to_html_text(line))

        rendered = "<br>".join(rendered_lines).replace("<p><br>", "<p>").replace("<br></p>", "</p>")
        blocks.append(f"<p>{rendered}</p>")

    return "\n".join(blocks) if blocks else "<p>—</p>"


def to_json_ld_script(payload: object) -> str:
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return serialized.replace("</", "<\\/")


def read_lastmod() -> str:
    if LAST_UPDATED_PATH.exists():
        candidate = LAST_UPDATED_PATH.read_text(encoding="utf-8").strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", candidate):
            return candidate
    return datetime.now(timezone.utc).date().isoformat()


def contact_text() -> str:
    """Return a human-readable contact that avoids crawler-created email protection URLs."""
    return "kaliputraashish [at] gmail [dot] com"


def range_theme_summary(entries: list[dict]) -> str:
    names = [str(entry.get("english_name", "")) for entry in entries[:8]]
    if any(name.startswith(("Bhu", "Bhai", "Bhi")) for name in names):
        return "This opening section emphasizes Bhairava as protector, lord of beings, destroyer of fear, and cosmic support."
    if any(name.startswith(("Kaal", "Kala", "Kaala")) for name in names):
        return "This section contains time, discipline, protection, and sovereignty names associated with Kāla Bhairava."
    if any(name.startswith(("Sh", "Sri", "Sree")) for name in names):
        return "This section highlights auspicious, devotional, and refuge-giving qualities in the later names."
    return "This section continues the ordered Sahasranama sequence with meanings, transliteration-style spellings, and study notes."


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
    json_ld: object,
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
                        f"  <h3>Elaboration for name {to_html_text(index_value)}, {to_html_text(english_name)}</h3>",
                        f"  {to_html_paragraphs(entry['english_elaboration'])}",
                        "</article>",
                    ]
                )
            )

        first_name = entries[0]["english_name"]
        last_name = entries[-1]["english_name"]
        theme_summary = range_theme_summary(entries)
        title = f"Kalabhairava Names {start_index}-{end_index}: {first_name} to {last_name}"
        description = (
            f"Study Kalabhairava names {start_index}-{end_index}, from {first_name} to {last_name}, "
            "with English meanings, transliteration-style names, and devotional notes."
        )

        json_ld = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                        {"@type": "ListItem", "position": 2, "name": "Kalabhairava Names Hub", "item": f"{SITE_URL}/names/"},
                        {"@type": "ListItem", "position": 3, "name": f"Names {start_index}-{end_index}", "item": canonical_url},
                    ],
                },
                {
                    "@type": "CollectionPage",
                    "name": f"Kalabhairava Names {start_index}-{end_index}",
                    "description": description,
                    "url": canonical_url,
                    "inLanguage": "en",
                    "isPartOf": {"@type": "WebSite", "name": "Kālabhairava Sahasranāma", "url": SITE_URL},
                },
                {
                    "@type": "ItemList",
                    "name": f"Kalabhairava Names {start_index}-{end_index}",
                    "itemListOrder": "https://schema.org/ItemListOrderAscending",
                    "numberOfItems": len(entries),
                    "url": canonical_url,
                    "inLanguage": "en",
                    "itemListElement": item_list_entries,
                },
            ],
        }

        body = f"""
    <section class="hero-panel">
      <p class="intro">Read Kalabhairava names {start_index}-{end_index}, beginning with {to_html_text(first_name)} and ending with {to_html_text(last_name)}. Every name in this range includes an English meaning and expanded notes in crawlable text for steady study.</p>
      <p>{to_html_text(theme_summary)}</p>
      <nav class="page-nav" aria-label="Page navigation">
        <ul>
          <li><a href="../../">Use the searchable homepage reader</a></li>
          <li><a href="../">Browse every 100-name range</a></li>
          {prev_link}
          {next_link}
        </ul>
      </nav>
    </section>
    <section class="study-notes" aria-labelledby="range-study-notes-heading">
      <h2 id="range-study-notes-heading">How to use this range</h2>
      <p>Use this static page when you want the full text visible without relying on JavaScript search. The headings make each name directly linkable, while the short meaning gives a quick devotional sense before the longer explanation.</p>
      <p>The spellings use a simple Latin transliteration style for accessibility. Where Sanskrit terms carry several meanings, the notes explain the devotional interpretation used on this site rather than claiming a single exclusive translation.</p>
    </section>
    <div class="entries-stack">
      {''.join(entries_html)}
    </div>
    <section class="source-notes" aria-labelledby="source-notes-heading">
      <h2 id="source-notes-heading">Sources, corrections, and editorial notes</h2>
      <p>This project compiles devotional material and meaning notes from public references, Sanskrit source archives, and the maintainer's explanatory summaries. It is intended for spiritual study and personal chanting support.</p>
      <p>Primary references used during compilation:</p>
      <ul>
        <li><a href="https://sanskritdocuments.org/" rel="noopener">Open the SanskritDocuments.org source archive</a></li>
      </ul>
      <p>If you notice a spelling, translation, or source issue, please send the page URL and name number to {to_html_text(contact_text())} so it can be reviewed and corrected.</p>
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
            page_kicker="Devotional reference",
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
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                    {"@type": "ListItem", "position": 2, "name": "Kalabhairava Names Hub", "item": hub_canonical},
                ],
            },
            {
                "@type": "CollectionPage",
                "name": "Kalabhairava Names Hub",
                "description": hub_description,
                "url": hub_canonical,
                "inLanguage": "en",
                "isPartOf": {"@type": "WebSite", "name": "Kālabhairava Sahasranāma", "url": SITE_URL},
                "hasPart": [
                    {
                        "@type": "CollectionPage",
                        "name": f"Kalabhairava Names {path.rstrip('/').split('/')[-1]}",
                        "url": f"{SITE_URL}{path}",
                    }
                    for path in range_paths
                ],
            },
        ],
    }

    hub_body = f"""
    <section class="hero-panel">
      <p class="intro">Browse all 1000 Kalabhairava names in ten crawlable 100-name sections. This hub is the static reference version of the searchable reader, designed so readers and search engines can reach every name, meaning, and devotional note without client-side rendering.</p>
      <p>Use the range links below for focused study, citation, or sharing a specific part of the Sahasranama. Each range page includes direct anchors for individual names, concise English meanings, and longer explanatory notes.</p>
      <nav class="page-nav" aria-label="Hub navigation">
        <ul>
          <li><a href="../">Use the searchable homepage reader</a></li>
        </ul>
      </nav>
    </section>
    <section class="study-notes" aria-labelledby="hub-study-notes-heading">
      <h2 id="hub-study-notes-heading">About this Kalabhairava Sahasranama reference</h2>
      <p>Kālabhairava, a fierce and protective form of Shiva, is traditionally associated with time, discipline, protection, fearlessness, and the guardianship of sacred space. A Sahasranama is a devotional sequence of one thousand names used for chanting, contemplation, and study.</p>
      <p>This site presents the names in English-first form for accessible reading. The transliteration-style spellings are kept simple, and the explanations aim to clarify devotional meaning rather than replace Sanskrit study with a single fixed translation.</p>
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
      <h2 id="hub-source-notes-heading">Sources, corrections, and editorial notes</h2>
      <p>This project compiles devotional material and meaning notes from public references, Sanskrit source archives, and the maintainer's explanatory summaries. It is intended for spiritual study and personal chanting support.</p>
      <p>Primary references used during compilation:</p>
      <ul>
        <li><a href="https://sanskritdocuments.org/" rel="noopener">Open the SanskritDocuments.org source archive</a></li>
      </ul>
      <p>If you notice a spelling, translation, or source issue, please send the page URL and name number to {to_html_text(contact_text())} so it can be reviewed and corrected.</p>
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
        page_kicker="Study hub",
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
