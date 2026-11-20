#!/usr/bin/env python3
"""Build the published pages.

Edit the files in src/, then run:  python3 build.py

It writes index.html and admin.html at the top of the repo with the CSS, JavaScript
and logos inlined, so each page works on its own: on GitHub Pages, double-clicked
from a folder, opened from inside a zip, or in a file preview.
"""
import base64, gzip, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'

def data_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()

css = (SRC / 'assets/onboard.css').read_text(encoding='utf-8')
scripts = {name: (SRC / 'assets' / name).read_text(encoding='utf-8') for name in ['onboard.js', 'listparser.js']}
for name, code in scripts.items():
    assert '</script' not in code.lower(), f'{name} must not contain a closing script tag'

# Libraries for reading PDF / Word / Excel files (operator portal only). Stored gzip-compressed
# and base64-encoded in non-executing script tags; the page unpacks them only when an operator
# imports a list.
VENDOR = {'vendor-pdfjs': 'pdf.min.mjs', 'vendor-pdfjs-worker': 'pdf.worker.min.mjs', 'vendor-jszip': 'jszip.min.js'}
def vendor_tags():
    out = []
    for tag_id, fname in VENDOR.items():
        raw = (ROOT / 'vendor' / fname).read_bytes()
        packed = base64.b64encode(gzip.compress(raw, compresslevel=9, mtime=0)).decode()
        out.append(f'<script type="application/x-gzip-base64" id="{tag_id}">{packed}</script>')
    return '\n'.join(out)
images = {name: data_uri(ROOT / 'icons' / name) for name in ['logo.png', 'logo-white.png', 'favicon-64.png']}

for page in ['index.html', 'admin.html']:
    html = (SRC / page).read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="assets/onboard.css">', '<style>\n' + css + '\n</style>')
    for name, code in scripts.items():
        html = html.replace(f'<script src="assets/{name}"></script>', '<script>\n' + code + '\n</script>')
    if '<!-- VENDOR -->' in html:
        html = html.replace('<!-- VENDOR -->', vendor_tags())
    for name, uri in images.items():
        html = html.replace(f'"icons/{name}"', f'"{uri}"')
    left = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
    assert not left, f'{page}: not inlined: {left}'
    note = '<!-- Built from src/' + page + ' by build.py. Edit the file in src/, then run: python3 build.py -->\n'
    doctype, rest = html.split('\n', 1)
    out = doctype + '\n' + note + rest  # the comment must come after <!DOCTYPE html> or browsers use quirks mode
    (ROOT / page).write_text(out, encoding='utf-8')
    print(f'built {page} ({len(out) // 1024} KB)')
