#!/usr/bin/env python3
"""Build the published pages.

Edit the files in src/, then run:  python3 build.py

It writes index.html and admin.html at the top of the repo with the CSS, JavaScript
and logos inlined, so each page works on its own: on GitHub Pages, double-clicked
from a folder, opened from inside a zip, or in a file preview.
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'

def data_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()

css = (SRC / 'assets/onboard.css').read_text(encoding='utf-8')
js = (SRC / 'assets/onboard.js').read_text(encoding='utf-8')
assert '</script' not in js.lower(), 'onboard.js must not contain a closing script tag'
images = {name: data_uri(ROOT / 'icons' / name) for name in ['logo.png', 'logo-white.png', 'favicon-64.png']}

for page in ['index.html', 'admin.html']:
    html = (SRC / page).read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="assets/onboard.css">', '<style>\n' + css + '\n</style>')
    html = html.replace('<script src="assets/onboard.js"></script>', '<script>\n' + js + '\n</script>')
    for name, uri in images.items():
        html = html.replace(f'"icons/{name}"', f'"{uri}"')
    left = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
    assert not left, f'{page}: not inlined: {left}'
    note = '<!-- Built from src/' + page + ' by build.py. Edit the file in src/, then run: python3 build.py -->\n'
    doctype, rest = html.split('\n', 1)
    out = doctype + '\n' + note + rest  # the comment must come after <!DOCTYPE html> or browsers use quirks mode
    (ROOT / page).write_text(out, encoding='utf-8')
    print(f'built {page} ({len(out) // 1024} KB)')
