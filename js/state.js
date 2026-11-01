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
  mode: 'v',
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
  drawerOpen: true,
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
  codeEdits: {}
};

let hist = [];
let fut = [];
let uid = 100;
let drag = null;
let storageSaveFailed = false;

const get = id => S.blocks.find(b => b.id == id);

function syncCurPage() {
  if (!S.pages[S.curPage]) S.curPage = Object.keys(S.pages)[0] || 'index.html';
  S.blocks = S.pages[S.curPage].blocks;
  R = Math.max(12, ...S.blocks.map(b => b.r + b.h - 1));
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
      if (d.gridGap !== undefined) S.gridGap = d.gridGap;
      if (d.gridRowH !== undefined) S.gridRowH = d.gridRowH;
      if (d.theme) S.theme = d.theme;
      if (d.railTab) S.railTab = d.railTab;
      if (d.drawerOpen !== undefined) S.drawerOpen = d.drawerOpen;
      if (d.sideTab) S.sideTab = d.sideTab;
      if (d.viewport) S.viewport = d.viewport;
      if (d.responsiveCSS !== undefined) S.responsiveCSS = d.responsiveCSS;
      if (d.htmlMode) S.htmlMode = d.htmlMode;
      if (d.codeEdits && typeof d.codeEdits === 'object') S.codeEdits = d.codeEdits;
    }
  } catch (e) {}
  const fontMigration = {
    "'Plus Jakarta Sans', sans-serif": "'Inter', sans-serif",
    "'Poppins', sans-serif": "'Inter', sans-serif",
    "'Outfit', sans-serif": "'Inter', sans-serif",
    "'Caveat', cursive": "'Inter', sans-serif",
    "'DM Mono', monospace": "'JetBrains Mono', monospace"
  };
  Object.values(S.pages).forEach(page => (page.blocks || []).forEach(block => {
    if (fontMigration[block.font]) block.font = fontMigration[block.font];
  }));
  syncCurPage();
  uid = Math.max(100, ...Object.values(S.pages).flatMap(p => p.blocks.map(b => +b.id || 0))) + 1;
}

const save = () => {
  try {
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    localStorage.setItem('bcs_v2', JSON.stringify({
      pages: S.pages,
      curPage: S.curPage,
      n: S.name,
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
      codeEdits: S.codeEdits || {}
    }));
    storageSaveFailed = false;
  } catch (e) {
    if (!storageSaveFailed) {
      storageSaveFailed = true;
      toast('Perubahan belum dapat disimpan. Ruang simpanan pelayar mungkin penuh.');
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

const snap = () => {
  hist.push(JSON.stringify(S.blocks));
  fut = [];
  if (hist.length > 60) hist.shift();
};

function undo() {
  if (!hist.length) return toast('Nothing more to undo');
  fut.push(JSON.stringify(S.blocks));
  S.blocks = JSON.parse(hist.pop());
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  if (!get(S.sel)) S.sel = null;
  render();
}

function redo() {
  if (!fut.length) return toast('Nothing more to redo');
  hist.push(JSON.stringify(S.blocks));
  S.blocks = JSON.parse(fut.pop());
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  if (!get(S.sel)) S.sel = null;
  render();
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
  let m = '';
  if (top && t == 'header' && b.r > 2) m = 'Headers typically sit at the very top of the page.';
  else if (top && t == 'footer' && b.r + b.h < R) m = 'Footers typically sit at the very bottom of the page.';
  else if (top && t == 'nav' && b.r > 2) m = 'Navigation is usually at the top, inside or immediately beneath the header.';
  else if (top && t == 'logo') m = 'Logos typically sit inside navigation or header.';
  else if (b.type == 'image' && par(b) && par(b).type == 'hero') m = 'Great! Image placed inside Hero (Split Hero layout).';
  if (m) toast(m);
}

function mk(type, c, r, w, h) {
  const T = TY[type];
  const block = { id: String(uid++), type, c, r, w, h, t: T.t, f: T.f };
  if (type === 'link') {
    block.href = '#';
    block.col = '#315f9c';
    block.td = 'underline';
  } else if (type === 'button' || type === 'logo') {
    block.href = '#';
  }
  return block;
}

function add(type, c, r) {
  const T = TY[type];
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
    for (const [w, h] of [[T.w, T.h], [Math.max(1, T.w >> 1), Math.max(1, T.h >> 1)], [2, 2], [1, 1]]) {
      for (let rr = 1; rr <= R && !b; rr++) {
        for (let cc = 1; cc <= 12 && !b; cc++) {
          if (free(cc, rr, w, h, 0, 0)) b = mk(type, cc, rr, w, h);
        }
      }
      if (b) break;
    }
  }
  if (!b) {
    // Auto-extend canvas downwards
    R += 4;
    for (let rr = R - 3; rr <= R && !b; rr++) {
      for (let cc = 1; cc <= 12 && !b; cc++) {
        if (free(cc, rr, T.w, T.h, 0, 0)) b = mk(type, cc, rr, T.w, T.h);
      }
    }
  }
  if (!b) return toast('Please place the element in an empty area.');
  snap();
  S.blocks.push(b);
  S.sel = b.id;
  if (b.r + b.h - 1 > R - 2) R = Math.max(R, b.r + b.h + 2);
  render();
  hint(b);
}

function applyTpl(i) {
  snap();
  S.blocks = TP[i][1].map(a => mk(a[0], a[1], a[2], a[3], a[4]));
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  R = Math.max(12, ...S.blocks.map(b => b.r + b.h - 1));
  S.sel = null;
  render();
  toast('Template "' + TP[i][0] + '" applied. Press Ctrl+Z to undo.');
}

function sorted() {
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
  if (!target) return toast('Please select an element first to delete.');
  snap();
  S.blocks = S.blocks.filter(b => b.id != target);
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  if (S.sel == target) S.sel = null;
  render();
  toast('Element deleted. Press Ctrl+Z to undo.');
}

function deleteSelected(id) {
  deleteBox(id);
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
  toast(`Component "${TY[childType].n}" added into <${TY[p.type].tag}>.`);
}
