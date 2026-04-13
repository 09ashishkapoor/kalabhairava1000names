#!/usr/bin/env python3
"""
Generate mobile-first loading artifacts from the canonical sahasranama dataset.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE_DATA = ROOT / "sahasranama_meanings.json"
BOOTSTRAP_PATH = ROOT / "data" / "bootstrap-names.json"
MANIFEST_PATH = ROOT / "data" / "names-manifest.json"
CHUNKS_DIR = ROOT / "data" / "name-chunks"
HERO_SOURCE = ROOT / "MaaAdyaKali_5.webp"
HERO_MOBILE = ROOT / "MaaAdyaKali_5-mobile.webp"

INITIAL_BATCH_SIZE = 11
TRANSPORT_CHUNK_SIZE = 44
MOBILE_HERO_WIDTH = 1280


def load_source_data() -> list[dict]:
    return json.loads(SOURCE_DATA.read_text(encoding="utf-8"))


def ensure_dirs() -> None:
    BOOTSTRAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: object) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


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
                "path": f"/data/name-chunks/{file_name}",
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
        "searchSourcePath": "/sahasranama_meanings.json",
        "chunks": chunk_entries,
    }

    write_json(BOOTSTRAP_PATH, bootstrap)
    write_json(MANIFEST_PATH, manifest)


def generate_mobile_hero() -> None:
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


def main() -> None:
    data = load_source_data()
    generate_name_artifacts(data)
    generate_mobile_hero()
    print("Generated loading artifacts:")
    print(f"- {BOOTSTRAP_PATH.relative_to(ROOT)}")
    print(f"- {MANIFEST_PATH.relative_to(ROOT)}")
    print(f"- {CHUNKS_DIR.relative_to(ROOT)} ({len(list(CHUNKS_DIR.glob('*.json')))} chunks)")
    print(f"- {HERO_MOBILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
