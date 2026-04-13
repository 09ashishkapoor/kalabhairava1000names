import json
import re
import unittest
from pathlib import Path
from urllib.parse import urlparse


REPO_ROOT = Path(__file__).resolve().parents[1]


class RepoSmokeTests(unittest.TestCase):
    def test_core_public_files_exist(self):
        required_files = [
            "index.html",
            "styles.css",
            "app.js",
            "i18n.js",
            "translations.js",
            "search-worker.js",
            "critical.css",
            "load-styles.js",
            "manifest.webmanifest",
            "registerSW.js",
            "sw.js",
            "sahasranama_meanings.json",
            "MaaAdyaKali_5.webp",
        ]

        for relative_path in required_files:
            with self.subTest(relative_path=relative_path):
                self.assertTrue((REPO_ROOT / relative_path).exists())

    def test_index_references_core_assets(self):
        index_html = (REPO_ROOT / "index.html").read_text(encoding="utf-8")

        expected_references = [
            "/critical.css",
            "/load-styles.js",
            "/manifest.webmanifest",
            "/sahasranama_meanings.json",
            "MaaAdyaKali_5.webp",
            "translations.js?v=2",
            "i18n.js?v=2",
            "navigation.js?v=2",
            "app.js?v=2",
            "registerSW.js",
        ]

        for reference in expected_references:
            with self.subTest(reference=reference):
                self.assertIn(reference, index_html)

    def test_dataset_shape_is_stable(self):
        dataset = json.loads(
            (REPO_ROOT / "sahasranama_meanings.json").read_text(encoding="utf-8")
        )

        self.assertIsInstance(dataset, list)
        self.assertGreaterEqual(len(dataset), 1000)

        first_entry = dataset[0]
        for key in [
            "index",
            "english_name",
            "english_one_line",
            "english_elaboration",
            "hindi_name",
            "hindi_one_line",
            "hindi_elaboration",
        ]:
            with self.subTest(key=key):
                self.assertIn(key, first_entry)

    def test_manifest_icons_point_to_existing_files(self):
        manifest = json.loads(
            (REPO_ROOT / "manifest.webmanifest").read_text(encoding="utf-8")
        )

        self.assertIn("icons", manifest)
        self.assertGreater(len(manifest["icons"]), 0)

        for icon in manifest["icons"]:
            icon_path = REPO_ROOT / icon["src"]
            with self.subTest(icon=icon["src"]):
                self.assertTrue(icon_path.exists())

    def test_service_worker_precache_entries_exist(self):
        sw_source = (REPO_ROOT / "sw.js").read_text(encoding="utf-8")
        precache_urls = re.findall(r'url:\s*"([^"]+)"', sw_source)

        for raw_url in precache_urls:
            parsed = urlparse(raw_url)
            local_path = parsed.path.lstrip("/")
            if not local_path:
                continue

            with self.subTest(precache_url=raw_url):
                self.assertTrue((REPO_ROOT / local_path).exists())

    def test_app_script_stays_fully_wrapped_in_main_iife(self):
        app_source = (REPO_ROOT / "app.js").read_text(encoding="utf-8").rstrip()
        self.assertTrue(
            app_source.endswith("})();"),
            "app.js should not leak extra executable code after the main IIFE",
        )


if __name__ == "__main__":
    unittest.main()
