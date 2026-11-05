/**
 * NIAN CODE STUDIO - State Management & Core Logic (state.js)
 * Manages blocks, multi-page state, nested hierarchies, undo/redo history, and local persistence.
 */

const S = {
  pages: JSON.parse(JSON.stringify(DEFAULT_PAGES)),
  curPage: 'index.html',
  extLinks: [
    { id: 'ext-wa', title: 'Official WhatsApp', url: 'https://wa.me/60123456789' },
    { id: 'ext-map', title: 'Google Maps Location', url: 'https://maps.google.com' }
  ],
  blocks: [],
  sel: null,
  mode: 's',
  view: 'plan',
  sty: 'ext',
  tab: 'html',
  name: '',
  tool: 'r',
  hasCss: true,
  hasJs: true,
  previewScripts: false,
  cssHighlight: true,
  folded: {},
  railTab: 'elem',
  drawerOpen: typeof window !== 'undefined' && window.innerWidth <= 768 ? false : true,
  sideTab: 'html',
  rightTab: 'inspector',
  viewport: 'desktop',
  responsiveCSS: false,
  htmlMode: 'semantic',
  selNavIdx: null,
  selNavTitle: null,
  gridGap: 8,
  gridRowH: 40,
  theme: { primary: '#00d4ff', bg: '#ffffff', text: '#12203f' },
  codeMode: 'view',
  codeEdits: {},
  lang: 'en'
};

let hist = [];
let fut = [];
const pageHist = {};
const pageFut = {};
let activeHistPage = 'index.html';
let uid = 100;
let drag = null;
let storageSaveFailed = false;

const LEGACY_BLOCK_TYPE_MAP = {
  box: 'section',
  container: 'section',
  div: 'section',
  main: 'section',
  heading: 'header',
  h1: 'header',
  h2: 'section',
  h3: 'section',
  paragraph: 'text',
  p: 'text',
  span: 'text',
  img: 'image',
  figure: 'image',
  picture: 'image',
  btn: 'button',
  cta: 'button',
  a: 'link',
  details: 'dropdown',
  select: 'dropdown',
  article: 'card'
};

function normalizeBlockType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (TY[raw]) return raw;
  if (LEGACY_BLOCK_TYPE_MAP[raw] && TY[LEGACY_BLOCK_TYPE_MAP[raw]]) {
    return LEGACY_BLOCK_TYPE_MAP[raw];
  }
  return 'text';
}

function sanitizePageBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter(b => b && typeof b === 'object')
    .map((b, idx) => {
      const safeType = normalizeBlockType(b.type);
      const T = TY[safeType] || TY.text;
      b.type = safeType;
      if (!b.id) b.id = String(Date.now() + idx);
      b.c = cl(Number(b.c) || 1, 1, 12);
      b.r = Math.max(1, Number(b.r) || 1);
      b.w = cl(Number(b.w) || T.w || 4, 1, 13 - b.c);
      b.h = Math.max(1, Number(b.h) || T.h || 2);
      if (b.t === undefined || b.t === null) b.t = T.t || '';
      else b.t = String(b.t);
      if (b.f === undefined || b.f === null) b.f = T.f !== undefined ? T.f : 0;
      return b;
    });
}

const get = id => S.blocks.find(b => b && b.id == id);

function syncCurPage() {
  if (activeHistPage) {
    pageHist[activeHistPage] = hist;
    pageFut[activeHistPage] = fut;
  }
  if (!S.pages[S.curPage]) S.curPage = Object.keys(S.pages)[0] || 'index.html';
  activeHistPage = S.curPage;
  hist = pageHist[S.curPage] || (pageHist[S.curPage] = []);
  fut = pageFut[S.curPage] || (pageFut[S.curPage] = []);
  S.pages[S.curPage].blocks = sanitizePageBlocks(S.pages[S.curPage].blocks);
  S.blocks = S.pages[S.curPage].blocks;
  R = Math.max(12, ...S.blocks.map(b => b.r + b.h - 1));
}

