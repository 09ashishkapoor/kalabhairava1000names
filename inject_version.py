#!/usr/bin/env python3
"""
inject_version.py
Replace the placeholder <!-- VERSION --> in index.html with the contents of version.txt.
Intended to be run during the build step (Cloudflare Pages build command), e.g.:

python3 kalabhairava1000names/inject_version.py

This script edits the file in-place. It is idempotent.
"""
from pathlib import Path
import sys

root = Path(__file__).parent
version_file = root / 'version.txt'
index_file = root / 'index.html'

if not version_file.exists():
    print('version.txt not found; nothing to inject')
    sys.exit(0)

version = version_file.read_text(encoding='utf-8').strip()
if not version:
    print('version.txt is empty; nothing to inject')
    sys.exit(0)

text = index_file.read_text(encoding='utf-8')
if '<!-- VERSION -->' not in text:
    # If placeholder missing, attempt to replace existing site-version content
    import re
    text, n = re.subn(r'(<small class="site-version">)[\s\S]*?(</small>)', r"\1<!-- VERSION -->\2", text, flags=re.S)
    if n:
        print('Replaced existing site-version content with placeholder')

# Inject the version
new_text = text.replace('<!-- VERSION -->', version)
if new_text == text:
    print('No placeholder found or already injected')
else:
    index_file.write_text(new_text, encoding='utf-8')
    print('Injected version:', version)
