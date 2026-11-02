/**
 * NIAN CODE STUDIO - Code Generator & Preview (generator.js)
 * Generates standard HTML5, CSS Grid (External, Internal, Inline, 3-in-1, Tailwind), JavaScript,
 * syntax-highlighted tokens, and real-time live preview documents.
 */

const rl = b => {
  const p = par(b);
  return { c: b.c - (p ? p.c - 1 : 0), r: b.r - (p ? p.r - 1 : 0) };
};

function stripHtmlTags(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim();
}

function hasBlockTag(str) {
  return /<(h[1-6]|p|div|ul|ol|blockquote|article|section)/i.test(str);
}

function renderWysiwyg(s) {
  if (!s) return '';
  return String(s).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

const twc = (b, n) => {
  const q = rl(b);
  const padCls = b.pad === 0 ? 'p-0' : b.pad == 8 ? 'p-2' : b.pad == 24 ? 'p-6' : b.pad == 32 ? 'p-8' : (n ? 'p-2' : 'p-4');
  const radCls = !b.rad ? '' : b.rad == 4 ? 'rounded' : b.rad == 8 ? 'rounded-lg' : b.rad == 16 ? 'rounded-2xl' : b.rad == 999 ? 'rounded-full' : 'rounded-md';
  const shdCls = !b.shd || b.shd == 'none' ? '' : b.shd == 'sm' ? 'shadow-sm' : b.shd == 'md' ? 'shadow-md' : 'shadow-xl';
  let t = `col-start-${q.c} col-span-${b.w} ${b.h <= 6 ? `row-start-${q.r} row-span-${b.h}` : `[grid-row:${q.r}/span_${b.h}]`} bg-[${FILLS[b.f]}] ${padCls}`;
  if (radCls) t += ` ${radCls}`;
  if (shdCls) t += ` ${shdCls}`;
  if (b.f == 3) t += ' text-white';
  if (b.ta) t += ` text-${b.ta}`;
  const rowH = S.gridRowH || 40;
  const gap = S.gridGap !== undefined ? S.gridGap : 8;
  if (n) t += ` grid grid-cols-${b.w} auto-rows-[${rowH}px] gap-[${gap}px]`;
  return t;
};

const inls = (b, n) => {
  const q = rl(b);
  const pad = b.pad !== undefined ? b.pad + 'px' : (n ? '8px' : '16px');
  const bg = b.f === 'none' ? 'transparent' : (FILLS[b.f] || '#ffffff');
  const rowH = S.gridRowH || 40;
  const gap = S.gridGap !== undefined ? S.gridGap : 8;
  let s = `grid-column:${q.c}/span ${b.w};grid-row:${q.r}/span ${b.h};background-color:${bg};padding:${pad};`;
  if (b.font) s += `font-family:${b.font};`;
  if (b.col) s += `color:${b.col};`;
  else if (b.f == 3) s += 'color:#ffffff;';
  if (b.fs) s += `font-size:${b.fs}px;`;
  if (b.fw === 'bold') s += 'font-weight:700;';
  else if (Number.isFinite(Number(b.fw)) && b.fw !== undefined && b.fw !== null && b.fw !== '') s += `font-weight:${Number(b.fw)};`;
  if (b.fst == 'italic') s += 'font-style:italic;';
  if (b.td && b.td != 'none') s += `text-decoration:${b.td};`;
  if (b.tt && b.tt != 'none') s += `text-transform:${b.tt};`;
  if (b.ta) s += `text-align:${b.ta};`;
  if (b.rad) s += `border-radius:${b.rad == 999 ? '9999px' : b.rad + 'px'};`;
  if (b.bw) s += `border:${b.bw}px ${b.bs || 'solid'} ${b.bc || 'rgba(0,0,0,0.15)'};`;
  if (b.shd && b.shd != 'none') {
    const sh = b.shd == 'sm' ? '0 2px 4px rgba(0,0,0,0.1)' : b.shd == 'md' ? '0 4px 12px rgba(0,0,0,0.15)' : '0 10px 25px rgba(0,0,0,0.2)';
    s += `box-shadow:${sh};`;
  }
  if (n) s += `display:grid;grid-template-columns:repeat(${b.w},1fr);grid-auto-rows:${rowH}px;gap:${gap}px;`;
  return s;
};

const inner = b => {
  const t = esc(b.t);
  const isDiv = S.htmlMode === 'div';
  const cleanAlt = stripHtmlTags(b.t) || 'Mockup image';
  const cleanCaption = b.t.trim();
  const defImg = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
  return b.type == 'slider' ? (S.hasJs ? '<div class="swiper-wrapper">\n' + [1, 2, 3].map(n => '  <div class="swiper-slide">Slide ' + n + '</div>').join('\n') + '\n</div>\n<div class="swiper-pagination"></div>' : '<div class="slider-box">\n  <p>[ Static Slider ]</p>\n</div>') :
    b.type == 'dropdown' ? (function() {
      const dropItems = (b.items && b.items.length) ? b.items : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
      const innerLinks = dropItems.map(it => `  <a href="#">${esc(it)}</a>`).join('\n');
      return isDiv
        ? `<div class="dropdown-header">${t} ▾</div>\n<div class="dropdown-content">\n${innerLinks}\n</div>`
        : `<summary>${t}</summary>\n<div class="dropdown-content">\n${innerLinks}\n</div>`;
    })() :
    b.type == 'form' ? (function() {
      const fields = (b.fields && b.fields.length) ? b.fields : (b.t ? b.t.split(',').map(x => x.trim()).filter(Boolean) : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']);
      const subTxt = b.submitText || 'Hantar Mesej';
      const rows = fields.map((f, idx) => {
        const lbl = f.trim() || `Medan ${idx + 1}`;
        const idName = `field-${b.id}-${idx + 1}`;
        const isEmail = /emel|email/i.test(lbl);
        const isPhone = /tel|fon|phone|whatsapp/i.test(lbl);
        const isArea = /mesej|message|komen|comment|ulasan|pertanyaan/i.test(lbl);
        if (isArea) {
          return `<div class="form-group">\n  <label for="${idName}">${esc(lbl)}</label>\n  <textarea id="${idName}" name="${idName}" rows="3" placeholder="Taip ${qa(lbl.toLowerCase())}..." required></textarea>\n</div>`;
        }
        const inputType = isEmail ? 'email' : isPhone ? 'tel' : 'text';
        return `<div class="form-group">\n  <label for="${idName}">${esc(lbl)}</label>\n  <input type="${inputType}" id="${idName}" name="${idName}" placeholder="Masukkan ${qa(lbl.toLowerCase())}..." required>\n</div>`;
      }).join('\n');
      return `${rows}\n<button type="submit" class="btn-cta form-submit">${esc(subTxt)}</button>`;
    })() :
    b.type == 'nav' ? (function() {
      let items = [];
      if (b.t.includes(',')) items = b.t.split(',');
      else if (b.t.includes('|')) items = b.t.split('|');
      else if (b.t.includes('\n')) items = b.t.split('\n');
      else items = b.t.trim().split(/\s+/);
      const drops = b.dropdowns || {};
      return items.map((x, idx) => {
        const title = x.trim();
        if (!title) return '';
        const dropData = drops[title] || drops[idx] || drops[title.toLowerCase()];
        if (dropData) {
          const subItems = Array.isArray(dropData) ? dropData : (dropData.items || ['Option 1', 'Option 2', 'Option 3']);
          if (isDiv) {
            return `<div class="nav-dropdown">\n  <div class="nav-drop-btn">${esc(title)} ▾</div>\n  <div class="dropdown-content">\n    ${subItems.map(sub => `<a href="#">${esc(sub.trim())}</a>`).join('\n    ')}\n  </div>\n</div>`;
          }
          return `<details class="nav-dropdown">\n  <summary>${esc(title)} ▾</summary>\n  <div class="dropdown-content">\n    ${subItems.map(sub => `<a href="#">${esc(sub.trim())}</a>`).join('\n    ')}\n  </div>\n</details>`;
        }
        const matchPage = Object.keys(S.pages).find(k => S.pages[k].name.toLowerCase().includes(title.toLowerCase()));
        const href = matchPage || '#';
        const isCta = /mula|daftar|beli|start|sign|hubungi|contact/i.test(title);
        const cls = isCta ? ' class="btn-cta"' : '';
        return `<a href="${href}"${cls}>${esc(title)}</a>`;
      }).filter(Boolean).join('\n');
    })() :
    b.type == 'image' ? (isDiv ? `<div class="image-box"><img src="${b.imgUrl || defImg}" alt="${qa(cleanAlt)}">${cleanCaption ? `\n  <div class="caption">${cleanCaption}</div>` : ''}</div>` : `<img src="${b.imgUrl || defImg}" alt="${qa(cleanAlt)}">${cleanCaption ? `\n<figcaption>${cleanCaption}</figcaption>` : ''}`) :
    b.type == 'header' ? (hasBlockTag(b.t) ? b.t : `<h1>${b.t}</h1>`) :
    ['hero', 'section', 'card'].includes(b.type) ? (hasBlockTag(b.t) ? b.t : `<h2>${b.t}</h2>`) :
    b.type == 'text' ? (hasBlockTag(b.t) ? b.t : `<p>${b.t}</p>`) : b.t;
};

function emit(b, d, mode, L, parentFk) {
  const T = TY[b.type];
  const ks = kids(b);
  const pad = '  '.repeat(d);
  const isDiv = S.htmlMode === 'div';
  const lk = b.type == 'button' || b.type == 'logo' || b.type == 'link';
  const targetTag = isDiv ? (lk ? 'a' : 'div') : T.tag;
  const at = lk ? ` href="${qa(b.href || '#')}"` : '';
  let clAttr = '';
  let stAttr = '';

  if (S.hasCss) {
    if (mode == 'tw') {
      clAttr = ` class="${(b.type == 'slider' && S.hasJs ? 'swiper ' : '') + twc(b, ks.length)}"`;
    } else if (mode == 'inl') {
      stAttr = ` style="${inls(b, ks.length)}"`;
      if (b.type == 'slider' && S.hasJs) clAttr = ' class="swiper"';
      if (b.type == 'button') clAttr = ' class="btn-cta"';
    } else if (mode == 'all') {
      clAttr = ` class="${(b.type == 'slider' && S.hasJs ? 'swiper ' : '') + b.cls}"`;
      const isDemo = S.sel ? b.id == S.sel : b.id == (S.blocks[0] && S.blocks[0].id);
      if (isDemo) {
        stAttr = ` style="outline: 2px dashed #0a84ff; border-radius: 8px;"`;
      }
    } else {
      clAttr = ` class="${(b.type == 'slider' && S.hasJs ? 'swiper ' : '') + b.cls}"`;
    }
  } else if (isDiv) {
    clAttr = ` class="${b.cls}"`;
  }

  const fk = 'blk-' + b.id;
  const bColor = FILLS[b.f];

  // 📝 Explanatory comment for Semantic HTML5 / Standard Div structure
  if (d === 1) {
    const isMs = S.lang === 'ms';
    const tagLabel = isMs ? T.n : (T.en || T.n);
    const colWord = isMs ? 'kol' : 'cols';
    const rowWord = isMs ? 'baris' : 'rows';
    if (isDiv) {
      L.push({ s: `${pad}<!-- 📦 ${tagLabel} (${isMs ? 'HTML Biasa' : 'Standard Div'}): <div class="${b.cls}"> (${b.w} ${colWord} × ${b.h} ${rowWord}) -->`, parentFk, blockColor: bColor });
    } else {
      L.push({ s: `${pad}<!-- 🧱 ${tagLabel} (${isMs ? 'Semantik' : 'Semantic'}): <${T.tag}> .${b.cls} (${b.w} ${colWord} × ${b.h} ${rowWord}) -->`, parentFk, blockColor: bColor });
    }
  }

  if (lk && !ks.length) return L.push({ id: b.id, s: `${pad}<a${clAttr}${stAttr}${at}>${b.t}</a>`, parentFk, isCssInline: !!stAttr, blockColor: bColor, isTagLine: true });
  L.push({ id: b.id, s: `${pad}<${targetTag}${clAttr}${stAttr}${at}>`, fold: 'start', fk, tag: targetTag, parentFk, isCssInline: !!stAttr, blockColor: bColor, isTagLine: true });
  if (ks.length) ks.forEach(k => emit(k, d + 1, mode, L, fk));
  else inner(b).split('\n').forEach(s => L.push({ id: b.id, s: pad + '  ' + s, parentFk: fk, blockColor: bColor }));
  L.push({ id: b.id, s: `${pad}</${targetTag}>`, fold: 'end', fk, tag: targetTag, parentFk, blockColor: bColor });
}

function body(mode) {
  const L = [];
  const isDiv = S.htmlMode === 'div';
  const mainTag = isDiv ? 'div' : 'main';
  const mainCls = isDiv ? 'main-container ' : '';
  const mainIdAttr = isDiv ? ' id="main"' : '';
  const mainClose = isDiv ? '</div><!-- /.main-container -->' : '</main>';

  const rowH = S.gridRowH || 40;
  const gap = S.gridGap !== undefined ? S.gridGap : 8;
  if (!S.hasCss) {
    L.push({ s: `<${mainTag}${mainIdAttr}${isDiv ? ' class="main-container"' : ''}>`, fold: 'start', fk: 'main', tag: mainTag, parentFk: 'body' });
  } else if (mode == 'tw') {
    L.push({ s: `<${mainTag}${mainIdAttr} class="${mainCls}grid grid-cols-12 auto-rows-[${rowH}px] gap-[${gap}px] p-4">`, fold: 'start', fk: 'main', tag: mainTag, parentFk: 'body' });
  } else if (mode == 'inl') {
    L.push({ s: `<${mainTag}${mainIdAttr}${isDiv ? ' class="main-container"' : ''} style="display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:${rowH}px;gap:${gap}px;padding:16px;">`, fold: 'start', fk: 'main', tag: mainTag, parentFk: 'body', isCssInline: true });
  } else {
    L.push({ s: `<${mainTag}${mainIdAttr}${isDiv ? ' class="main-container"' : ''}>`, fold: 'start', fk: 'main', tag: mainTag, parentFk: 'body' });
  }
  sorted();
  S.blocks.filter(b => !par(b)).sort((a, b) => a.r - b.r || a.c - b.c).forEach(b => emit(b, 1, mode, L, 'main'));
  L.push({ s: mainClose, fold: 'end', fk: 'main', tag: mainTag, parentFk: 'body' });
  return L;
}

function getCssRules() {
  if (!S.blocks || !S.blocks.length) return [];
  const gap = S.gridGap !== undefined ? S.gridGap : 8;
  const rowH = S.gridRowH !== undefined ? S.gridRowH : 40;
  const th = S.theme || { primary: '#00d4ff', bg: '#ffffff', text: '#12203f' };

  const rootRules = [
    '/* 🎨 Variabel Tema (:root) */',
    ':root {',
    `  --primary: ${th.primary || '#00d4ff'};`,
    `  --bg-page: ${th.bg || '#ffffff'};`,
    `  --text-main: ${th.text || '#12203f'};`,
    '}'
  ].map((s, i) => {
    if (i === 1) return { s, fold: 'start', fk: 'css-root', tag: '}' };
    if (i === 5) return { s, fold: 'end', fk: 'css-root', tag: '}' };
    return { s, parentFk: 'css-root' };
  });

  const mainRules = [
    '',
    '/* 🏠 Main Site Grid Container (12 Columns) */',
    'main, #main, .main-container {',
    '  display: grid;',
    '  grid-template-columns: repeat(12, 1fr);',
    `  grid-auto-rows: ${rowH}px;`,
    `  gap: ${gap}px;`,
    '  padding: 16px;',
    '  background-color: var(--bg-page);',
    '  color: var(--text-main);',
    '}'
  ].map((s, i) => {
    if (i === 2) return { s, fold: 'start', fk: 'css-main', tag: '}' };
    if (i === 10) return { s, fold: 'end', fk: 'css-main', tag: '}' };
    return { s, parentFk: 'css-main' };
  });

  const L = rootRules.concat(mainRules);

  sorted().forEach(b => {
    L.push({ s: '' });
    const fk = 'css-' + b.id;
    const bgVal = b.f === 'none' ? 'transparent' : (typeof b.f === 'number' ? (FILLS[b.f] || '#ffffff') : (b.f || '#ffffff'));
    const gradientBg = typeof bgVal === 'string' && /^(?:linear|radial|conic)-gradient\(/i.test(bgVal);
    const sampleBg = gradientBg ? (bgVal.match(/#[\da-f]{6}/i)?.[0] || '#ffffff') : bgVal;
    const isDark = isColorDark(sampleBg);

    // 🎨 Explanatory style comment for each element
    const isMs = S.lang === 'ms';
    const tagLabel = isMs ? TY[b.type].n : (TY[b.type].en || TY[b.type].n);
    const colWord = isMs ? 'Kolum' : 'Column';
    const rowWord = isMs ? 'Baris' : 'Row';
    L.push({ s: `/* 🎨 ${tagLabel}: .${b.cls} (<${TY[b.type].tag}>) - ${colWord} ${rl(b).c} & ${rowWord} ${rl(b).r} */`, parentFk: fk, isCss: true });

    const extra = [];
    if (b.font) extra.push(`  font-family: ${b.font};`);
    if (b.col) extra.push(`  color: ${b.col};`);
    else if (isDark) extra.push('  color: #ffffff;');
    else extra.push('  color: #12203f;');

    if (b.fs) extra.push(`  font-size: ${b.fs}px;`);
    if (b.fw === 'bold') extra.push('  font-weight: 700;');
    else if (Number.isFinite(Number(b.fw)) && b.fw !== undefined && b.fw !== null && b.fw !== '') extra.push(`  font-weight: ${Number(b.fw)};`);
    if (b.fst == 'italic') extra.push('  font-style: italic;');
    if (b.td && b.td != 'none') extra.push(`  text-decoration: ${b.td};`);
    if (b.tt && b.tt != 'none') extra.push(`  text-transform: ${b.tt};`);
    if (b.ta) extra.push(`  text-align: ${b.ta};`);
    if (b.bw) extra.push(`  border: ${b.bw}px ${b.bs || 'solid'} ${b.bc || 'rgba(0,0,0,0.15)'};`);
    if (b.rad) extra.push(`  border-radius: ${b.rad == 999 ? '9999px' : b.rad + 'px'};`);
    if (b.shd && b.shd != 'none') {
      const sh = b.shd == 'sm' ? '0 2px 4px rgba(0,0,0,0.1)' : b.shd == 'md' ? '0 4px 12px rgba(0,0,0,0.15)' : b.shd == 'lg' ? '0 10px 25px rgba(0,0,0,0.2)' : '0 0 15px rgba(0,212,255,0.45)';
      extra.push(`  box-shadow: ${sh};`);
    }
    if (b.pad !== undefined) extra.push(`  padding: ${b.pad}px;`);
    else {
      const defPad = kids(b).length ? '8px' : '16px';
      extra.push(`  padding: ${defPad};`);
    }

    if (b.bgImg) {
      if (b.bgImg.startsWith('pattern-')) {
        const p = getPatternCss(b.bgImg);
        extra.push(`  background-image: ${p.image};`);
        if (p.size) extra.push(`  background-size: ${p.size};`);
        if (p.repeat) extra.push(`  background-repeat: ${p.repeat};`);
      } else {
        extra.push(`  background-image: url('${b.bgImg}');`);
        extra.push(`  background-size: ${b.bgSize || 'cover'};`);
        extra.push(`  background-repeat: ${b.bgRepeat || 'no-repeat'};`);
        extra.push(`  background-position: ${b.bgPos || 'center'};`);
      }
    }

    if (b.h === 1 && !kids(b).length) {
      extra.push('  display: flex;');
      extra.push('  align-items: center;');
      if (b.ta === 'center') extra.push('  justify-content: center;');
      else if (b.ta === 'right') extra.push('  justify-content: flex-end;');
    }

    const rules = [
      `.${b.cls} {`,
      `  grid-column: ${rl(b).c} / span ${b.w};`,
      `  grid-row: ${rl(b).r} / span ${b.h};`,
      `  ${gradientBg ? 'background' : 'background-color'}: ${bgVal};`
    ].concat(
      extra,
      kids(b).length ? ['  display: grid;', `  grid-template-columns: repeat(${b.w}, 1fr);`, `  grid-auto-rows: ${rowH}px;`, `  gap: ${gap}px;`] : [],
      ['}']
    );
    const bColor = b.f === 'none' ? '#00d4ff' : (gradientBg ? sampleBg : bgVal);
    rules.forEach((s, idx) => {
      if (idx === 0) L.push({ id: b.id, s, fold: 'start', fk, tag: '}', isCss: true, blockColor: bColor, isSelectorLine: true });
      else if (idx === rules.length - 1) L.push({ id: b.id, s, fold: 'end', fk, tag: '}' , isCss: true, blockColor: bColor });
      else L.push({ id: b.id, s, parentFk: fk, isCss: true, blockColor: bColor });
    });
  });

  // 🧭 Navigation dropdown styles (<details class="nav-dropdown">)
  L.push({ s: '' });
  L.push({ s: '/* 🧭 Navigation Dropdown Menu (<details class="nav-dropdown">) */' });
  L.push({ s: 'nav details.nav-dropdown { position: relative; display: inline-block; }' });
  L.push({ s: 'nav details.nav-dropdown summary { list-style: none; cursor: pointer; font-weight: 500; padding: 4px 10px; border-radius: 6px; user-select: none; }' });
  L.push({ s: 'nav details.nav-dropdown summary::-webkit-details-marker { display: none; }' });
  L.push({ s: 'nav details.nav-dropdown[open] summary { color: var(--primary, #00d4ff); font-weight: 600; }' });
  L.push({ s: 'nav details.nav-dropdown .dropdown-content { position: absolute; top: calc(100% + 4px); left: 0; min-width: 140px; background: #ffffff; color: #12203f; border: 1px solid rgba(0,0,0,0.15); border-radius: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.15); padding: 6px 0; z-index: 100; display: flex; flex-direction: column; }' });
  L.push({ s: 'nav details.nav-dropdown .dropdown-content a { padding: 6px 14px; color: #12203f !important; text-decoration: none !important; font-size: 13px !important; display: block !important; }' });
  L.push({ s: 'nav details.nav-dropdown .dropdown-content a:hover { background: rgba(0,212,255,0.12) !important; color: #0077b6 !important; }' });

  // 📝 Interactive form styles (<form>)
  if (S.blocks.some(b => b.type === 'form')) {
    L.push({ s: '' });
    L.push({ s: '/* 📝 Interactive Contact Form (<form>) */' });
    L.push({ s: 'form { display: flex; flex-direction: column; gap: 10px; }' });
    L.push({ s: 'form .form-group { display: flex; flex-direction: column; gap: 4px; text-align: left; }' });
    L.push({ s: 'form label { font-size: 12.5px; font-weight: 600; opacity: 0.9; }' });
    L.push({ s: 'form input, form textarea { width: 100%; padding: 8px 10px; border: 1px solid rgba(18,32,63,0.22); border-radius: 6px; font: inherit; font-size: 13px; background: #ffffff; color: #12203f; box-sizing: border-box; }' });
    L.push({ s: 'form button.form-submit { align-self: flex-start; padding: 9px 18px; border: none; border-radius: 6px; background: #203a5b; color: #ffffff; font-weight: 600; cursor: pointer; }' });
  }

  // 📱 Responsive Styles for Mobile Phones & Small Screen Devices (Media Query)
  // Only injected when "Generate Responsive CSS" toggle is ON (S.responsiveCSS === true)
  if (S.responsiveCSS) {
    L.push({ s: '' });
    L.push({ s: '/* ============================================================ */' });
    L.push({ s: '/* 📱 RESPONSIVE STYLES FOR MOBILE PHONES (max-width: 768px)  */' });
    L.push({ s: '/* ============================================================ */' });
    L.push({ s: '@media (max-width: 768px) {', fold: 'start', fk: 'css-media-mobile', tag: '}' });
    L.push({ s: '  html, body {', parentFk: 'css-media-mobile' });
    L.push({ s: '    overflow-x: hidden !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  main {', parentFk: 'css-media-mobile' });
    L.push({ s: '    display: flex !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    flex-direction: column !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    gap: 16px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 14px 12px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    min-height: auto !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    box-sizing: border-box !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  /* Stack canvas elements vertically (1 full column) */', parentFk: 'css-media-mobile' });
    L.push({ s: '  main > * {', parentFk: 'css-media-mobile' });
    L.push({ s: '    grid-column: auto !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    grid-row: auto !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    min-height: auto !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    box-sizing: border-box !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  header {', parentFk: 'css-media-mobile' });
    L.push({ s: '    display: flex !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    flex-direction: column !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    align-items: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    text-align: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    gap: 10px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 14px 10px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  nav {', parentFk: 'css-media-mobile' });
    L.push({ s: '    display: flex !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    flex-wrap: wrap !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    justify-content: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    align-items: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    gap: 8px 14px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 6px 4px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  nav a, nav details.nav-dropdown summary {', parentFk: 'css-media-mobile' });
    L.push({ s: '    display: inline-block !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 4px 8px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    font-size: 13px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  a.btn-cta, button {', parentFk: 'css-media-mobile' });
    L.push({ s: '    display: inline-flex !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: auto !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    max-width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    align-self: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 10px 22px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    font-size: 14px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    border-radius: 8px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  section.hero, .hero {', parentFk: 'css-media-mobile' });
    L.push({ s: '    min-height: 160px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 24px 16px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    text-align: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  article, .card {', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 18px 16px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    box-sizing: border-box !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  figure {', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    min-height: 180px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    max-height: 280px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    box-sizing: border-box !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  figure img {', parentFk: 'css-media-mobile' });
    L.push({ s: '    width: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    height: 100% !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    object-fit: cover !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '  footer {', parentFk: 'css-media-mobile' });
    L.push({ s: '    text-align: center !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '    padding: 18px 12px !important;', parentFk: 'css-media-mobile' });
    L.push({ s: '  }', parentFk: 'css-media-mobile' });
    L.push({ s: '}', fold: 'end', fk: 'css-media-mobile', tag: '}' });
  }

  return L;
}

function htmlLines() {
  const curTitle = (S.pages[S.curPage] && S.pages[S.curPage].name) || 'My Website';
  const htmlLang = S.lang === 'ms' ? 'ms' : 'en';
  const h = [
    { s: '<!DOCTYPE html>' },
    { s: `<html lang="${htmlLang}">`, fold: 'start', fk: 'html', tag: 'html' },
    { s: '<head>', fold: 'start', fk: 'head', tag: 'head', parentFk: 'html' },
    { s: '  <meta charset="utf-8">', parentFk: 'head' },
    { s: '  <meta name="viewport" content="width=device-width, initial-scale=1">', parentFk: 'head' },
    { s: `  <title>${esc(curTitle)}</title>`, parentFk: 'head' }
  ];

  if (S.hasCss) {
    h.push({ s: '  <!-- Google Fonts -->' });
    h.push({ s: '  <link rel="preconnect" href="https://fonts.googleapis.com">' });
    h.push({ s: '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' });
    h.push({ s: '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lato:wght@400;700&family=Lora:wght@400;600;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Roboto:wght@400;500;700&family=Source+Sans+3:wght@400;500;600;700&display=swap">' });

    if (S.sty == 'ext' || S.sty == 'all') {
      h.push({ s: '  <!-- 1. External CSS: Stylesheet for grid layout -->', parentFk: 'head', isCss: true });
      h.push({ s: '  <link rel="stylesheet" href="style.css">', parentFk: 'head', isCss: true });
    } else if (S.sty == 'tw') {
      h.push({ s: '  <script src="https://cdn.tailwindcss.com/3.4.17"><\/script>', parentFk: 'head', isCss: true });
    }
    if (sl()) h.push({ s: '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css">', parentFk: 'head' });
    if (S.sty == 'int') {
      if (S.blocks.length) {
        h.push({ s: '  <style>', fold: 'start', fk: 'style', tag: 'style', parentFk: 'head', isCss: true });
        getCssRules().forEach(r => h.push({ s: '    ' + r.s, id: r.id, parentFk: 'style', isCss: true }));
        h.push({ s: '  </style>', fold: 'end', fk: 'style', tag: 'style', parentFk: 'head', isCss: true });
      }
    } else if (S.sty == 'all') {
      h.push({ s: '  <!-- 2. Internal CSS: Page-specific typography and theme styles -->', parentFk: 'head', isCss: true });
      h.push({ s: '  <style>', fold: 'start', fk: 'style', tag: 'style', parentFk: 'head', isCss: true });
      h.push({ s: '    body { font-family: "Inter", system-ui, sans-serif; background-color: #f8fafc; }', parentFk: 'style', isCss: true });
      h.push({ s: '    h1, h2 { letter-spacing: -0.5px; }', parentFk: 'style', isCss: true });
      h.push({ s: '  </style>', fold: 'end', fk: 'style', tag: 'style', parentFk: 'head', isCss: true });
    }
  }

  h.push({ s: '</head>', fold: 'end', fk: 'head', tag: 'head', parentFk: 'html' });
  h.push({ s: '<body>', fold: 'start', fk: 'body', tag: 'body', parentFk: 'html' });
  const bLines = S.blocks.length ? body(S.sty) : [{ s: '  <!-- Drop blocks on canvas, code appears here -->', parentFk: 'body' }];
  bLines.forEach(l => { if (!l.parentFk) l.parentFk = 'body'; });

  const f = [];
  if (S.hasJs) {
    if (sl()) f.push({ s: '  <script src="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js"><\/script>', parentFk: 'body' });
    f.push({ s: '  <script src="script.js"><\/script>', parentFk: 'body' });
  }
  f.push({ s: '</body>', fold: 'end', fk: 'body', tag: 'body', parentFk: 'html' });
  f.push({ s: '</html>', fold: 'end', fk: 'html', tag: 'html' });
  return h.concat(bLines, f);
}

function css() {
  const isMs = (S.lang === 'ms');
  if (!S.hasCss) {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* CSS SEDANG DIMATIKAN (MOD ASAS HTML)                         */' : '/* CSS DISABLED (PURE HTML MODE)                                 */' },
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* Pelajar kini melihat HTML mentah mengikut gaya lalai browser.*/' : '/* Viewing raw HTML rendered with default browser styles.       */' },
      { s: isMs ? '/* Tiada fail style.css atau tag <style> disertakan.           */' : '/* No style.css file or <style> tags are included.               */' },
      { s: '/* ============================================================ */' }
    ];
  }
  if (!S.blocks || !S.blocks.length) {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* Belum ada peraturan CSS.                                    */' : '/* No CSS rules generated yet.                                  */' },
      { s: isMs ? '/* Seret atau pilih elemen pada kanvas untuk reka gaya.        */' : '/* Drag or select elements on canvas to generate styling.        */' },
      { s: '/* ============================================================ */' }
    ];
  }
  if (S.sty == 'tw') {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* FAIL style.css DIMATIKAN (MOD TAILWIND CSS AKTIF)           */' : '/* style.css INACTIVE (TAILWIND CSS UTILITY MODE ACTIVE)         */' },
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* Gaya ditulis menggunakan class utiliti Tailwind pada tag   */' : '/* Styles are written as Tailwind utility classes on tags        */' },
      { s: isMs ? '/* di tab "📄 index.html". CDN dimuatkan dalam <head>.         */' : '/* in the "📄 index.html" tab. Tailwind CDN loaded in <head>.    */' },
      { s: '/* ============================================================ */' }
    ];
  }
  if (S.sty == 'inl') {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* FAIL style.css DIMATIKAN (MOD INLINE CSS AKTIF)             */' : '/* style.css INACTIVE (INLINE CSS MODE ACTIVE)                  */' },
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* Semua gaya CSS berada terus pada atribut style="..."        */' : '/* All CSS styles reside directly inside style="..." attributes   */' },
      { s: isMs ? '/* setiap tag di tab "📄 index.html".                          */' : '/* of each tag in the "📄 index.html" tab.                       */' },
      { s: isMs ? '/* Tiada fail style.css digunakan untuk mod ini.               */' : '/* No style.css file is used for this mode.                      */' },
      { s: '/* ============================================================ */' }
    ];
  }
  if (S.sty == 'int') {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* FAIL style.css DIMATIKAN (MOD INTERNAL CSS AKTIF)           */' : '/* style.css INACTIVE (INTERNAL CSS MODE ACTIVE)                */' },
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* Semua gaya CSS berada di dalam tag <style> pada tab         */' : '/* All CSS styles reside inside <style> tag in the               */' },
      { s: isMs ? '/* "📄 index.html" (bahagian <head>).                          */' : '/* "📄 index.html" tab (<head> section).                         */' },
      { s: isMs ? '/* Tiada peraturan CSS disimpan dalam fail berasingan ini.    */' : '/* No CSS rules are stored in this external stylesheet.         */' },
      { s: '/* ============================================================ */' }
    ];
  }
  if (S.sty == 'all') {
    return [
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* EXTERNAL CSS (Fail style.css - Sebahagian Mod 3-in-1)        */' : '/* EXTERNAL CSS (style.css - Part of 3-in-1 Cascading Mode)      */' },
      { s: '/* ============================================================ */' },
      { s: isMs ? '/* 1. EXTERNAL CSS (Fail ini): Menyimpan grid utama & susunan. */' : '/* 1. EXTERNAL CSS (This file): Stores main grid & page layout.  */' },
      { s: isMs ? '/* 2. INTERNAL CSS: Ditulis di <head> fail HTML (tema halaman).*/' : '/* 2. INTERNAL CSS: Written in <head> of HTML (page theme).     */' },
      { s: isMs ? '/* 3. INLINE CSS: Atribut style="..." menindih (override) gaya.*/' : '/* 3. INLINE CSS: style="..." attributes override higher rules.  */' },
      { s: isMs ? '/* Keutamaan: Inline > Internal > External (Cascading Order)  */' : '/* Specificity: Inline > Internal > External (Cascading Order)  */' },
      { s: '/* ============================================================ */' },
      { s: '' }
    ].concat(getCssRules());
  }
  return getCssRules();
}

function js() {
  const isMs = (S.lang === 'ms');
  if (!S.hasJs) {
    return [
      { s: '// ============================================================' },
      { s: isMs ? '// ⚠️ JavaScript sedang dimatikan (Mod Pembelajaran HTML & CSS).' : '// ⚠️ JavaScript is currently disabled (HTML & CSS learning mode).' },
      { s: isMs ? '// Tekan butang "+ JS" di bar atas untuk mengaktifkan skrip interaktif.' : '// Click "+ JS" on the top toolbar to enable interactive scripting.' },
      { s: '// ============================================================' }
    ];
  }
  const sd = S.blocks.find(b => b.type == 'slider');
  const L = [
    { s: '/**' },
    { s: ' * BLUEPRINT CODE STUDIO - Interactive Script (script.js)' },
    { s: isMs ? ' * Menguruskan interaksi butang, tatalan lancar, dan kesan dinamik.' : ' * Handles button interactions, smooth scrolling, and dynamic features.' },
    { s: ' */' },
    { s: '' },
    { s: isMs ? '// 1. Menunggu dokumen HTML siap dimuatkan sepenuhnya (DOM Ready)' : '// 1. Wait for HTML document to finish loading (DOM Ready)' },
    { s: 'document.addEventListener("DOMContentLoaded", () => {' },
    { s: '  console.log("🚀 Website successfully loaded!");' },
    { s: '' },
    { s: isMs ? '  // 2. Interaktiviti untuk butang CTA dan pautan' : '  // 2. Interactivity for CTA buttons and links' },
    { s: '  document.querySelectorAll("a, button").forEach(elem => {' },
    { s: '    elem.addEventListener("click", e => {' },
    { s: '      const href = elem.getAttribute("href");' },
    { s: '      if (href === "#" || !href) {' },
    { s: '        e.preventDefault();' },
    { s: '        console.log("Clicked button/link:", elem.textContent.trim());' },
    { s: '      }' },
    { s: '    });' },
    { s: '  });' },
    { s: '' },
    { s: isMs ? '  // 3. Tatalan lancar untuk pautan sauh (#)' : '  // 3. Smooth scrolling for anchor navigation links (#)' },
    { s: '  document.querySelectorAll(\'a[href^="#"]\').forEach(anchor => {' },
    { s: '    anchor.addEventListener("click", function(e) {' },
    { s: '      const targetId = this.getAttribute("href").substring(1);' },
    { s: '      const targetElem = document.getElementById(targetId);' },
    { s: '      if (targetElem) {' },
    { s: '        e.preventDefault();' },
    { s: '        targetElem.scrollIntoView({ behavior: "smooth" });' },
    { s: '      }' },
    { s: '    });' },
    { s: '  });' }
  ];

  if (sd) {
    L.push({ s: '' });
    L.push({ s: isMs ? '  // 4. Inisialisasi Carousel Bergilir (Swiper Slider Autoplay)' : '  // 4. Initialize Image Carousel (Swiper Slider Autoplay)' });
    L.push({ s: '  if (document.querySelector(".swiper")) {' });
    L.push({ s: '    const swiper = new Swiper(".swiper", {' });
    L.push({ s: '      loop: true,' });
    L.push({ s: '      autoplay: { delay: 3000 },' });
    L.push({ s: '      pagination: { el: ".swiper-pagination", clickable: true },' });
    L.push({ s: '    });' });
    L.push({ s: '  }' });
  }

  if (S.blocks.some(b => b.type === 'form')) {
    L.push({ s: '' });
    L.push({ s: isMs ? '  // 5. Pengendalian Penghantaran Borang (<form>)' : '  // 5. Form submission handling (<form>)' });
    L.push({ s: '  document.querySelectorAll("form").forEach(form => {' });
    L.push({ s: '    form.addEventListener("submit", e => {' });
    L.push({ s: '      e.preventDefault();' });
    L.push({ s: isMs ? '      console.log("📩 Borang berjaya dihantar!");' : '      console.log("📩 Form submitted successfully!");' });
    L.push({ s: '      form.reset();' });
    L.push({ s: '    });' });
    L.push({ s: '  });' });
  }

  L.push({ s: '});' });
  return L;
}

function hl(s, t, cssHl, commentRange = null) {
  if (commentRange) {
    const [start, end] = commentRange;
    if (start === 0 && end === s.length) return `<i class="c">${esc(s)}</i>`;
    return `${hl(s.slice(0, start), t, cssHl)}<i class="c">${esc(s.slice(start, end))}</i>${hl(s.slice(end), t, cssHl)}`;
  }
  if (/^\s*(\/\/|\/\*|<!--)/.test(s)) return `<i class="c">${esc(s)}</i>`;
  s = esc(s);
  if (t == 'css') {
    let out = s.replace(/^(\s*)([\w-]+)(:)/, '$1<i class=p>$2</i>$3').replace(/^(\.[\w-]+)/, '<i class=t>$1</i>');
    if (cssHl) {
      out = out.replace(/(:)([^;{}]+)(;?)/, '$1<i class=v>$2</i>$3');
    }
    return out;
  }
  if (t == 'js') return s.replace(/(".*?")/g, '<i class=v>$1</i>').replace(/\b(const|let|var|document|function|if|return)\b/g, '<i class=a>$1</i>');
  return s.replace(/(&lt;\/?)([\w!-]+)/g, '$1<i class=t>$2</i>').replace(/([\w-]+)="([^"]*)"/g, (m, a, v) => {
    if (cssHl && a == 'style') {
      return `<mark class="css-hl-mark">${a}="<i class=v>${v}</i>"</mark>`;
    }
    return `<i class=a>${a}</i>=<i class=v>"${v}"</i>`;
  });
}

function preview() {
  const fontLinks = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lato:wght@400;700&family=Lora:wght@400;600;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Roboto:wght@400;500;700&family=Source+Sans+3:wght@400;500;600;700&display=swap">`;

  // Friendly info card when canvas is empty
  const isMs = S.lang === 'ms';
  if (!S.blocks || S.blocks.length === 0) {
    const pageTitle = (S.pages && S.pages[S.curPage] && S.pages[S.curPage].name) ? S.pages[S.curPage].name : (S.curPage || 'index.html');
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${isMs ? 'Hasil' : 'Preview'} - ${qa(pageTitle)}</title>
    ${fontLinks}
    <style>
      body{margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:90vh;padding:20px;box-sizing:border-box}
      .empty-box{background:#ffffff;border:2px dashed #cbd5e1;border-radius:12px;padding:36px 28px;text-align:center;max-width:440px;box-shadow:0 6px 18px rgba(0,0,0,0.04)}
      .empty-ic{font-size:44px;margin-bottom:12px;line-height:1}
      h2{margin:0 0 8px;font-size:18px;color:#0f172a;font-weight:700}
      p{margin:0;font-size:13.5px;color:#64748b;line-height:1.55}
      .badge{display:inline-block;margin-top:14px;padding:4px 10px;background:#e0f2fe;color:#0369a1;border-radius:999px;font-size:12px;font-weight:600}
    </style>
    </head><body>
      <div class="empty-box">
        <div class="empty-ic">📄</div>
        <h2>${isMs ? `Halaman &ldquo;${qa(pageTitle)}&rdquo; Masih Kosong` : `Page &ldquo;${qa(pageTitle)}&rdquo; is Empty`}</h2>
        <p>${isMs ? 'Belum ada elemen diletakkan pada kanvas ini.<br>Tukar ke mod <b>Reka</b> di bar atas untuk menyeret elemen atau pilih <b>Templat</b> di panel kiri.' : 'There are no elements on this canvas yet.<br>Switch to <b>Design</b> mode in the top bar to drag elements or select a <b>Template</b> from the left panel.'}</p>
        <div class="badge">💡 ${isMs ? 'Mod Pratonton Langsung' : 'Live Preview Mode'}</div>
      </div>
    </body></html>`;
  }

  if (!S.hasCss) {
    const bRaw = body('ext').map(l => l.s).join('\n');
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${isMs ? 'Pratonton (HTML Sahaja)' : 'Preview (HTML Only)'}</title>
    ${fontLinks}
    <style>
      body{margin:20px;font-family:serif;color:#000;background:#fff;line-height:1.4}
      h1,h2{margin:12px 0 6px}
      a{color:#0000ee;text-decoration:underline;margin-right:8px}
      figure{margin:12px 0;padding:10px;border:1px dashed #888;background:#f5f5f5;display:inline-block}
      figure img{display:none}
      figure::before{content:"${isMs ? '[ Imej Mockup (HTML Tanpa CSS) ]' : '[ Image Mockup (HTML Without CSS) ]'}";color:#555;font-style:italic}
      header,nav,section,article,footer,aside{display:block;margin-bottom:14px;border-bottom:1px dotted #ccc;padding-bottom:10px}
    </style>
    </head><body>
    ${bRaw}
    ${S.hasJs ? `<script>document.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{if(a.getAttribute('href')=='#'){e.preventDefault();const t=document.createElement('div');t.style='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b3d91;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:Inter,system-ui;';t.textContent='${isMs ? 'Pautan diklik (JavaScript aktif)' : 'Link clicked (JavaScript active)'}';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);}}));<\/script>` : ''}
    </body></html>`;
  }
  const cs = getCssRules().map(l => l.s).join('\n');
  const b = body(S.sty).map(l => l.s).join('\n');
  const extraCss = S.sty == 'all' ? 'body{font-family:Inter,system-ui,sans-serif;background-color:#f8fafc}h1,h2{letter-spacing:-0.5px}' : '';
  const rowH = S.gridRowH || 40;
  const gap = S.gridGap !== undefined ? S.gridGap : 8;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${fontLinks}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14px/1.5 'Inter', system-ui, -apple-system, sans-serif;
      color: #12203f;
      background: #ffffff;
      min-height: 100vh;
    }
    main, #main, .main-container {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: ${rowH}px;
      gap: ${gap}px;
      padding: 16px;
      min-height: 100vh;
      box-sizing: border-box;
    }
    h1, h2, h3, h4, h5, h6, p, a, span, label, div {
      margin: 0;
      font-family: inherit;
      color: inherit;
      line-height: 1.35;
    }
    h1 { font-size: 22px; font-weight: 700; }
    h2 { font-size: 18px; font-weight: 600; }
    p { font-size: 14px; }
    a { color: inherit; text-decoration: none; }
    a.btn-cta, button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
    }
    a.btn-cta:hover { transform: translateY(-1px); opacity: 0.9; }
    figure {
      margin: 0;
      padding: 0;
      position: relative;
      overflow: hidden;
      border-radius: inherit;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    figure img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }
    figcaption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.65);
      color: #ffffff;
      font-size: 11px;
      backdrop-filter: blur(4px);
    }
    .swiper-slide {
      background: #082f73;
      color: #fff;
      padding: 20px;
      text-align: center;
      font-weight: 600;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .swiper-pagination { position: relative; margin-top: 4px; }
    details summary {
      cursor: pointer;
      font-weight: 600;
      padding: 4px 8px;
      background: rgba(0,0,0,.08);
      border-radius: 4px;
      list-style: none;
    }
    details[open] summary { margin-bottom: 6px; }
    .dropdown-content {
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dropdown-content a {
      color: #082f73;
      text-decoration: none;
      padding: 4px;
      display: block;
      border-radius: 3px;
    }
    .dropdown-content a:hover { background: #edf2f7; }
    form { display: flex; flex-direction: column; gap: 10px; }
    form .form-group { display: flex; flex-direction: column; gap: 4px; text-align: left; }
    form label { font-size: 12.5px; font-weight: 600; opacity: 0.9; }
    form input, form textarea { width: 100%; padding: 8px 10px; border: 1px solid rgba(18,32,63,0.22); border-radius: 6px; font: inherit; font-size: 13px; background: #ffffff; color: #12203f; box-sizing: border-box; }
    form button.form-submit { align-self: flex-start; padding: 9px 18px; border: none; border-radius: 6px; background: #203a5b; color: #ffffff; font-weight: 600; cursor: pointer; }
    ${cs}
    ${extraCss}
  </style>
  ${sl() ? '<script src="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js"><\/script>' : ''}
  </head><body>${b}
  ${S.hasJs ? `<script>
  if(document.querySelector('.swiper')){new Swiper('.swiper',{loop:true,autoplay:{delay:2500}})}
  document.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{if(a.getAttribute('href')=='#'){e.preventDefault();const t=document.createElement('div');t.style='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b3d91;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:Inter,system-ui;';t.textContent='${isMs ? 'Pautan/Butang diklik!' : 'Link/Button clicked!'}';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);}}));
  document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const t=document.createElement('div');t.style='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:Inter,system-ui;';t.textContent='${isMs ? '📩 Mesej borang telah dihantar!' : '📩 Form message sent!'}';document.body.appendChild(t);f.reset();setTimeout(()=>t.remove(),2500);}));
  <\/script>` : ''}
  </body></html>`;
}

function downloadFile(name, content, type) {
  const b = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Pure JS .ZIP archive builder (no external dependencies).
 * Supports UTF-8 encoding and standard PKZIP CRC32 calculation.
 * @param {Array<{name: string, content: string}>} files Project file list
 * @returns {Uint8Array} Binary ZIP archive data
 */
function createZipArchive(files) {
  const encoder = new TextEncoder();
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  const crc32 = bytes => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(file => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(String(file.content || ''));
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);         // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true);     // UTF-8 filename flag
    lv.setUint16(8, 0, true);          // Compression method: 0 (Stored)
    lv.setUint16(10, 0, true);         // Mod time
    lv.setUint16(12, 0x5421, true);    // Mod date
    lv.setUint32(14, crc, true);       // CRC-32
    lv.setUint32(18, size, true);      // Compressed size
    lv.setUint32(22, size, true);      // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // Filename length
    lv.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed
    cv.setUint16(8, 0x0800, true);     // UTF-8 flag
    cv.setUint16(10, 0, true);         // Compression method: 0
    cv.setUint16(12, 0, true);         // Mod time
    cv.setUint16(14, 0x5421, true);    // Mod date
    cv.setUint32(16, crc, true);       // CRC-32
    cv.setUint32(20, size, true);      // Compressed size
    cv.setUint32(24, size, true);      // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // Filename length
    cv.setUint16(30, 0, true);         // Extra field length
    cv.setUint16(32, 0, true);         // File comment length
    cv.setUint16(34, 0, true);         // Disk number start
    cv.setUint16(36, 0, true);         // Internal file attributes
    cv.setUint32(38, 0, true);         // External file attributes
    cv.setUint32(42, offset, true);    // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // End of central directory signature
  ev.setUint16(4, 0, true);          // Number of this disk
  ev.setUint16(6, 0, true);          // Disk where central directory starts
  ev.setUint16(8, files.length, true); // Number of central directory records on this disk
  ev.setUint16(10, files.length, true); // Total number of central directory records
  ev.setUint32(12, centralSize, true); // Size of central directory
  ev.setUint32(16, offset, true);    // Offset of start of central directory
  ev.setUint16(20, 0, true);         // Comment length

  const totalLen = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const part of localParts) { out.set(part, pos); pos += part.length; }
  for (const part of centralParts) { out.set(part, pos); pos += part.length; }
  out.set(eocd, pos);
  return out;
}

function exportProject() {
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  const savedPage = S.curPage;
  const isExtOrAll = S.hasCss && (S.sty === 'ext' || S.sty === 'all');
  const files = [];
  const cssSections = [];

  Object.keys(S.pages).forEach(pageKey => {
    S.curPage = pageKey;
    S.blocks = S.pages[pageKey].blocks || [];
    const pageEdits = (S.codeEdits && S.codeEdits[pageKey]) || {};
    const htmlContent = Object.prototype.hasOwnProperty.call(pageEdits, 'html')
      ? pageEdits.html
      : htmlLines().map(l => l.s).join('\n');
    files.push({ name: pageKey, content: htmlContent });

    if (isExtOrAll) {
      const pageCss = Object.prototype.hasOwnProperty.call(pageEdits, 'css')
        ? pageEdits.css
        : getCssRules().map(l => l.s).join('\n');
      cssSections.push(`/* ========================================== */\n/* Page: ${pageKey} */\n/* ========================================== */\n${pageCss}`);
    }
  });

  // Restore active page
  S.curPage = savedPage;
  S.blocks = S.pages[savedPage] ? S.pages[savedPage].blocks : [];

  if (isExtOrAll) {
    files.push({ name: 'style.css', content: cssSections.join('\n\n') });
  }
  if (S.hasJs) {
    const curEdits = (S.codeEdits && S.codeEdits[savedPage]) || {};
    const jsContent = Object.prototype.hasOwnProperty.call(curEdits, 'js')
      ? curEdits.js
      : js().map(l => l.s).join('\n');
    files.push({ name: 'script.js', content: jsContent });
  }

  const isEn = S.lang === 'en';
  const readmeContent = isEn
    ? [
        'NIAN CODE STUDIO - Website Project Export Package',
        '=================================================',
        `Author: ${S.name || 'Student / Web Designer'}`,
        `Date: ${new Date().toLocaleDateString('en-US')}`,
        '',
        'Files included in this ZIP archive:',
        ...files.map(f => `- ${f.name}`),
        '',
        'How to Use:',
        '1. Extract (Unzip) nian-code-studio-project.zip into a folder.',
        '2. Open index.html in any web browser (Chrome, Edge, Firefox, Safari) or code editor (VS Code).'
      ].join('\n')
    : [
        'NIAN CODE STUDIO - Pakej Eksport Projek Laman Web',
        '=================================================',
        `Pereka: ${S.name || 'Pelajar / Pereka Web'}`,
        `Tarikh: ${new Date().toLocaleDateString('ms-MY')}`,
        '',
        'Senarai Fail dalam Arkib ZIP ini:',
        ...files.map(f => `- ${f.name}`),
        '',
        'Cara Penggunaan:',
        '1. Ekstrak (Unzip) fail nian-code-studio-projek.zip ke dalam satu folder.',
        '2. Buka fail index.html menggunakan pelayar web (Chrome, Edge, Firefox, Safari) atau editor kod (VS Code).'
      ].join('\n');
  files.push({ name: 'README.txt', content: readmeContent });

  const zipFilename = isEn ? 'nian-code-studio-project.zip' : 'nian-code-studio-projek.zip';
  const zipBytes = createZipArchive(files);
  const blob = new Blob([zipBytes], { type: 'application/zip' });
  downloadFile(zipFilename, blob, 'application/zip');

  toast(isEn
    ? `📦 Project archive (${zipFilename} with ${files.length} files) downloaded!`
    : `📦 Arkib projek (${zipFilename} mengandungi ${files.length} fail) berjaya dimuat turun!`);
}