function syncLanguageDefaults(lang) {
  const isEn = lang === 'en';
  Object.keys(S.pages || {}).forEach(pageKey => {
    const page = S.pages[pageKey];
    if (!page) return;
    const defPage = DEFAULT_PAGES[pageKey];
    if (defPage) {
      if (isEn && page.name === defPage.nameMs) page.name = defPage.name;
      else if (!isEn && page.name === defPage.name) page.name = defPage.nameMs || defPage.name;
    }
    (page.blocks || []).forEach(b => {
      const T = TY[b.type];
      if (T) {
        if (isEn && T.tMs && b.t === T.tMs) b.t = T.t;
        else if (!isEn && T.tMs && b.t === T.t) b.t = T.tMs;
      }
      if (b.type === 'form') {
        const msFields = 'Nama Penuh, Alamat Emel, Mesej Anda';
        const enFields = 'Full Name, Email Address, Your Message';
        if (isEn && Array.isArray(b.fields) && b.fields.join(', ') === msFields) {
          b.fields = ['Full Name', 'Email Address', 'Your Message'];
        } else if (!isEn && Array.isArray(b.fields) && b.fields.join(', ') === enFields) {
          b.fields = ['Nama Penuh', 'Alamat Emel', 'Mesej Anda'];
        }
        if (isEn && b.submitText === 'Hantar Mesej') b.submitText = 'Send Message';
        else if (!isEn && b.submitText === 'Send Message') b.submitText = 'Hantar Mesej';
      }
      if (b.type === 'dropdown' && Array.isArray(b.items)) {
        if (isEn && b.items.join(',') === 'Pilihan 1,Pilihan 2,Pilihan 3') {
          b.items = ['Option 1', 'Option 2', 'Option 3'];
        } else if (!isEn && b.items.join(',') === 'Option 1,Option 2,Option 3') {
          b.items = ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
        }
      }
    });
  });
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem('bcs_v2') || 'null');
    if (d && d.pages) {
      S.pages = d.pages;
      S.curPage = d.curPage || 'index.html';
      S.name = d.n || '';
      S.sty = d.sty || 'ext';
      S.hasCss = d.css !== undefined ? d.css : true;
      S.hasJs = d.js !== undefined ? d.js : true;
      S.previewScripts = d.previewScripts === true;
      S.extLinks = d.ext || S.extLinks;
      if (d.mode && ['c', 's', 'v'].includes(d.mode)) S.mode = d.mode;
      if (d.gridGap !== undefined) S.gridGap = d.gridGap;
      if (d.gridRowH !== undefined) S.gridRowH = d.gridRowH;
      if (d.theme) S.theme = d.theme;
      if (d.railTab) S.railTab = d.railTab;
      if (d.drawerOpen !== undefined) {
        S.drawerOpen = (typeof window !== 'undefined' && window.innerWidth <= 768) ? false : d.drawerOpen;
      }
      if (d.sideTab) S.sideTab = d.sideTab;
      if (d.viewport) S.viewport = d.viewport;
      if (d.responsiveCSS !== undefined) S.responsiveCSS = d.responsiveCSS;
      if (d.codeEdits && typeof d.codeEdits === 'object') S.codeEdits = d.codeEdits;
      if (d.lang === 'en' || d.lang === 'ms') S.lang = d.lang;
      if (!localStorage.getItem('bcs_default_en_v4')) {
        S.lang = 'en';
        S.mode = 's';
        localStorage.setItem('bcs_default_en_v4', '1');
      }
      if (!localStorage.getItem('bcs_clean_dw_v6')) {
        S.codeEdits = {};
        localStorage.setItem('bcs_clean_dw_v6', '1');
      }
    }
  } catch (e) {}
  // Upgrade default contact.html if it still has the old placeholder without a form block
  if (S.pages['contact.html'] && Array.isArray(S.pages['contact.html'].blocks)) {
    const cBlocks = S.pages['contact.html'].blocks;
    const hasForm = cBlocks.some(b => b.type === 'form');
    if (!hasForm && cBlocks.length === 4 && cBlocks[2] && cBlocks[2].t === 'Emel: info@laman.my | Tel: 03-12345678') {
      S.pages['contact.html'].blocks = JSON.parse(JSON.stringify(DEFAULT_PAGES['contact.html'].blocks));
    }
  }
  const fontMigration = {
    "'Plus Jakarta Sans', sans-serif": "'Inter', sans-serif",
    "'Poppins', sans-serif": "'Inter', sans-serif",
    "'Outfit', sans-serif": "'Inter', sans-serif",
    "'Caveat', cursive": "'Inter', sans-serif",
    "'DM Mono', monospace": "'JetBrains Mono', monospace"
  };
  Object.values(S.pages).forEach(page => {
    if (!page) return;
    page.blocks = sanitizePageBlocks(page.blocks);
    page.blocks.forEach(block => {
      if (fontMigration[block.font]) block.font = fontMigration[block.font];
    });
  });
  syncLanguageDefaults(S.lang);
  syncCurPage();
  uid = Math.max(100, ...Object.values(S.pages).flatMap(p => (p && Array.isArray(p.blocks) ? p.blocks : []).map(b => +b.id || 0))) + 1;
}

