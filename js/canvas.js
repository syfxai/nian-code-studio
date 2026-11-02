/**
 * NIAN CODE STUDIO - Interaksi Kanvas & Grid (canvas.js)
 * Menguruskan lukisan grid 12-kolum, 8-arah pemegang saiz (resize handles), gerak elemen (drag & drop),
 * dan suntingan teks secara langsung (inline editing).
 */

const cv = $('#cv');
let pend = null;

function renderCanvas() {
  R = getAutoRows();
  cv.classList.toggle('dr', S.tool == 'r');
  cv.classList.toggle('no-css', !S.hasCss);
  cv.style.setProperty('--rows', R);
  if ($('#grid-dim')) {
    $('#grid-dim').textContent = !S.hasCss ? '📄 Mod Asas HTML (CSS Dimatikan): Aliran Menegak Asas' : `🏠 Kanvas <main>: 12 kol × ${R} baris (Auto-Fluid)`;
  }
  if (typeof hasCodePreviewOverride === 'function' && hasCodePreviewOverride()) {
    cv.classList.add('code-source-preview');
    cv.innerHTML = '<iframe class="code-source-frame" sandbox="allow-same-origin" title="Kanvas visual boleh sunting"></iframe><span class="code-source-label">Garis putus-putus = kotak &lt;div&gt; · klik untuk sunting</span>';
    const frame = cv.querySelector('.code-source-frame');
    if (frame) { attachCodeCanvasEditing(frame); frame.srcdoc = codePreviewDocument(); }
    if ($('#grid-dim')) $('#grid-dim').textContent = 'Klik elemen untuk sunting · perubahan disegerakkan ke kod';
    return;
  }
  cv.classList.remove('code-source-preview');
  sorted();

  cv.innerHTML = S.blocks.map(b => {
    const on = b.id == S.sel;
    const T = TY[b.type];
    const bColor = b.f === 'none' ? 'transparent' : (typeof b.f === 'number' ? (FILLS[b.f] || '#ffffff') : (b.f || '#ffffff'));
    const dotColor = b.f === 'none' ? '#00d4ff' : bColor;
    const gradientColor = typeof bColor === 'string' && /^(?:linear|radial|conic)-gradient\(/i.test(bColor);
    const sampledColor = gradientColor ? (bColor.match(/#[\da-f]{6}/i)?.[0] || '#ffffff') : bColor;
    const isDark = isColorDark(sampledColor);
    const fs = b.fs || (b.type == 'header' ? 20 : ['hero', 'section', 'card'].includes(b.type) ? 16 : 13);
    const ta = b.ta || 'left';
    const fontFam = b.font || "'Inter', sans-serif";
    // Kanvas kertas putih menggunakan teks gelap secara lalai; warna pilihan pengguna kekal dihormati.
    const colStyle = b.col ? `color:${b.col};` : isDark ? 'color:#ffffff;text-shadow:0 1px 2px rgba(0,0,0,0.55);' : 'color:#12203f;';
    const fwStyle = b.fw === 'bold' ? 'font-weight:700;' : Number.isFinite(Number(b.fw)) && b.fw !== undefined && b.fw !== null && b.fw !== '' ? `font-weight:${Number(b.fw)};` : '';
    const fstStyle = b.fst == 'italic' ? 'font-style:italic;' : '';
    const tdStyle = b.td && b.td != 'none' ? `text-decoration:${b.td};` : '';
    const ttStyle = b.tt && b.tt != 'none' ? `text-transform:${b.tt};` : '';
    const padStyle = b.pad !== undefined ? `padding:${b.pad}px;` : '';
    const radStyle = b.rad ? `border-radius:${b.rad == 999 ? '9999px' : b.rad + 'px'};` : '';
    const bwStyle = b.bw ? `border:${b.bw}px ${b.bs || 'solid'} ${b.bc || 'rgba(255,255,255,0.25)'};` : '';
    const shdStyle = b.shd && b.shd != 'none' ? `box-shadow:${b.shd == 'sm' ? '0 2px 6px rgba(0,0,0,0.3)' : b.shd == 'md' ? '0 6px 16px rgba(0,0,0,0.4)' : b.shd == 'lg' ? '0 12px 30px rgba(0,0,0,0.55)' : '0 0 15px rgba(0,212,255,0.45)'};` : '';

    let bgImgStyle = '';
    if (b.bgImg) {
      if (b.bgImg.startsWith('pattern-')) {
        const p = getPatternCss(b.bgImg);
        bgImgStyle = `background-image:${p.image};background-size:${p.size || 'auto'};background-repeat:${p.repeat || 'repeat'};`;
      } else {
        bgImgStyle = `background-image:url('${b.bgImg}');background-size:${b.bgSize || 'cover'};background-repeat:${b.bgRepeat || 'no-repeat'};background-position:${b.bgPos || 'center'};`;
      }
    }

    const singleRowStyle = (b.h === 1 && !kids(b).length) ? 'justify-content:center;' : '';
    const fillStyle = gradientColor ? `background:${bColor};` : '';
    const styleAttr = S.hasCss ? `style="grid-column:${b.c}/span ${b.w};grid-row:${b.r}/span ${b.h};--f:${bColor};${fillStyle}z-index:${dep(b) + 1};font-family:${fontFam};font-size:${fs}px;text-align:${ta};${colStyle}${fwStyle}${fstStyle}${tdStyle}${ttStyle}${padStyle}${radStyle}${bwStyle}${shdStyle}${bgImgStyle}${singleRowStyle}"` : '';

    let contentHtml = kids(b).length ? '' : renderWysiwyg(b.t);
    if (b.type === 'image' && !kids(b).length) {
      const defImg = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
      contentHtml = `<div class="canvas-img-box"><img src="${b.imgUrl || defImg}" alt="Mockup" style="object-fit:${b.objFit || 'cover'};"><span class="canvas-img-cap">${renderWysiwyg(b.t)}</span></div>`;
    } else if (b.type === 'dropdown' && !kids(b).length) {
      const dropItems = (b.items && b.items.length) ? b.items : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
      contentHtml = `<div class="canvas-dropdown-box"><div class="canvas-dropdown-summary">${renderWysiwyg(b.t)} ▾</div><div class="canvas-dropdown-items">${dropItems.slice(0, 4).map(it => `<span>• ${esc(it)}</span>`).join(' ')}${dropItems.length > 4 ? ` <small>(+${dropItems.length - 4})</small>` : ''}</div></div>`;
    } else if (b.type === 'form' && !kids(b).length) {
      const fields = (b.fields && b.fields.length) ? b.fields : (b.t ? b.t.split(',').map(x => x.trim()).filter(Boolean) : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']);
      const subTxt = b.submitText || (S.lang === 'en' ? 'Send Message' : 'Hantar Mesej');
      contentHtml = `<div class="canvas-form-box">${fields.slice(0, 4).map(f => {
        const isArea = /mesej|message|komen|comment|ulasan/i.test(f);
        return `<div class="canvas-form-row"><span class="canvas-form-lbl">${esc(f)}</span><span class="canvas-form-input${isArea ? ' is-area' : ''}">${isArea ? '✎ ...' : ''}</span></div>`;
      }).join('')}<span class="canvas-form-btn">${esc(subTxt)}</span></div>`;
    } else if (b.type === 'nav' && !kids(b).length) {
      let items = [];
      if (b.t.includes(',')) items = b.t.split(',');
      else if (b.t.includes('|')) items = b.t.split('|');
      else if (b.t.includes('\n')) items = b.t.split('\n');
      else items = b.t.trim().split(/\s+/);
      const drops = b.dropdowns || {};
      const linksHtml = items.map((item, idx) => {
        const s = item.trim();
        if (!s) return '';
        const isDrop = !!(drops[s] || drops[idx] || drops[s.toLowerCase()]);
        const isSelItem = (b.id == S.sel) && (S.selNavIdx === idx || S.selNavTitle === s);
        const isCta = !isDrop && /mula|daftar|beli|start|sign|hubungi|contact/i.test(s);
        const dropBadge = isDrop ? '<small class="nav-drop-tag">▾ Dropdown</small>' : '';
        const iconPrefix = isDrop ? '▾' : '🔗';
        return `<span class="canvas-nav-item${isDrop ? ' is-dropdown' : ''}${isCta ? ' cta' : ''}${isSelItem ? ' sel' : ''}" data-nav-blk="${b.id}" data-nav-idx="${idx}" data-nav-title="${esc(s)}" title="${isDrop ? 'Menu Dropdown (Klik untuk pilih & urus)' : 'Pautan Navigasi (Klik untuk pilih & tukar ke dropdown)'}">${iconPrefix} ${esc(s)} ${dropBadge}</span>`;
      }).filter(Boolean).join(' ');
      contentHtml = `<div class="canvas-nav-links">${linksHtml}</div>`;
    }

    let labelText = '';
    const isDiv = S.htmlMode === 'div';
    const tagDisplay = isDiv ? (['button', 'logo', 'link'].includes(b.type) ? 'a' : 'div') : T.tag;
    const typeName = S.lang === 'en' ? (T.en || T.n) : T.n;
    if (b.w <= 2) {
      labelText = `&lt;${tagDisplay}&gt;`;
    } else if (b.w <= 4) {
      labelText = `${typeName} &lt;${tagDisplay}&gt;`;
    } else {
      labelText = `${typeName} &lt;${tagDisplay}&gt; <span class="cls-tag">.${b.cls}</span>`;
    }

    const p = par(b);
    const sameOriginChild = p && p.c === b.c && p.r === b.r;

    return `<div class="blk${on ? ' on' : ''}${b.h === 1 ? ' single-row' : ''}${sameOriginChild ? ' same-origin-child' : ''}" data-id="${b.id}" ${styleAttr}>
      <span class="lb" style="${S.hasCss ? `border-color:${dotColor};` : ''}">
        ${S.hasCss ? `<span class="canvas-color-dot" style="background:${dotColor};"></span>` : ''}
        ${labelText}
      </span>
      <div class="tx" data-tx-id="${b.id}" title="Dwi-klik untuk sunting teks secara langsung pada kanvas">${contentHtml}</div>
      ${on && S.hasCss ? `
        <span class="dim-badge">${b.w} × ${b.h}</span>
        <button type="button" class="blk-del" data-del="${b.id}" title="Padam elemen (Delete)" aria-label="Padam elemen">×</button>
        <i class="rs-h rs-e" data-dir="e" title="Seret untuk ubah lebar"></i>
        <i class="rs-h rs-s" data-dir="s" title="Seret untuk ubah tinggi"></i>
        <i class="rs-h rs-w" data-dir="w" title="Seret untuk ubah lebar dari kiri"></i>
        <i class="rs-h rs-n" data-dir="n" title="Seret untuk ubah tinggi dari atas"></i>
        <i class="rs-h rs-se" data-dir="se" title="Seret penjuru untuk ubah saiz"></i>
        <i class="rs-h rs-nw" data-dir="nw" title="Seret penjuru atas kiri"></i>
        <i class="rs-h rs-ne" data-dir="ne" title="Seret penjuru atas kanan"></i>
        <i class="rs-h rs-sw" data-dir="sw" title="Seret penjuru bawah kiri"></i>
      ` : ''}
    </div>`;
  }).join('') + (S.hasCss ? ((g => g ? `<div class="ghost${free(g.c, g.r, g.w, g.h) ? '' : ' bad'}" style="grid-column:${g.c}/span ${g.w};grid-row:${g.r}/span ${g.h}"><span class="dim">${g.w} kol × ${g.h} baris</span></div>` : '')(drag && drag.draw && drag.moved ? drag.g : pend)) : '') +
  (S.blocks.length || pend || (drag && drag.draw) ? '' : (S.lang === 'en'
    ? '<div class="empty"><div><b>Canvas is empty</b>Drag across the grid to draw your first block. Start from the top: Header, Hero, Content, Footer. Or pick a pre-built layout template from the left drawer.</div></div>'
    : '<div class="empty"><div><b>Kanvas masih kosong</b>Seret pada grid untuk melukis blok pertama anda. Mulakan dari atas: Kepala Halaman, Hero, Kandungan, Kaki Halaman — atau pilih Templat siap guna di panel kiri.</div></div>'));
}

function pop(g) {
  pend = g;
  const p = $('#pop');
  if (!g) {
    p.hidden = true;
    return;
  }
  const rc = cv.getBoundingClientRect();
  const wr = $('.cvw').getBoundingClientRect();
  const cw = rc.width / 12;
  const rh = rc.height / R;
  const low = g.r > 6;

  const isEn = S.lang === 'en';
  p.innerHTML = `<b>${isEn ? 'What is this block for?' : 'Apakah fungsi blok ini?'}</b>` + Object.keys(TY).map(k => `<button data-pk="${k}">${isEn ? (TY[k].en || TY[k].n) : TY[k].n}</button>`).join('') + `<button data-pk="">${isEn ? 'Cancel' : 'Batal'}</button>`;
  p.style.left = cl(rc.left - wr.left + (g.c - 1) * cw, 0, Math.max(0, wr.width - 212)) + 'px';
  p.style.top = (rc.top - wr.top + (low ? (g.r - 1) * rh - 8 : (g.r - 1 + g.h) * rh + 8)) + 'px';
  p.style.transform = low ? 'translateY(-100%)' : 'none';
  p.hidden = false;
}

cv.onpointerdown = e => {
  const delBtn = e.target.closest('.blk-del');
  if (delBtn) {
    e.stopPropagation();
    e.preventDefault();
    deleteBox(delBtn.dataset.del);
    return;
  }

  const navItem = e.target.closest('.canvas-nav-item');
  if (navItem) {
    e.stopPropagation();
    const blkId = navItem.dataset.navBlk;
    const idx = parseInt(navItem.dataset.navIdx, 10);
    const title = navItem.dataset.navTitle;
    S.sel = blkId;
    S.selNavIdx = idx;
    S.selNavTitle = title;
    render();
    return;
  }

  const el = e.target.closest('.blk');
  if (el && el.dataset.id !== S.sel) {
    S.selNavIdx = null;
    S.selNavTitle = null;
  }
  pop(null);

  if (!S.hasCss && (e.target.closest('.rs-h') || S.tool == 'r')) {
    toast('💡 HTML Base Mode (CSS Disabled): Enable "+ CSS" in the top toolbar to draw grid blocks or resize.');
    return;
  }

  if (!el || S.tool == 'r') {
    const rc = cv.getBoundingClientRect();
    const c = cl(Math.ceil((e.clientX - rc.left) / (rc.width / 12)), 1, 12);
    const r = cl(Math.ceil((e.clientY - rc.top) / (rc.height / R)), 1, R);
    drag = { hit: el ? el.dataset.id : null, draw: true, c0: c, r0: r, x: e.clientX, y: e.clientY, g: { c, r, w: 1, h: 1 }, moved: false };
    cv.setPointerCapture(e.pointerId);
    render();
    return;
  }

  const b = get(el.dataset.id);
  S.sel = b.id;
  const rsEl = e.target.closest('.rs-h');
  const dir = rsEl ? rsEl.dataset.dir : null;

  drag = {
    b,
    kd: S.blocks.filter(k => k !== b && inb(k, b)),
    rs: !!rsEl,
    dir,
    x: e.clientX,
    y: e.clientY,
    c: b.c,
    r: b.r,
    w: b.w,
    h: b.h,
    before: JSON.stringify(S.blocks),
    moved: false
  };

  cv.setPointerCapture(e.pointerId);
  render();
};

cv.onpointermove = e => {
  if (!drag) return;
  if (drag.draw) {
    const rc = cv.getBoundingClientRect();
    const c = cl(Math.ceil((e.clientX - rc.left) / (rc.width / 12)), 1, 12);
    const r = Math.max(1, Math.ceil((e.clientY - rc.top) / (rc.height / R)));
    if (r > R - 1) {
      R = r + 3;
      cv.style.setProperty('--rows', R);
    }
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
    drag.g = { c: Math.min(drag.c0, c), r: Math.min(drag.r0, r), w: Math.abs(c - drag.c0) + 1, h: Math.abs(r - drag.r0) + 1 };
    if (drag.moved) refresh();
    return;
  }

  const rc = cv.getBoundingClientRect();
  const dc = Math.round((e.clientX - drag.x) / (rc.width / 12));
  const dr = Math.round((e.clientY - drag.y) / (rc.height / R));
  const b = drag.b;
  let n = { c: b.c, r: b.r, w: b.w, h: b.h };

  if (drag.rs) {
    if (drag.dir == 'e') {
      n.w = cl(drag.w + dc, 1, 13 - drag.c);
    } else if (drag.dir == 's') {
      n.h = Math.max(1, drag.h + dr);
    } else if (drag.dir == 'se') {
      n.w = cl(drag.w + dc, 1, 13 - drag.c);
      n.h = Math.max(1, drag.h + dr);
    } else if (drag.dir == 'w') {
      const newC = cl(drag.c + dc, 1, drag.c + drag.w - 1);
      n.c = newC;
      n.w = drag.w + (drag.c - newC);
    } else if (drag.dir == 'n') {
      const newR = cl(drag.r + dr, 1, drag.r + drag.h - 1);
      n.r = newR;
      n.h = drag.h + (drag.r - newR);
    } else if (drag.dir == 'nw') {
      const newC = cl(drag.c + dc, 1, drag.c + drag.w - 1);
      const newR = cl(drag.r + dr, 1, drag.r + drag.h - 1);
      n.c = newC;
      n.w = drag.w + (drag.c - newC);
      n.r = newR;
      n.h = drag.h + (drag.r - newR);
    } else if (drag.dir == 'ne') {
      const newR = cl(drag.r + dr, 1, drag.r + drag.h - 1);
      n.r = newR;
      n.h = drag.h + (drag.r - newR);
      n.w = cl(drag.w + dc, 1, 13 - drag.c);
    } else if (drag.dir == 'sw') {
      const newC = cl(drag.c + dc, 1, drag.c + drag.w - 1);
      n.c = newC;
      n.w = drag.w + (drag.c - newC);
      n.h = Math.max(1, drag.h + dr);
    }
  } else {
    n = { c: cl(drag.c + dc, 1, 13 - b.w), r: Math.max(1, drag.r + dr), w: b.w, h: b.h };
  }

  // Auto-expand kanvas ke bawah jika elemen ditarik atau dibesarkan ke bawah
  if (n.r + n.h > R - 1) {
    R = Math.max(R, n.r + n.h + 2);
    cv.style.setProperty('--rows', R);
  }

  if ((n.c != b.c || n.r != b.r || n.w != b.w || n.h != b.h) && free(n.c, n.r, n.w, n.h, [b.id].concat(drag.rs ? [] : drag.kd.map(k => k.id)))) {
    if (!drag.moved) {
      hist.push(drag.before);
      fut = [];
      drag.moved = true;
    }
    if (!drag.rs) drag.kd.forEach(k => { k.c += n.c - b.c; k.r += n.r - b.r; });
    Object.assign(b, n);
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  }
};

cv.addEventListener('dblclick', e => {
  const blk = e.target.closest('.blk');
  if (!blk) return;
  const b = get(blk.dataset.id);
  if (!b) return;
  const txSpan = blk.querySelector('.tx');
  if (!txSpan) return;

  txSpan.contentEditable = true;
  txSpan.focus();
  const range = document.createRange();
  range.selectNodeContents(txSpan);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = () => {
    txSpan.contentEditable = false;
    const newT = txSpan.innerHTML.trim();
    if (b.t !== newT && b.t !== txSpan.textContent) {
      snap();
      b.t = txSpan.innerHTML;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    }
  };

  txSpan.onblur = finish;
  txSpan.onkeydown = ke => {
    if (ke.key === 'Enter' && !ke.shiftKey) {
      ke.preventDefault();
      txSpan.blur();
    }
    if (ke.key === 'Escape') {
      txSpan.innerHTML = renderWysiwyg(b.t);
      txSpan.blur();
    }
  };
});

cv.onpointerup = cv.onpointercancel = () => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (d && d.draw && !d.moved) {
    S.sel = d.hit;
    render();
    return;
  }
  if (d && d.draw && d.moved) {
    const g = d.g;
    if (free(g.c, g.r, g.w, g.h)) {
      render();
      pop(g);
      refresh();
      return;
    }
    toast('Box overlaps with another box. Please draw in empty space.');
  }
  render();
};

cv.ondragover = e => e.preventDefault();
cv.ondrop = e => {
  e.preventDefault();
  const ty = e.dataTransfer.getData('text/plain');
  if (!TY[ty]) return;
  const rc = cv.getBoundingClientRect();
  const dropC = cl(Math.ceil((e.clientX - rc.left) / (rc.width / 12)), 1, 12);
  const dropR = Math.max(1, Math.ceil((e.clientY - rc.top) / (rc.height / R)));
  add(ty, dropC, dropR);
};
