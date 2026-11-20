# Third-party libraries

Used only by the operator portal's **Import bus list** feature, to read files in the browser.

| File | Library | Version | Licence |
|---|---|---|---|
| `pdf.min.mjs`, `pdf.worker.min.mjs` | [pdf.js](https://github.com/mozilla/pdf.js) (legacy build, for older browsers) | 6.2.108 | Apache-2.0 (`LICENSE-pdfjs.txt`) |
| `jszip.min.js` | [JSZip](https://github.com/Stuk/jszip), used to open Word (.docx) and Excel (.xlsx) files | 3.10.1 | MIT (`LICENSE-jszip.md`) |

`build.py` compresses these and embeds them in `admin.html`, so the page still works on its own.