const save = () => {
  try {
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    localStorage.setItem('bcs_v2', JSON.stringify({
      pages: S.pages,
      curPage: S.curPage,
      n: S.name,
      mode: S.mode,
      sty: S.sty,
      css: S.hasCss,
      js: S.hasJs,
      previewScripts: S.previewScripts,
      ext: S.extLinks,
      gridGap: S.gridGap,
      gridRowH: S.gridRowH,
      theme: S.theme,
      railTab: S.railTab,
      drawerOpen: S.drawerOpen,
      sideTab: S.sideTab,
      viewport: S.viewport,
      responsiveCSS: S.responsiveCSS,
      htmlMode: S.htmlMode,
      codeEdits: S.codeEdits || {},
      lang: S.lang || 'en'
    }));
    storageSaveFailed = false;
  } catch (e) {
    if (!storageSaveFailed) {
      storageSaveFailed = true;
      toast(S.lang === 'en' ? 'Changes could not be saved. Browser storage may be full.' : 'Perubahan belum dapat disimpan. Ruang simpanan pelayar mungkin penuh.');
    }
  }
};

function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toast.k);
  toast.k = setTimeout(() => t.classList.remove('on'), 2600);
}

function createPageSnapshot() {
  const curEdits = (S.codeEdits && S.codeEdits[S.curPage]) ? S.codeEdits[S.curPage] : {};
  return JSON.stringify({
    page: S.curPage,
    blocks: S.blocks,
    codeEdits: curEdits,
    theme: S.theme,
    gridGap: S.gridGap,
    gridRowH: S.gridRowH,
    htmlMode: S.htmlMode,
    sty: S.sty
  });
}

function applyPageSnapshot(raw) {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    S.blocks = sanitizePageBlocks(parsed);
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    return;
  }
  if (parsed && Array.isArray(parsed.blocks)) {
    S.blocks = sanitizePageBlocks(parsed.blocks);
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    S.codeEdits = S.codeEdits || {};
    if (parsed.codeEdits && Object.keys(parsed.codeEdits).length > 0) {
      S.codeEdits[S.curPage] = parsed.codeEdits;
    } else {
      delete S.codeEdits[S.curPage];
    }
    if (parsed.theme) S.theme = parsed.theme;
    if (parsed.gridGap !== undefined) S.gridGap = parsed.gridGap;
    if (parsed.gridRowH !== undefined) S.gridRowH = parsed.gridRowH;
    if (parsed.htmlMode) S.htmlMode = parsed.htmlMode;
    if (parsed.sty) S.sty = parsed.sty;
  }
}

const snap = () => {
  if (activeHistPage !== S.curPage) syncCurPage();
  hist.push(createPageSnapshot());
  fut = [];
  pageHist[S.curPage] = hist;
  pageFut[S.curPage] = fut;
  if (hist.length > 60) hist.shift();
};

