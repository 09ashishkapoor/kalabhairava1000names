import html
import json
import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP_PATH = REPO_ROOT / 'data' / 'bootstrap-names.json'
MANIFEST_PATH = REPO_ROOT / 'data' / 'names-manifest.json'
CHUNKS_DIR = REPO_ROOT / 'data' / 'name-chunks'
SOURCE_DATA_PATH = REPO_ROOT / 'sahasranama_meanings.json'
BASE_URL = 'https://bhairavakalikenamosthute.com'
NAME_RANGES = [(start, start + 99) for start in range(1, 1000, 100)]
NAMES_HUB_PATH = REPO_ROOT / 'names' / 'index.html'


class RepoSmokeTests(unittest.TestCase):
    def _assert_page_core_metadata(self, page_html: str, canonical_url: str) -> None:
        self.assertRegex(page_html, r'<title>\s*[^<]+</title>')
        self.assertRegex(
            page_html,
            r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']+["\']',
        )
        self.assertRegex(
            page_html,
            re.compile(
                rf'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']{re.escape(canonical_url)}["\']',
                re.IGNORECASE,
            ),
        )
        self.assertRegex(page_html, re.compile(r'<h1\b[^>]*>[\s\S]*?</h1>', re.IGNORECASE))

    @staticmethod
    def _normalize_whitespace(value: str) -> str:
        return re.sub(r'\s+', ' ', value).strip()

    def test_core_public_files_exist(self):
        required_files = [
            'index.html',
            'styles.css',
            'critical.css',
            'app.js',
            'i18n.js',
            'translations.js',
            'search-worker.js',
            'load-styles.js',
            'manifest.webmanifest',
            'registerSW.js',
            'sw.js',
            'sahasranama_meanings.json',
            'MaaAdyaKali_5.webp',
            'MaaAdyaKali_5-mobile.webp',
            'data/bootstrap-names.json',
            'data/names-manifest.json',
            'generate_loading_artifacts.py',
            'names/static-pages.css',
        ]

        for relative_path in required_files:
            with self.subTest(relative_path=relative_path):
                self.assertTrue((REPO_ROOT / relative_path).exists())

    def test_generated_names_pages_exist(self):
        self.assertTrue(NAMES_HUB_PATH.exists(), 'Expected generated names hub at names/index.html')

        for start, end in NAME_RANGES:
            range_page = REPO_ROOT / 'names' / f'{start}-{end}' / 'index.html'
            with self.subTest(range_page=range_page.as_posix()):
                self.assertTrue(range_page.exists())

    def test_sitemap_includes_expected_seo_urls(self):
        sitemap_xml = (REPO_ROOT / 'sitemap.xml').read_text(encoding='utf-8')
        sitemap_locs = set(re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', sitemap_xml))

        expected_urls = {f'{BASE_URL}/', f'{BASE_URL}/names/'}
        expected_urls.update(f'{BASE_URL}/names/{start}-{end}/' for start, end in NAME_RANGES)

        missing_urls = sorted(expected_urls - sitemap_locs)
        self.assertFalse(missing_urls, f'Sitemap missing SEO URLs: {missing_urls}')

    def test_generated_names_pages_have_required_metadata_and_content(self):
        dataset = json.loads(SOURCE_DATA_PATH.read_text(encoding='utf-8'))

        hub_html = NAMES_HUB_PATH.read_text(encoding='utf-8')
        self._assert_page_core_metadata(hub_html, f'{BASE_URL}/names/')
        self.assertIn('./static-pages.css', hub_html)
        for start, end in NAME_RANGES:
            with self.subTest(hub_link=f'./{start}-{end}/'):
                self.assertIn(f'./{start}-{end}/', hub_html)

        for start, end in NAME_RANGES:
            page_path = REPO_ROOT / 'names' / f'{start}-{end}' / 'index.html'
            page_html = page_path.read_text(encoding='utf-8')
            self._assert_page_core_metadata(page_html, f'{BASE_URL}/names/{start}-{end}/')
            self.assertIn('../static-pages.css', page_html)
            self.assertRegex(page_html, r'"@type"\s*:\s*"ItemList"')

            first_entry_for_range = dataset[start - 1]
            with self.subTest(range=f'{start}-{end}', field='english_name'):
                self.assertIn(first_entry_for_range['english_name'], page_html)
            with self.subTest(range=f'{start}-{end}', field='hindi_name'):
                self.assertIn(first_entry_for_range['hindi_name'], page_html)

    def test_index_references_mobile_startup_assets(self):
        index_html = (REPO_ROOT / 'index.html').read_text(encoding='utf-8')

        expected_references = [
            './critical.css',
            './load-styles.js',
            './manifest.webmanifest',
            './data/bootstrap-names.json',
            './MaaAdyaKali_5-mobile.webp',
            'translations.js?v=2',
            'i18n.js?v=2',
            'navigation.js?v=2',
            'app.js?v=2',
            'registerSW.js',
            'search-input',
            'names-grid',
        ]

        for reference in expected_references:
            with self.subTest(reference=reference):
                self.assertIn(reference, index_html)

        self.assertNotIn('/sahasranama_meanings.json" as="fetch"', index_html)
        self.assertNotIn('Complete List of 1000 Names of Kalabhairava', index_html)

    def test_homepage_links_to_names_hub(self):
        index_html = (REPO_ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertRegex(
            index_html,
            re.compile(
                r'<a[^>]+href=["\'](?:\./)?names/["\'][^>]*>\s*Browse all 1000 Kalabhairava names with meanings\s*</a>',
                re.IGNORECASE,
            ),
        )

    def test_homepage_faq_schema_is_absent_or_backed_by_visible_content(self):
        index_html = (REPO_ROOT / 'index.html').read_text(encoding='utf-8')
        ld_json_blocks = re.findall(
            r'<script type="application/ld\+json">\s*(\{[\s\S]*?\})\s*</script>',
            index_html,
        )

        faq_pages = []
        for block in ld_json_blocks:
            try:
                parsed_block = json.loads(block)
            except json.JSONDecodeError:
                continue

            schema_type = parsed_block.get('@type')
            if schema_type == 'FAQPage' or (
                isinstance(schema_type, list) and 'FAQPage' in schema_type
            ):
                faq_pages.append(parsed_block)

        if not faq_pages:
            return

        visible_html = re.sub(r'<script[\s\S]*?</script>', ' ', index_html, flags=re.IGNORECASE)
        visible_html = re.sub(r'<style[\s\S]*?</style>', ' ', visible_html, flags=re.IGNORECASE)
        visible_text = html.unescape(re.sub(r'<[^>]+>', ' ', visible_html))
        normalized_visible_text = self._normalize_whitespace(visible_text).lower()

        for faq_page in faq_pages:
            for entry in faq_page.get('mainEntity', []):
                question = self._normalize_whitespace(entry.get('name', '')).lower()
                self.assertTrue(question)
                self.assertIn(question, normalized_visible_text)

                answer = entry.get('acceptedAnswer', {}).get('text', '')
                answer_snippet = self._normalize_whitespace(answer)[:120].lower()
                self.assertTrue(answer_snippet)
                self.assertIn(answer_snippet, normalized_visible_text)

    def test_source_dataset_shape_is_stable(self):
        dataset = json.loads(SOURCE_DATA_PATH.read_text(encoding='utf-8'))
        self.assertIsInstance(dataset, list)
        self.assertGreaterEqual(len(dataset), 1000)

        first_entry = dataset[0]
        for key in [
            'index',
            'english_name',
            'english_one_line',
            'english_elaboration',
            'hindi_name',
            'hindi_one_line',
            'hindi_elaboration',
        ]:
            with self.subTest(key=key):
                self.assertIn(key, first_entry)

    def test_bootstrap_artifact_matches_first_eleven_entries(self):
        dataset = json.loads(SOURCE_DATA_PATH.read_text(encoding='utf-8'))
        bootstrap = json.loads(BOOTSTRAP_PATH.read_text(encoding='utf-8'))

        self.assertEqual(len(bootstrap), 11)
        self.assertEqual(bootstrap, dataset[:11])

        bootstrap_indexes = [entry['index'] for entry in bootstrap]
        self.assertEqual(bootstrap_indexes, list(range(1, 12)))

    def test_chunk_manifest_covers_all_remaining_entries_once(self):
        source_data = json.loads(SOURCE_DATA_PATH.read_text(encoding='utf-8'))
        bootstrap = json.loads(BOOTSTRAP_PATH.read_text(encoding='utf-8'))
        manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))

        self.assertEqual(manifest['initialBatchSize'], 11)
        self.assertEqual(manifest['totalNames'], len(source_data))
        self.assertGreater(manifest['chunkCount'], 0)
        self.assertEqual(manifest['chunkCount'], len(manifest['chunks']))

        combined_entries = list(bootstrap)
        for chunk_meta in manifest['chunks']:
            chunk_path = REPO_ROOT / chunk_meta['path'].lstrip('./')
            with self.subTest(chunk=chunk_meta['path']):
                self.assertTrue(chunk_path.exists())
            chunk_entries = json.loads(chunk_path.read_text(encoding='utf-8'))
            self.assertEqual(len(chunk_entries), chunk_meta['count'])
            self.assertEqual(chunk_entries[0]['index'], chunk_meta['startIndex'])
            self.assertEqual(chunk_entries[-1]['index'], chunk_meta['endIndex'])
            combined_entries.extend(chunk_entries)

        combined_indexes = [entry['index'] for entry in combined_entries]
        source_indexes = [entry['index'] for entry in source_data]
        self.assertEqual(combined_indexes, source_indexes)
        self.assertEqual(len(set(combined_indexes)), len(combined_indexes))

    def test_manifest_icons_point_to_existing_files(self):
        manifest = json.loads((REPO_ROOT / 'manifest.webmanifest').read_text(encoding='utf-8'))
        self.assertIn('icons', manifest)
        self.assertGreater(len(manifest['icons']), 0)

        for icon in manifest['icons']:
            icon_path = REPO_ROOT / icon['src']
            with self.subTest(icon=icon['src']):
                self.assertTrue(icon_path.exists())

    def test_startup_contract_moved_to_bootstrap_reader_flow(self):
        app_source = (REPO_ROOT / 'app.js').read_text(encoding='utf-8')
        translations_source = (REPO_ROOT / 'translations.js').read_text(encoding='utf-8')

        self.assertIn("bootstrap: './data/bootstrap-names.json'", app_source)
        self.assertIn("manifest: './data/names-manifest.json'", app_source)
        self.assertIn('pageSize: 11', app_source)
        self.assertNotIn("fetch('./sahasranama_meanings.json')", app_source)
        self.assertIn('searchLoading', app_source)
        self.assertIn('searchLoading', translations_source)
        self.assertNotIn('Promise.all([', app_source)
        self.assertEqual(app_source.count('showError(error.message);'), 1)
        self.assertGreaterEqual(app_source.count('showTransientNotice('), 2)

    def test_service_worker_caches_reader_artifacts_not_monolith(self):
        sw_source = (REPO_ROOT / 'sw.js').read_text(encoding='utf-8')
        self.assertNotIn('/sahasranama_meanings.json', sw_source)
        self.assertIn('sahasranama-reader-data', sw_source)
        self.assertIn('bootstrap-names', sw_source)
        self.assertIn('names-manifest', sw_source)
        self.assertIn('name-chunks', sw_source)

    def test_index_html_weight_budget_is_reduced(self):
        index_size = (REPO_ROOT / 'index.html').stat().st_size
        self.assertLess(index_size, 120_000)

    def test_app_script_stays_fully_wrapped_in_main_iife(self):
        app_source = (REPO_ROOT / 'app.js').read_text(encoding='utf-8').rstrip()
        self.assertTrue(
            app_source.endswith('})();'),
            'app.js should not leak extra executable code after the main IIFE',
        )


if __name__ == '__main__':
    unittest.main()
