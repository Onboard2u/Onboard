/* Onboard list importer
   Turns an operator's bus list (PDF, Word .docx, Excel .xlsx or .csv) into structured data:
   driver, van and contact from the heading, then one section per table with a row per student
   (name, year, student contact, address, parent contacts, remarks, pick-up time).

   Handles the things real lists do: merged cells (siblings sharing an address or pick-up time),
   two parent numbers in one cell (DAD - ... / MOM - ...), several tables on one page, and
   headings in English or Malay. Everything it returns is shown to the operator to check and
   edit before anything is saved. Runs entirely in the browser; files are never uploaded. */
(function (g) {
  'use strict';

  /* ---------- column headings ---------- */
  const COLS = [
    ['no', /^(NO\.?|BIL\.?|#|NUM\.?|S\/?N)$/],
    ['studentPhone', /(STUDENT|PELAJAR|MURID).*(CONTACT|PHONE|TEL|NO|H\/?P)/],
    ['parentPhone', /(PARENT|GUARDIAN|PENJAGA|IBU|BAPA|EMERGENCY).*(CONTACT|PHONE|TEL|NO|H\/?P)?|^(CONTACT|PHONE|TEL)/],
    ['name', /NAME|NAMA/],
    ['year', /^(YEAR|GRADE|DARJAH|TAHUN|FORM|TINGKATAN|CLASS|KELAS|STANDARD|LEVEL)\b/],
    ['address', /ADDRESS|ALAMAT|LOCATION|PICK.?UP POINT|LOKASI/],
    ['remark', /REMARK|NOTE|CATATAN|COMMENT/],
    ['time', /TIME|MASA|WAKTU|PICK.?UP$/],
    ['school', /SCHOOL|SEKOLAH/]
  ];
  function classify(text) {
    const t = String(text || '').toUpperCase().replace(/\s+/g, ' ').trim();
    if (!t) return null;
    for (const [k, re] of COLS) if (re.test(t)) return k;
    return null;
  }
  const isHeaderRow = cells => new Set(cells.map(classify).filter(Boolean)).size >= 3 && cells.some(c => classify(c) === 'name');

  /* ---------- cleaning ---------- */
  const SMALL = new Set(['bin', 'binti', 'bt', 'bte', 'a/l', 'a/p', 'al', 'ap', 'van', 'de', 'der', 'da', 'di']);
  const squash = s => String(s || '').replace(/\s+/g, ' ').trim();
  function titleCase(s, keepCodes) {
    return squash(s).toLowerCase().replace(/[^\s,]+/g, (w, i) => {
      const up = w.toUpperCase();
      if (keepCodes && (/\d/.test(w) || (/^[a-z]{2,3}$/i.test(w) && /^(KL|LRT|MRT|PJ|USJ|SS|JLN|LRG|KG|TMN|BDR|BBU|KLCC|OUG|TTDI|PPR|SK|SJK|SMK|SMJK|SRK|SRA)$/.test(up)))) return up;
      if (i > 0 && SMALL.has(w)) return w;
      return w.replace(/(^|[-'(/.])([a-z])/g, (m, a, b) => a + b.toUpperCase());
    });
  }
  function cleanName(s) {
    return titleCase(squash(s).replace(/^(MR|MRS|MS|MDM|MISS|ENCIK|EN|PUAN|PN|CIK|TUAN|DR|UNCLE|AUNTY)\.?\s+/i, ''));
  }
  function cleanYear(s) {
    const t = squash(s); if (!t) return '';
    let m = t.match(/^(?:YEAR|Y|TAHUN|DARJAH|STD|STANDARD|GRADE|G)\s*\.?\s*(\d{1,2})$/i); if (m) return 'Year ' + +m[1];
    m = t.match(/^(?:FORM|F|TINGKATAN|T)\s*\.?\s*(\d)$/i); if (m) return 'Form ' + m[1];
    if (/^\d{1,2}$/.test(t)) return 'Year ' + +t;
    if (/^(PRE.?SCHOOL|TADIKA|KINDERGARTEN|K\d|NURSERY|RECEPTION)/i.test(t)) return titleCase(t);
    return titleCase(t, true);
  }
  const PHONE_RE = /\+?\(?\d[\d\s\-().]{6,}\d/g;
  const cleanPhone = s => squash(s).replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');
  function firstPhone(s) { const m = String(s || '').match(PHONE_RE); return m ? cleanPhone(m[0]) : ''; }
  const LABELS = [
    ['Dad', /\b(DAD|DADDY|FATHER|BAPA|AYAH|ABAH|PAPA|FATHER'S)\b/i], ['Mom', /\b(MOM|MUM|MUMMY|MOMMY|MOTHER|IBU|EMAK|MAMA|UMMI|MAK)\b/i],
    ['Guardian', /\b(GUARDIAN|PENJAGA)\b/i], ['Grandparent', /\b(GRAND\w*|NENEK|ATUK|DATUK)\b/i], ['Helper', /\b(MAID|HELPER|NANNY|PEMBANTU)\b/i]
  ];
  function parseContacts(text) {
    const out = [];
    String(text || '').split(/\n|;|\/(?=\s*[A-Z])/).forEach(part => {
      const phones = part.match(PHONE_RE); if (!phones) return;
      let label = 'Parent';
      for (const [l, re] of LABELS) if (re.test(part)) { label = l; break; }
      phones.forEach(p => out.push({ label, phone: cleanPhone(p) }));
    });
    return out;
  }
  function cleanAddress(s) {
    // wrapped lines inside one cell continue the same address, so join them with a space
    return titleCase(String(s || '').split('\n').map(squash).filter(Boolean).join(' ').replace(/\s*,\s*/g, ', ').replace(/(,\s*)+/g, ', ').replace(/,\s*$/, ''), true);
  }
  function cleanTime(s) {
    if (typeof s === 'string' && /^\s*0?\.\d+\s*$/.test(s)) s = +s;   // Excel stores 6:35 AM as 0.274…
    if (typeof s === 'number' && s >= 0 && s < 1) { const m = Math.round(s * 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    const m = String(s || '').match(/(\d{1,2})\s*[:.]\s*(\d{2})\s*([AP])?\.?\s*M?\.?/i);
    if (!m) return '';
    let h = +m[1]; const min = m[2], ap = (m[3] || '').toUpperCase();
    if (ap === 'P' && h < 12) h += 12; if (ap === 'A' && h === 12) h = 0;
    if (h > 23 || +min > 59) return '';
    return String(h).padStart(2, '0') + ':' + min;
  }

  /* ---------- heading lines: driver, van, contact, title ---------- */
  function parseHeading(lines) {
    const info = { title: '', driver: '', phone: '', plate: '', school: '', extra: [] };
    let bestSize = 0;
    lines.forEach(l => {
      const text = squash(l.text);
      if (!text) return;
      const kv = text.match(/^([A-Z][A-Z .'/()]{1,30}?)\s*[:：]\s*(.+)$/i);
      if (kv) {
        const k = kv[1].toUpperCase(), v = squash(kv[2]);
        if (/DRIVER|PEMANDU|CAPTAIN/.test(k) && !/(CONTACT|PHONE|TEL|NO\b|NUM)/.test(k)) { info.driver = v; return; }
        if (/(VAN|BUS|VEHICLE|KENDERAAN|PLATE|CAR|REG)/.test(k)) { info.plate = v.toUpperCase(); return; }
        if (/(CONTACT|PHONE|TEL|H\/?P|MOBILE)/.test(k)) { info.phone = firstPhone(v) || v; return; }
        if (/(SCHOOL|SEKOLAH)/.test(k)) { info.school = v; return; }
        if (/(ROUTE|LALUAN|AREA|KAWASAN)/.test(k)) { info.extra.push(text); return; }
        info.extra.push(text); return;
      }
      const size = l.size || 0;
      if (!info.title || size > bestSize + 0.5) { info.title = text; bestSize = size; }
    });
    return info;
  }
  function splitTitle(title) {
    // "DWI EMAS – (BANGSAR)" -> school "Dwi Emas", area "Bangsar"
    const t = squash(title);
    const m = t.match(/^(.*?)\s*[–—\-:]*\s*\(([^)]+)\)\s*$/) || t.match(/^(.*?)\s+[–—\-]\s+(.+)$/);
    if (m) return { school: titleCase(m[1].replace(/[–—\-:\s]+$/, ''), true), area: titleCase(m[2], true) };
    return { school: titleCase(t, true), area: '' };
  }

  /* ---------- rows -> records ---------- */
  function toRecord(cells) {
    const get = k => cells[k] == null ? '' : cells[k];
    const contacts = parseContacts(get('parentPhone'));
    const rec = {
      name: cleanName(get('name')), year: cleanYear(get('year')), studentPhone: firstPhone(get('studentPhone')),
      address: cleanAddress(get('address')), contacts, remark: squash(get('remark')), time: cleanTime(get('time')),
      school: get('school') ? titleCase(get('school'), true) : ''
    };
    if (!rec.time && get('time')) rec.remark = squash(rec.remark + ' ' + get('time'));
    return rec;
  }
  function guessSession(sec, index) {
    const times = sec.rows.map(r => r.time).filter(Boolean);
    if (times.length) return times.every(t => t < '12:00') ? 'AM' : 'PM';
    const txt = sec.rows.map(r => r.remark).join(' ').toUpperCase();
    if (/DISMISS|BALIK|PULANG|AFTERNOON|PETANG|\bPM\b/.test(txt)) return 'PM';
    return index === 0 ? 'AM' : 'PM';
  }
  function finish(heading, sections, warnings) {
    sections = sections.filter(s => s.rows.length);
    sections.forEach((s, i) => { s.session = guessSession(s, i); });
    const ts = splitTitle(heading.title || '');
    return {
      title: heading.title || '', school: heading.school ? titleCase(heading.school, true) : ts.school, area: ts.area,
      driver: { name: heading.driver ? cleanName(heading.driver) : '', phone: heading.phone || '', plate: (heading.plate || '').replace(/\s+/g, ' ').trim() },
      extra: heading.extra, sections, warnings
    };
  }

  /* =========================================================
     A) Grid-based files: Word tables, Excel sheets, CSV.
        Each table: array of rows, each row array of cells {text, cont}
        where cont = this cell is the continuation of a merged cell above.
     ========================================================= */
  function fromGrid(blocks) {
    // blocks: [{type:'line', text, size}] or [{type:'table', rows:[[{text,cont}]]}] in document order
    const heading = [], sections = [], warnings = [];
    let headingDone = false;
    blocks.forEach(b => {
      if (b.type === 'line') { if (!headingDone) heading.push(b); return; }
      // a table may contain heading rows before the column headings (common in Excel)
      let cols = null, cur = null;
      b.rows.forEach(row => {
        const texts = row.map(c => squash(c.text));
        if (isHeaderRow(texts)) {
          cols = texts.map(classify); headingDone = true;
          cur = { rows: [], hasTime: cols.includes('time'), _raw: [] }; sections.push(cur); return;
        }
        if (!cols) { const t = texts.filter(Boolean).join(' '); if (t) heading.push({ text: t }); return; }
        const cells = {}; let anyOwn = false;
        row.forEach((c, i) => { const k = cols[i]; if (!k) return; if (!c.cont && squash(c.text)) anyOwn = true; cells[k] = (cells[k] ? cells[k] + '\n' : '') + (c.raw != null ? c.raw : c.text); });
        if (!anyOwn && !Object.values(cells).some(v => squash(v))) return;
        const nameCell = row[cols.indexOf('name')];
        const continuation = nameCell && (nameCell.cont || !squash(nameCell.text)) && cur._raw.length;
        if (continuation) {
          const prev = cur._raw[cur._raw.length - 1];
          row.forEach((c, i) => { const k = cols[i]; if (!k || c.cont || !squash(c.text)) return; prev[k] = prev[k] ? prev[k] + '\n' + c.text : (c.raw != null ? c.raw : c.text); });
        } else if (nameCell && squash(nameCell.text)) cur._raw.push(cells);
      });
      if (!cols && b.rows.length) warnings.push('A table without recognisable column headings was skipped.');
    });
    sections.forEach(s => { s.rows = s._raw.map(toRecord).filter(r => r.name); delete s._raw; });
    if (!sections.length) warnings.push("Couldn't find a table with column headings like NAME, YEAR, ADDRESS.");
    return finish(parseHeading(heading), sections, warnings);
  }

  /* =========================================================
     B) PDF: only text and positions are available, so rebuild the table from layout.
     items: [{str, x, y (baseline, top-down), w, size, page}]
     ========================================================= */
  function fromPdfItems(items) {
    const warnings = [];
    items = items.filter(i => squash(i.str)).map(i => ({ ...i, y: i.y + (i.page || 0) * 100000 }));
    if (!items.length) return finish({}, [], ["This PDF has no readable text. It's probably a scan or photo. Upload the original Word or Excel file instead, or a PDF saved from it."]);
    // 1. visual lines -> phrases (words close together on the same line)
    items.sort((a, b) => a.y - b.y || a.x - b.x);
    const lines = [];
    items.forEach(it => {
      const l = lines.find(l => Math.abs(l.y - it.y) < Math.max(2, it.size * 0.3));
      if (l) l.items.push(it); else lines.push({ y: it.y, items: [it] });
    });
    const phrasesOf = l => {
      const its = l.items.sort((a, b) => a.x - b.x), out = [];
      its.forEach(it => {
        const last = out[out.length - 1];
        if (last && it.x - last.x1 < Math.max(3, it.size * 0.9)) { last.text += (it.x - last.x1 > it.size * 0.15 ? ' ' : '') + it.str; last.x1 = Math.max(last.x1, it.x + it.w); last.size = Math.max(last.size, it.size); }
        else out.push({ text: it.str, x0: it.x, x1: it.x + it.w, y: l.y, size: it.size });
      });
      out.forEach(p => { p.text = squash(p.text); p.xc = (p.x0 + p.x1) / 2; });
      return out.filter(p => p.text);
    };
    lines.sort((a, b) => a.y - b.y);
    lines.forEach(l => { l.phrases = phrasesOf(l); });

    // 2. header lines (several column headings on one line)
    const headers = [];
    lines.forEach((l, idx) => {
      const keys = l.phrases.map(p => classify(p.text));
      if (new Set(keys.filter(Boolean)).size >= 3 && keys.includes('name')) headers.push({ idx, y: l.y, cols: l.phrases.map((p, i) => ({ key: keys[i], xc: p.xc, x0: p.x0, x1: p.x1 })).filter(c => c.key) });
    });
    if (!headers.length) return finish(parseHeading(lines.map(l => ({ text: l.phrases.map(p => p.text).join(' '), size: Math.max(...l.phrases.map(p => p.size)) }))), [], ["Couldn't find the column headings (NAME, YEAR, ADDRESS…) in this PDF."]);

    // 3. heading text above the first table
    const headingLines = lines.slice(0, headers[0].idx).map(l => ({ text: l.phrases.map(p => p.text).join(' '), size: Math.max(...l.phrases.map(p => p.size)) }));

    // 4. each table
    const sections = headers.map((h, hi) => {
      const cols = h.cols.slice().sort((a, b) => a.xc - b.xc);
      const colAt = x => { for (let i = 0; i < cols.length; i++) { const right = i < cols.length - 1 ? (cols[i].xc + cols[i + 1].xc) / 2 : Infinity; if (x < right) return cols[i].key; } return cols[cols.length - 1].key; };
      const end = hi < headers.length - 1 ? headers[hi + 1].idx : lines.length;
      const body = lines.slice(h.idx + 1, end);
      // phrases -> columns -> blocks of consecutive lines
      const byCol = {};
      body.forEach(l => l.phrases.forEach(p => { const k = colAt(p.xc); (byCol[k] = byCol[k] || []).push(p); }));
      const blocks = {};
      Object.entries(byCol).forEach(([k, ps]) => {
        ps.sort((a, b) => a.y - b.y || a.x0 - b.x0);
        const out = [];
        ps.forEach(p => {
          const last = out[out.length - 1];
          if (last && p.y - last.yLast <= p.size * 1.45 && k !== 'no') { if (Math.abs(p.y - last.yLast) < 1) last.text += ' ' + p.text; else last.text += '\n' + p.text; last.yLast = p.y; }
          else out.push({ text: p.text, yFirst: p.y, yLast: p.y, size: p.size });
        });
        out.forEach(b => { b.yc = (b.yFirst + b.yLast) / 2 - b.size * 0.35; });
        blocks[k] = out;
      });
      // anchors = row numbers, or names if there is no number column
      let anchors = (blocks.no || []).filter(b => /^\d{1,3}\.?\)?$/.test(b.text));
      if (!anchors.length) anchors = blocks.name || [];
      anchors = anchors.slice().sort((a, b) => a.yc - b.yc);
      if (!anchors.length) return { rows: [], hasTime: cols.some(c => c.key === 'time') };
      const ys = anchors.map(a => a.yc), n = ys.length;
      const bound = i => (ys[i] + ys[i + 1]) / 2;
      const top = h.y, bottom = n > 1 ? ys[n - 1] + (ys[n - 1] - bound(n - 2)) * 1.6 + 12 : ys[0] + 40;
      const rowOf = y => { if (y < top || y > bottom) return -1; for (let i = 0; i < n - 1; i++) if (y < bound(i)) return i; return n - 1; };
      const cells = anchors.map(() => ({}));
      const parts = anchors.map(() => ({}));
      const put = (i, k, b) => { (parts[i][k] = parts[i][k] || []).push(b); };
      Object.entries(blocks).forEach(([k, bs]) => {
        if (k === 'no') return;
        const near = [], owned = new Set();
        bs.forEach(b => {
          const i = rowOf(b.yc); if (i < 0) return;
          // close to the line between two rows? then it may be a merged cell shared by both
          let j = -1;
          if (i > 0 && Math.abs(b.yc - bound(i - 1)) < (ys[i] - ys[i - 1]) * 0.2) j = i - 1;
          if (i < n - 1 && Math.abs(b.yc - bound(i)) < (ys[i + 1] - ys[i]) * 0.2) j = i + 1;
          if (j >= 0 && !['name', 'year', 'studentPhone'].includes(k)) near.push({ b, rows: [Math.min(i, j), Math.max(i, j)] });
          else { put(i, k, b); owned.add(i); }
        });
        near.forEach(({ b, rows: [a, c] }) => {
          if (!owned.has(a) && !owned.has(c)) { put(a, k, b); put(c, k, b); }          // merged cell shared by both rows
          else put(Math.abs(b.yc - ys[a]) <= Math.abs(b.yc - ys[c]) ? a : c, k, b);  // otherwise the nearer row
        });
      });
      parts.forEach((row, i) => Object.entries(row).forEach(([k, bs]) => { cells[i][k] = bs.sort((x, y) => x.yc - y.yc).map(x => x.text).join('\n'); }));
      // names may live in the anchor list itself when there is no number column
      if (!(blocks.no || []).length) anchors.forEach((a, i) => { cells[i].name = a.text; });
      return { rows: cells.map(toRecord).filter(r => r.name), hasTime: cols.some(c => c.key === 'time') };
    });
    return finish(parseHeading(headingLines), sections, warnings);
  }

  /* =========================================================
     C) File readers (browser): docx / xlsx with JSZip, csv as text
     ========================================================= */
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  async function readDocx(zip) {
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const body = doc.getElementsByTagNameNS(W, 'body')[0];
    const pText = p => Array.from(p.getElementsByTagNameNS(W, 't')).map(t => t.textContent).join('');
    const blocks = [];
    const kids = el => Array.from(el.children);
    const walk = el => kids(el).forEach(ch => {
      if (ch.localName === 'p') { const t = pText(ch); if (squash(t)) blocks.push({ type: 'line', text: t }); }
      else if (ch.localName === 'tbl') {
        const rows = [], above = [];
        kids(ch).filter(r => r.localName === 'tr').forEach(tr => {
          const row = []; let col = 0;
          kids(tr).filter(c => c.localName === 'tc').forEach(tc => {
            const pr = kids(tc).find(x => x.localName === 'tcPr');
            const span = +(pr && Array.from(pr.children).find(x => x.localName === 'gridSpan')?.getAttributeNS(W, 'val')) || 1;
            const vm = pr && Array.from(pr.children).find(x => x.localName === 'vMerge');
            const cont = !!vm && (vm.getAttributeNS(W, 'val') || 'continue') !== 'restart';
            const text = kids(tc).filter(x => x.localName === 'p').map(pText).join('\n');
            for (let s = 0; s < span; s++) {
              const c = cont ? { text: (above[col] || {}).text || '', cont: true } : { text: s ? '' : text, cont: s > 0 };
              row[col] = c; above[col] = cont ? above[col] : c; col++;
            }
          });
          rows.push(row);
        });
        blocks.push({ type: 'table', rows });
      } else if (ch.children && ch.children.length) walk(ch);
    });
    walk(body);
    return fromGrid(blocks);
  }
  function colIndex(ref) { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }
  async function readXlsx(zip) {
    const parse = s => new DOMParser().parseFromString(s, 'application/xml');
    const shared = zip.file('xl/sharedStrings.xml') ? Array.from(parse(await zip.file('xl/sharedStrings.xml').async('string')).getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).map(t => t.textContent).join('')) : [];
    const sheetName = Object.keys(zip.files).filter(f => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))[0];
    const sheet = parse(await zip.file(sheetName).async('string'));
    const grid = [];
    Array.from(sheet.getElementsByTagName('c')).forEach(c => {
      const ref = c.getAttribute('r'), r = +ref.replace(/[A-Z]+/g, '') - 1, k = colIndex(ref), t = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent;
      let text = '', raw = null;
      if (t === 's') text = shared[+v] || '';
      else if (t === 'inlineStr') text = Array.from(c.getElementsByTagName('t')).map(x => x.textContent).join('');
      else if (v != null) { text = v; if (!isNaN(+v)) raw = +v; }
      (grid[r] = grid[r] || [])[k] = { text, cont: false, raw: raw != null && raw < 1 && raw > 0 ? raw : null };
    });
    Array.from(sheet.getElementsByTagName('mergeCell')).forEach(m => {
      const [a, b] = m.getAttribute('ref').split(':'); if (!b) return;
      const r0 = +a.replace(/[A-Z]+/g, '') - 1, r1 = +b.replace(/[A-Z]+/g, '') - 1, c0 = colIndex(a), c1 = colIndex(b);
      const src = (grid[r0] || [])[c0] || { text: '' };
      for (let r = r0; r <= r1; r++) for (let k = c0; k <= c1; k++) { if (r === r0 && k === c0) continue; (grid[r] = grid[r] || [])[k] = { text: k === c0 ? src.text : '', raw: src.raw, cont: true }; }
    });
    const rows = [];
    for (let r = 0; r < grid.length; r++) { const row = grid[r] || []; const w = row.length; const out = []; for (let k = 0; k < w; k++) out.push(row[k] || { text: '', cont: false }); rows.push(out); }
    return fromGrid([{ type: 'table', rows }]);
  }
  function readCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    // in CSV an empty cell under a filled one in name/address/time usually means "same as above" only for address/time; keep empty
    return fromGrid([{ type: 'table', rows: rows.map(r => r.map(t => ({ text: t, cont: false }))) }]);
  }
  async function readPdf(pdfjs, data) {
    const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
    const items = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p), vp = page.getViewport({ scale: 1 }), tc = await page.getTextContent();
      tc.items.forEach(it => {
        if (!it.str) return;
        const m = pdfjs.Util.transform(vp.transform, it.transform);
        items.push({ str: it.str, x: m[4], y: m[5], w: it.width, size: Math.hypot(m[2], m[3]) || 10, page: p - 1 });
      });
    }
    return fromPdfItems(items);
  }

  g.ListParser = { fromPdfItems, fromGrid, readDocx, readXlsx, readCsv, readPdf, parseContacts, cleanTime, cleanYear, cleanName, classify };
})(typeof window !== 'undefined' ? window : globalThis);