function undo() {
  if (activeHistPage !== S.curPage) syncCurPage();
  if (!hist.length) return toast(S.lang === 'en' ? 'Nothing more to undo on this page' : 'Tiada lagi perubahan untuk dibuat asal pada halaman ini');
  fut.push(createPageSnapshot());
  applyPageSnapshot(hist.pop());
  if (!get(S.sel)) S.sel = null;
  render();
}

function redo() {
  if (activeHistPage !== S.curPage) syncCurPage();
  if (!fut.length) return toast(S.lang === 'en' ? 'Nothing more to redo on this page' : 'Tiada lagi perubahan untuk dibuat semula pada halaman ini');
  hist.push(createPageSnapshot());
  applyPageSnapshot(fut.pop());
  if (!get(S.sel)) S.sel = null;
  render();
}

function compressImageFileToDataUrl(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (file.type === 'image/svg+xml' || dataUrl.length < 90000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width || 800;
          let h = img.naturalHeight || img.height || 600;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const outMime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
          const compressed = canvas.toDataURL(outMime, quality);
          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } catch (_) {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const inb = (a, b) => a.c >= b.c && a.r >= b.r && a.c + a.w <= b.c + b.w && a.r + a.h <= b.r + b.h && (a.w < b.w || a.h < b.h);
const par = k => S.blocks.filter(o => o !== k && inb(k, o)).sort((a, b) => a.w * a.h - b.w * b.h)[0] || null;
const kids = b => S.blocks.filter(k => par(k) === b).sort((a, b) => a.r - b.r || a.c - b.c);
const dep = b => {
  let d = 0;
  let p = par(b);
  while (p) {
    d++;
    p = par(p);
  }
  return d;
};
const sl = () => S.hasJs && S.blocks.some(b => b.type == 'slider');

const free = (c, r, w, h, ig, st) => {
  const n = { c, r, w, h };
  const ni = [].concat(ig || []);
  // Auto-fluid: no downward boundary (r >= 1), columns restricted 1 to 12
  return c >= 1 && r >= 1 && c + w <= 13 && !S.blocks.some(o => !ni.includes(o.id) && c < o.c + o.w && o.c < c + w && r < o.r + o.h && o.r < r + h && (st || !inb(n, o) && !inb(o, n)));
};

function hint(b) {
  const t = b.type;
  const top = !par(b);
  const en = S.lang === 'en';
  let m = '';
  if (top && t == 'header' && b.r > 2) m = en ? 'Headers typically sit at the very top of the page.' : 'Kepala halaman (<header>) biasanya diletakkan di baris paling atas.';
  else if (top && t == 'footer' && b.r + b.h < R) m = en ? 'Footers typically sit at the very bottom of the page.' : 'Kaki halaman (<footer>) biasanya diletakkan di bahagian paling bawah.';
  else if (top && t == 'nav' && b.r > 2) m = en ? 'Navigation is usually at the top, inside or beneath the header.' : 'Menu navigasi (<nav>) biasanya berada di bahagian atas halaman.';
  else if (top && t == 'logo') m = en ? 'Logos typically sit inside navigation or header.' : 'Logo biasanya diletakkan di dalam bar navigasi atau kepala halaman.';
  else if (b.type == 'image' && par(b) && par(b).type == 'hero') m = en ? 'Great! Image placed inside Hero (Split Hero layout).' : 'Bagus! Gambar diletakkan di dalam Hero (Susun atur Split Hero).';
  else if (b.type == 'form') m = en ? 'Contact Form (<form>) added! Customize form fields in the Inspector.' : 'Borang Hubungan (<form>) ditambah! Ubah suai medan borang di panel Tetapan.';
  if (m) toast(m);
}

function mk(type, c, r, w, h) {
  const safeType = normalizeBlockType(type);
  const T = TY[safeType] || TY.text;
  const isEn = S.lang === 'en';
  const defaultText = (isEn ? (T.enText || T.t) : (T.tMs || T.t)) || T.t;
  const block = { id: String(uid++), type: safeType, c, r, w, h, t: defaultText, f: T.f };
  if (safeType === 'link') {
    block.href = '#';
    block.col = '#315f9c';
    block.td = 'underline';
  } else if (safeType === 'button' || safeType === 'logo') {
    block.href = '#';
  } else if (safeType === 'form') {
    block.fields = isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda'];
    block.submitText = isEn ? 'Send Message' : 'Hantar Mesej';
  }
  return block;
}

function add(type, c, r) {
  const safeType = normalizeBlockType(type);
  const T = TY[safeType] || TY.text;
  type = safeType;
  let b = null;
  if (c && r) {
    const container = S.blocks.filter(o => c >= o.c && c < o.c + o.w && r >= o.r && r < o.r + o.h).sort((x, y) => x.w * x.h - y.w * y.h)[0];
    if (container) {
      const fitW = Math.max(1, Math.min(T.w, container.w));
      const fitH = Math.max(1, Math.min(T.h, container.h));
      const fitC = cl(c, container.c, container.c + container.w - fitW);
      const fitR = cl(r, container.r, container.r + container.h - fitH);
      if (free(fitC, fitR, fitW, fitH)) b = mk(type, fitC, fitR, fitW, fitH);
      else {
        for (let rr = container.r; rr <= container.r + container.h - fitH && !b; rr++) {
          for (let cc = container.c; cc <= container.c + container.w - fitW && !b; cc++) {
            if (free(cc, rr, fitW, fitH)) {
              b = mk(type, cc, rr, fitW, fitH);
              break;
            }
          }
        }
      }
    } else {
      if (free(c, r, T.w, T.h)) b = mk(type, c, r, T.w, T.h);
    }
  }
  if (!b) {
    const topFooters = type !== 'footer'
      ? S.blocks.filter(o => o.type === 'footer' && !par(o))
      : [];
    const footerStartRow = topFooters.length
      ? Math.min(...topFooters.map(o => o.r || 12))
      : null;
    const maxSearchRow = footerStartRow !== null ? Math.max(1, footerStartRow - T.h) : R;

    // Prefer full-size strict placement above footer (never cramming a new block inside an existing container)
    for (let rr = 1; rr <= maxSearchRow && !b; rr++) {
      for (let cc = 1; cc <= 12 - T.w + 1 && !b; cc++) {
        if (free(cc, rr, T.w, T.h, 0, 1)) b = mk(type, cc, rr, T.w, T.h);
      }
    }

    if (!b && footerStartRow !== null) {
      // Insert cleanly right above the footer and push the footer down by T.h rows
      const insertR = footerStartRow;
      S.blocks.forEach(o => {
        if ((o.r || 1) >= insertR) {
          o.r = (o.r || 1) + T.h;
        }
      });
      const maxRowAfterShift = S.blocks.reduce((maxR, o) => Math.max(maxR, (o.r || 1) + (o.h || 1)), insertR + T.h);
      R = Math.max(R, maxRowAfterShift + 1);
      b = mk(type, 1, insertR, T.w, T.h);
    }
  }
  if (!b) {
    // Auto-extend canvas downwards right below the lowest existing block
    const maxExistingRow = S.blocks.reduce((maxR, o) => Math.max(maxR, (o.r || 1) + (o.h || 1)), 1);
    const targetR = Math.max(1, maxExistingRow);
    R = Math.max(R, targetR + T.h + 2);
    b = mk(type, 1, targetR, T.w, T.h);
  }
  snap();
  if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
  S.blocks.push(b);
  S.sel = b.id;
  if (b.r + b.h - 1 > R - 2) R = Math.max(R, b.r + b.h + 2);
  render();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      const blkEl = document.querySelector(`#cv .blk[data-id="${b.id}"]`);
      if (blkEl && typeof blkEl.scrollIntoView === 'function') {
        blkEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const lnEl = document.querySelector(`#src .ln[data-id="${b.id}"]`);
      if (lnEl && typeof lnEl.scrollIntoView === 'function') {
        lnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  hint(b);
}

function applyTpl(i) {
  snap();
  if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
  S.blocks = TP[i][1].map(a => mk(a[0], a[1], a[2], a[3], a[4]));
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  R = Math.max(12, ...S.blocks.map(b => b.r + b.h - 1));
  S.sel = null;
  render();
  toast(S.lang === 'en' ? `Template "${TP[i][0]}" applied. Press Ctrl+Z to undo.` : `Templat "${TP[i][0]}" diterapkan. Tekan Ctrl+Z untuk buat asal.`);
}

function sorted() {
  S.blocks = sanitizePageBlocks(S.blocks);
  if (S.pages && S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  const bs = [...S.blocks].sort((a, b) => a.r - b.r || a.c - b.c);
  const tot = {};
  const n = {};
  bs.forEach(b => tot[b.type] = (tot[b.type] || 0) + 1);
  bs.forEach(b => {
    n[b.type] = (n[b.type] || 0) + 1;
    b.cls = b.type + (tot[b.type] > 1 ? '-' + n[b.type] : '');
  });
  return bs;
}

function deleteBox(id) {
  const target = id || S.sel;
  if (!target) return toast(S.lang === 'en' ? 'Please select an element first to delete.' : 'Sila pilih elemen terlebih dahulu untuk dipadam.');
  snap();
  S.blocks = S.blocks.filter(b => b.id != target);
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  if (S.sel == target) S.sel = null;
  render();
  toast(S.lang === 'en' ? 'Element deleted. Press Ctrl+Z to undo.' : 'Elemen dipadam. Tekan Ctrl+Z untuk buat asal.');
}

function deleteSelected(id) {
  deleteBox(id);
}

function clearCanvas() {
  snap();
  S.blocks = [];
  if (S.pages[S.curPage]) {
    S.pages[S.curPage].blocks = S.blocks;
    if (S.pages[S.curPage].title === undefined) {
      S.pages[S.curPage].title = ' Your Page Title';
    }
  }
  if (S.codeEdits && S.codeEdits[S.curPage]) {
    delete S.codeEdits[S.curPage].html;
  }
  R = 12;
  S.sel = null;
  S.tool = 'r';
  render();
  const textarea = document.querySelector('#code-textarea');
  if (textarea && S.tab === 'html') {
    textarea.value = htmlLines().map(l => l.s).join('\n');
  }
  toast(S.lang === 'en'
    ? '📄 Canvas cleared to basic HTML structure. Draw boxes on the grid to generate code! (Ctrl+Z to undo)'
    : '📄 Kanvas dikosongkan ke struktur asas HTML. Lukis kotak pada grid untuk menjana kod! (Ctrl+Z untuk buat asal)');
}

function addChildToBlock(parentId, childType) {
  const p = get(parentId);
  if (!p) return;
  const T = TY[childType] || { w: 3, h: 1, t: childType };
  const fitW = Math.max(1, Math.min(T.w, p.w));
  const fitH = Math.max(1, Math.min(T.h, p.h));
  
  let placed = false;
  for (let rr = p.r; rr <= p.r + p.h - fitH; rr++) {
    for (let cc = p.c; cc <= p.c + p.w - fitW; cc++) {
      if (free(cc, rr, fitW, fitH, [], false)) {
        snap();
        const b = mk(childType, cc, rr, fitW, fitH);
        S.blocks.push(b);
        S.sel = b.id;
        placed = true;
        break;
      }
    }
    if (placed) break;
  }
  if (!placed) {
    snap();
    const b = mk(childType, p.c, p.r, fitW, fitH);
    S.blocks.push(b);
    S.sel = b.id;
  }
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  render();
  const isEn = S.lang === 'en';
  const childT = TY[childType] || TY.text;
  const parentT = TY[p.type] || TY.section;
  const childLabel = isEn ? (childT.en || childT.n) : childT.n;
  toast(isEn
    ? `Component "${childLabel}" added inside <${parentT.tag}>.`
    : `Komponen "${childLabel}" ditambah ke dalam <${parentT.tag}>.`);
}
