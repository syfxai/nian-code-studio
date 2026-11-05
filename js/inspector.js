let codeSourceSelectedElement = null;
function setCodeSourceSelectedElement(element) {
  codeSourceSelectedElement = element || null;
  S.railTab = 'ins';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  if (!isMobile) {
    S.drawerOpen = true;
    const main = $('main');
    if (main) main.classList.remove('drawer-collapsed');
  }
  document.querySelectorAll('.rail-item[data-rail]').forEach(button => button.classList.toggle('active', button.dataset.rail === 'ins'));
  const panels = { elem: $('#drawer-panel-elem'), tpl: $('#drawer-panel-tpl'), ins: $('#drawer-panel-ins'), layers: $('#drawer-panel-layers'), css: $('#drawer-panel-css'), ai: $('#drawer-panel-ai') };
  Object.entries(panels).forEach(([key, panel]) => { if (panel) panel.hidden = key !== 'ins'; });
  if ($('#drawer-title')) $('#drawer-title').textContent = S.lang === 'en' ? 'Element Settings' : 'Tetapan elemen';
  if ($('#drawer-icon')) $('#drawer-icon').textContent = '⚙️';
  if ($('#ti')) $('#ti').setAttribute('aria-pressed', 'true');
  renderIns();
}
function getCodeSourceSelectedElement() { return codeSourceSelectedElement && codeSourceSelectedElement.isConnected ? codeSourceSelectedElement : null; }
function pickAndCompressImage(onReady) {
  let fileInput = $('#studio-hidden-img-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'studio-hidden-img-input';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;
    document.body.appendChild(fileInput);
  }
  fileInput.value = '';
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const dataUrl = typeof compressImageFileToDataUrl === 'function'
        ? await compressImageFileToDataUrl(file, 1200, 0.82)
        : URL.createObjectURL(file);
      if (typeof onReady === 'function') onReady(dataUrl);
    } catch (_) {
      toast(S.lang === 'en' ? 'Could not process selected image file.' : 'Gagal memproses fail gambar yang dipilih.');
    }
  };
  fileInput.click();
}
function sourceInputColor(value, fallback = '#ffffff') {
  if (/^#[0-9a-f]{6}$/i.test(value || '')) return value;
  const match = String(value || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return match ? '#' + match.slice(1, 4).map(x => (+x).toString(16).padStart(2, '0')).join('') : fallback;
}

function sourceDimensionInfo(element, property) {
  const computed = element.ownerDocument.defaultView.getComputedStyle(element);
  const raw = (element.style[property] || computed[property] || 'auto').trim();
  const match = raw.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*(px|%|vw|vh|rem|em)?$/i);
  if (match) return { value: match[1], unit: (match[2] || 'px').toLowerCase() };
  if (raw === 'auto' || raw === 'fit-content' || raw === 'max-content' || raw === 'min-content') return { value: '', unit: 'auto' };
  const pixels = computed[property].match(/^-?(?:\d+\.?\d*|\.\d+)px$/i);
  return pixels ? { value: parseFloat(pixels[0]), unit: 'px' } : { value: '', unit: 'auto' };
}

function sourceDimensionControl(element, property, label) {
  const dimension = sourceDimensionInfo(element, property);
  const units = ['px', '%', 'vw', 'vh', 'rem', 'em', 'auto'];
  return `<div class="source-dimension-field"><label class="ins-label">${label}</label><div class="source-dimension-control"><input type="number" step="any" data-source-property="${property}" value="${qa(String(dimension.value))}" aria-label="${label}"${dimension.unit === 'auto' ? ' disabled' : ''}><select data-source-unit="${property}" aria-label="Unit ${label}">${units.map(unit => `<option value="${unit}"${unit === dimension.unit ? ' selected' : ''}>${unit}</option>`).join('')}</select></div></div>`;
}

function applySourceDimension(element, property, control) {
  const row = control.closest('.source-dimension-control');
  const input = row && row.querySelector(`[data-source-property="${property}"]`);
  const unit = row && row.querySelector(`[data-source-unit="${property}"]`)?.value;
  if (!input || !unit) return;
  input.disabled = unit === 'auto';
  if (unit === 'auto') element.style[property] = 'auto';
  else if (input.value !== '') element.style[property] = `${input.value}${unit}`;
  syncCodeCanvasFrame();
}

function sourceNavigationContext(element) {
  if (!element || !element.closest) return null;
  const navSelector = 'nav,[role="navigation"],.navbar,.navigation,[class~="nav"]';
  let container = element.matches(navSelector) ? element : element.closest(navSelector);
  if (!container && element.matches('header') && element.querySelector(navSelector)) container = element.querySelector(navSelector);
  if (!container) container = element.closest('header');
  if (!container) {
    let ancestor = element.parentElement;
    while (ancestor && ancestor.tagName !== 'BODY') {
      const count = ancestor.querySelectorAll('a').length;
      if (count >= 2 && count <= 16) { container = ancestor; break; }
      ancestor = ancestor.parentElement;
    }
  }
  if (!container) return null;
  const explicitNavigation = container.matches(navSelector);
  const links = Array.from(container.querySelectorAll('a')).filter(link => explicitNavigation
    ? link.closest(navSelector) === container
    : link.closest(navSelector) === null && container.contains(link));
  if (!explicitNavigation && links.length < 2) return null;
  const dropdown = element.closest('details,.nav-dropdown,.dropdown');
  const activeLink = element.matches('a') ? element : element.closest('a');
  const topLinks = links.filter(link => !link.closest('details,.nav-dropdown .dropdown-content,.dropdown-content'));
  return { container, links, topLinks: topLinks.length ? topLinks : links, activeLink, dropdown };
}

function sourceDropdownParts(dropdown) {
  if (!dropdown) return { label: null, content: null, links: [] };
  const label = dropdown.querySelector(':scope > summary, :scope > .nav-drop-btn, :scope > button');
  let content = dropdown.querySelector(':scope > .dropdown-content');
  if (!content) content = dropdown.querySelector(':scope > ul, :scope > div:not(.nav-drop-btn)');
  return { label, content, links: content ? Array.from(content.querySelectorAll('a')) : Array.from(dropdown.querySelectorAll('a')) };
}
const sourceDropdownHref = new WeakMap();

function renderSourceNavigationInspector(panel, element, context) {
  const isEn = S.lang === 'en';
  const { container, topLinks, activeLink, dropdown } = context;
  const isDropdown = !!dropdown;
  const activeDropdown = isDropdown ? dropdown : null;
  const parts = sourceDropdownParts(activeDropdown);
  const navButtons = topLinks.map((link, index) => {
    const isActive = link === activeLink || link.contains(element);
    const hasDropdown = !!link.closest('details,.nav-dropdown,.dropdown');
    return `<button type="button" class="ins-choice${isActive ? ' active' : ''}" data-source-nav-select="${index}">${hasDropdown ? '▾ ' : ''}${esc((link.textContent || '').trim() || (isEn ? `Link ${index + 1}` : `Pautan ${index + 1}`))}</button>`;
  }).join('');
  const activeTopLink = activeLink && topLinks.includes(activeLink) ? activeLink : topLinks[0];
  const dropdownLabel = parts.label ? (parts.label.textContent || '').replace(/\s*▾\s*$/, '').trim() : '';
  const dropdownItems = parts.links.map((link, index) => `<div class="source-nav-item-row"><span>${index + 1}.</span><input type="text" data-source-dropdown-item="${index}" value="${qa((link.textContent || '').trim())}" aria-label="${isEn ? 'Option' : 'Pilihan'} ${index + 1}"><button type="button" data-source-dropdown-delete="${index}" aria-label="${isEn ? 'Delete option' : 'Padam pilihan'} ${index + 1}">×</button></div>`).join('');

  panel.innerHTML = `<section class="ins-section code-source-element source-navigation">
    <div class="ins-section-heading">${isEn ? 'Navigation' : 'Navigasi'} <code>&lt;${container.tagName.toLowerCase()}&gt;</code></div>
    <p class="ins-help">${isEn ? 'Links in this code can be managed here, just like the studio navigation menu.' : 'Pautan dalam kod ini boleh diurus di sini, sama seperti menu navigasi studio.'}</p>
    <div class="source-nav-links">${navButtons || `<span class="ins-help">${isEn ? 'No links in this section yet.' : 'Belum ada pautan dalam bahagian ini.'}</span>`}</div>
    <div class="source-nav-actions"><button type="button" class="ins-action-btn" data-source-nav-add>${isEn ? '+ Add link' : '+ Tambah pautan'}</button>
      ${activeTopLink && !activeTopLink.closest('details,.nav-dropdown,.dropdown') ? `<button type="button" class="ins-action-btn" data-source-nav-dropdown>${isEn ? '▾ Convert to dropdown' : '▾ Tukar kepada dropdown'}</button>` : ''}
      ${isDropdown ? `<button type="button" class="ins-action-btn" data-source-dropdown-revert>${isEn ? 'Revert to regular link' : 'Tukar semula kepada pautan'}</button>` : ''}
    </div>
    ${isDropdown ? `<div class="source-dropdown-editor">
      <label class="ins-label">${isEn ? 'Menu label' : 'Nama menu'}</label><input type="text" data-source-dropdown-label value="${qa(dropdownLabel)}">
      <div class="ins-section-heading">${isEn ? 'Menu options' : 'Pilihan menu'}</div>
      <div class="source-dropdown-items">${dropdownItems}</div>
      <button type="button" class="ins-action-btn" data-source-dropdown-add>${isEn ? '+ Add option' : '+ Tambah pilihan'}</button>
    </div>` : activeTopLink ? `<div class="source-link-editor">
      <label class="ins-label">${isEn ? 'Link label' : 'Nama pautan'}</label><input type="text" data-source-property="text" value="${qa((activeTopLink.textContent || '').trim())}">
      <label class="ins-label">${isEn ? 'Target URL' : 'Alamat yang dibuka'}</label><input type="text" data-source-property="href" value="${qa(activeTopLink.getAttribute('href') || '')}" placeholder="${isEn ? 'https://... or page.html' : 'https://... atau halaman.html'}">
    </div>` : ''}
    <button type="button" class="ins-action-btn" data-import-code-to-blocks style="margin-bottom:6px;background:rgba(0,212,255,0.12);border-color:var(--cy)">${isEn ? '⚡ Convert Custom HTML to Visual Blocks' : '⚡ Tukar HTML Bebas ke Blok Visual'}</button>
    <button type="button" class="ins-action-btn" data-reset-code-source>${isEn ? 'Return to visual blocks' : 'Kembali ke blok visual'}</button>
  </section>`;
}

function insertCodeSourceElement(requestedType) {
  const isEn = S.lang === 'en';
  const frame = $('#cv .code-source-frame');
  const doc = frame && frame.contentDocument;
  if (!doc || !doc.body) return false;
  const tagMap = { text:'p', heading:'h1', button:'a', card:'article', image:'img', nav:'nav', hero:'section', box:'div' };
  const tag = tagMap[requestedType] || requestedType;
  if (!/^(?:h[1-6]|p|a|img|section|article|header|nav|footer|aside|div|button)$/.test(tag)) return false;
  const element = doc.createElement(tag);
  if (tag === 'img') { element.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'; element.alt = isEn ? 'New image' : 'Gambar baharu'; element.style.maxWidth = '100%'; }
  else if (tag === 'a') { element.href = '#'; element.textContent = isEn ? 'New link' : 'Pautan baharu'; }
  else if (tag === 'nav') { element.innerHTML = isEn ? '<a href="#">Link 1</a> <a href="#">Link 2</a>' : '<a href="#">Pautan 1</a> <a href="#">Pautan 2</a>'; }
  else if (tag === 'h1') element.textContent = isEn ? 'New heading' : 'Tajuk baharu';
  else if (tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer') { element.textContent = isEn ? 'New section' : 'Bahagian baharu'; element.style.padding = '16px'; }
  else element.textContent = isEn ? 'New text' : 'Teks baharu';
  const selected = getCodeSourceSelectedElement();
  const canContain = ['BODY','MAIN','HEADER','NAV','SECTION','ARTICLE','ASIDE','FOOTER','DIV','UL','OL'].includes(selected && selected.tagName);
  const container = canContain ? selected : (selected && selected.parentElement) || doc.body;
  if (selected && container === selected) container.appendChild(element);
  else if (selected && selected.parentElement === container) container.insertBefore(element, selected.nextSibling);
  else container.appendChild(element);
  setCodeSourceSelectedElement(element);
  syncCodeCanvasFrame();
  return true;
}
function renderCodeSourceInspector() {
  const isEn = S.lang === 'en';
  const panel = $('#inspector-content');
  const element = getCodeSourceSelectedElement();
  if (!element) {
    panel.innerHTML = `<div class="ins-empty code-source-help"><b>${isEn ? 'Custom Code Page' : 'Halaman kod bebas'}</b><span>${isEn ? 'Click any text or element on the canvas to select it. Edit text directly or use the controls here.' : 'Klik teks atau elemen pada kanvas untuk pilih. Sunting teks terus atau gunakan kawalan di sini.'}</span><div class="code-source-inserts"><button type="button" data-code-source-insert="h1">${isEn ? '+ Heading' : '+ Tajuk'}</button><button type="button" data-code-source-insert="p">${isEn ? '+ Text' : '+ Teks'}</button><button type="button" data-code-source-insert="a">${isEn ? '+ Link' : '+ Pautan'}</button><button type="button" data-code-source-insert="img">${isEn ? '+ Image' : '+ Gambar'}</button><button type="button" data-code-source-insert="section">${isEn ? '+ Section' : '+ Bahagian'}</button></div><button type="button" class="ins-action-btn" data-import-code-to-blocks style="margin-bottom:6px;background:rgba(0,212,255,0.12);border-color:var(--cy)">${isEn ? '⚡ Convert Custom HTML to Visual Blocks' : '⚡ Tukar HTML Bebas ke Blok Visual'}</button><button type="button" class="ins-action-btn" data-reset-code-source>${isEn ? 'Return to visual blocks' : 'Kembali ke blok visual'}</button></div>`;
    return;
  }
  const navigation = sourceNavigationContext(element);
  if (navigation) {
    renderSourceNavigationInspector(panel, element, navigation);
    return;
  }
  const tag = element.tagName.toLowerCase();
  const isImage = tag === 'img';
  const text = isImage ? (element.getAttribute('alt') || '') : (element.innerText || element.textContent || '').trim();
  const computed = element.ownerDocument.defaultView.getComputedStyle(element);
  const fontSize = parseInt(element.style.fontSize || computed.fontSize, 10) || 16;
  const align = element.style.textAlign || computed.textAlign || 'left';
  const objectFit = element.style.objectFit || computed.objectFit || 'fill';
  panel.innerHTML = `<section class="ins-section code-source-element"><div class="ins-section-heading">${isEn ? 'Selected element' : 'Elemen dipilih'} <code>&lt;${tag}&gt;</code></div>
    ${isImage ? `<label class="ins-label">${isEn ? 'Image URL' : 'Pautan gambar'}</label><input type="url" data-source-property="src" value="${qa(element.getAttribute('src') || '')}" placeholder="https://..."><button type="button" class="ins-action-btn" data-upload-source-img style="margin:6px 0;width:100%">${isEn ? '📁 Upload Image (Auto-Compressed)' : '📁 Muat Naik Gambar (Mampat Auto)'}</button><label class="ins-label">${isEn ? 'Image alt description' : 'Teks penerangan gambar'}</label><input type="text" data-source-property="alt" value="${qa(text)}"><div class="source-dimensions">${sourceDimensionControl(element, 'width', isEn ? 'Width' : 'Lebar')}${sourceDimensionControl(element, 'height', isEn ? 'Height' : 'Tinggi')}</div><label class="ins-label">${isEn ? 'Object fit mode' : 'Cara muat dalam ruang'}</label><select data-source-property="objectFit"><option value="fill"${objectFit === 'fill' ? ' selected' : ''}>${isEn ? 'Stretch to fit' : 'Regang ikut ruang'}</option><option value="contain"${objectFit === 'contain' ? ' selected' : ''}>${isEn ? 'Contain full image' : 'Muat sepenuhnya'}</option><option value="cover"${objectFit === 'cover' ? ' selected' : ''}>${isEn ? 'Cover space' : 'Penuhkan ruang'}</option><option value="none"${objectFit === 'none' ? ' selected' : ''}>${isEn ? 'Original size' : 'Saiz asal'}</option><option value="scale-down"${objectFit === 'scale-down' ? ' selected' : ''}>${isEn ? 'Scale down if needed' : 'Kecilkan jika perlu'}</option></select>` : `<label class="ins-label">${isEn ? 'Text' : 'Teks'}</label><textarea rows="3" data-source-property="text">${esc(text)}</textarea>`}
    ${tag === 'a' ? `<label class="ins-label">${isEn ? 'Target URL' : 'Alamat yang dibuka'}</label><input type="text" data-source-property="href" value="${qa(element.getAttribute('href') || '')}" placeholder="${isEn ? 'https://... or page.html' : 'https://... atau halaman.html'}">` : ''}
    <div class="ins-grid-2col"><div><label class="ins-label">${isEn ? 'Text color' : 'Warna teks'}</label><input type="color" data-source-property="color" value="${sourceInputColor(element.style.color || computed.color, '#203a5b')}"></div><div><label class="ins-label">${isEn ? 'Background color' : 'Warna latar'}</label><input type="color" data-source-property="backgroundColor" value="${sourceInputColor(element.style.backgroundColor || computed.backgroundColor, '#ffffff')}"></div></div>
    <label class="ins-label">${isEn ? 'Font size' : 'Saiz teks'}</label><input type="number" min="8" max="120" data-source-property="fontSize" value="${fontSize}"><label class="ins-label">${isEn ? 'Alignment' : 'Penjajaran'}</label><select data-source-property="textAlign"><option value="left"${align === 'left' ? ' selected' : ''}>${isEn ? 'Left' : 'Kiri'}</option><option value="center"${align === 'center' ? ' selected' : ''}>${isEn ? 'Center' : 'Tengah'}</option><option value="right"${align === 'right' ? ' selected' : ''}>${isEn ? 'Right' : 'Kanan'}</option></select>
    <div class="code-source-format"><button type="button" data-code-source-action="bold"><b>B</b></button><button type="button" data-code-source-action="italic"><i>I</i></button><button type="button" data-code-source-action="underline"><u>U</u></button><button type="button" data-code-source-action="delete">${isEn ? 'Delete element' : 'Padam elemen'}</button></div><button type="button" class="ins-action-btn" data-import-code-to-blocks style="margin-bottom:6px;background:rgba(0,212,255,0.12);border-color:var(--cy)">${isEn ? '⚡ Convert Custom HTML to Visual Blocks' : '⚡ Tukar HTML Bebas ke Blok Visual'}</button><button type="button" class="ins-action-btn" data-reset-code-source>${isEn ? 'Return to studio visual blocks' : 'Kembali ke blok visual studio'}</button></section>`;
}

function renderIns() {
  const b = get(S.sel);
  const el = $('#inspector-content');
  if (typeof hasCodePreviewOverride === 'function' && hasCodePreviewOverride()) {
    renderCodeSourceInspector();
    return;
  }
  if (!b) {
    el.innerHTML = S.lang === 'en'
      ? '<div class="ins-empty"><b>Select an element</b><span>Click an element on the canvas to view and edit its settings.</span></div>'
      : '<div class="ins-empty"><b>Pilih elemen</b><span>Klik elemen pada kanvas untuk melihat dan menyunting tetapannya.</span></div>';
    return;
  }

  const isEn = S.lang === 'en';
  const T = TY[b.type] || { n: 'Elemen', en: 'Element', tag: 'div' };
  const tName = isEn ? (T.en || T.n) : T.n;
  const isContainer = ['header', 'hero', 'section', 'card', 'aside', 'footer'].includes(b.type);
  const isImage = b.type === 'image';
  const isLink = b.type === 'button' || b.type === 'logo' || b.type === 'link';
  const isNav = b.type === 'nav';
  const isDropdown = b.type === 'dropdown';
  const isForm = b.type === 'form';
  const bgMode = b.bgMode || (String(b.bgImg || '').startsWith('pattern-') ? 'pattern' : b.bgImg ? 'image' : 'color');

  let contextHtml = '';
  if (isContainer) {
    const patterns = [
      ['pattern-blueprint', 'Grid'], ['pattern-dots', 'Dots'], ['pattern-stripes', 'Stripes'], ['pattern-mesh', 'Mesh']
    ];
    const patternPicker = patterns.map(([value, label]) => `<button type="button" class="ins-choice${b.bgImg === value ? ' active' : ''}" data-set-bg-pattern="${value}">${label}</button>`).join('');
    const imagePicker = `
      <label class="ins-label" for="ins-bg-img">${isEn ? 'Background Image URL' : 'URL Gambar Latar'}</label>
      <input type="text" id="ins-bg-img" placeholder="${isEn ? 'Paste image URL here' : 'Tampal URL gambar di sini'}" value="${qa(b.bgImg && !b.bgImg.startsWith('pattern-') ? b.bgImg : '')}">
      <button type="button" class="ins-action-btn" data-upload-bg-img style="margin:6px 0;width:100%">${isEn ? '📁 Upload Background Image (Auto-Compressed)' : '📁 Muat Naik Gambar Latar (Mampat Auto)'}</button>
      <div class="ins-preset-chips ins-image-presets">
        <button type="button" class="ins-choice" data-set-bg-img="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80">Office</button>
        <button type="button" class="ins-choice" data-set-bg-img="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80">Tech</button>
        <button type="button" class="ins-choice" data-set-bg-img="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80">Space</button>
      </div>
      <details class="ins-advanced ins-image-advanced">
        <summary>${isEn ? 'Image display options' : 'Pilihan paparan gambar'}</summary>
        <div class="ins-grid-2col">
          <div><label class="ins-label" for="ins-bg-size">${isEn ? 'Fit mode' : 'Cara muat'}</label><select id="ins-bg-size">
            <option value="cover"${b.bgSize === 'cover' ? ' selected' : ''}>${isEn ? 'Cover (Fill area)' : 'Penuhkan ruang (Cover)'}</option>
            <option value="contain"${b.bgSize === 'contain' ? ' selected' : ''}>${isEn ? 'Contain (Fit entire)' : 'Muat penuh (Contain)'}</option>
            <option value="auto"${b.bgSize === 'auto' ? ' selected' : ''}>${isEn ? 'Original size' : 'Saiz asal'}</option>
            <option value="100% 100%"${b.bgSize === '100% 100%' ? ' selected' : ''}>${isEn ? 'Stretch (100% 100%)' : 'Regangkan (100% 100%)'}</option>
          </select></div>
          <div><label class="ins-label" for="ins-bg-repeat">${isEn ? 'Repeat' : 'Ulangan'}</label><select id="ins-bg-repeat">
            <option value="no-repeat"${b.bgRepeat === 'no-repeat' ? ' selected' : ''}>${isEn ? 'No repeat' : 'Tiada ulangan'}</option>
            <option value="repeat"${b.bgRepeat === 'repeat' ? ' selected' : ''}>${isEn ? 'Repeat both directions' : 'Ulang kedua-dua arah'}</option>
            <option value="repeat-x"${b.bgRepeat === 'repeat-x' ? ' selected' : ''}>${isEn ? 'Repeat horizontal (x)' : 'Ulang melintang (x)'}</option>
            <option value="repeat-y"${b.bgRepeat === 'repeat-y' ? ' selected' : ''}>${isEn ? 'Repeat vertical (y)' : 'Ulang menegak (y)'}</option>
          </select></div>
        </div>
      </details>`;
    contextHtml = `
      <section class="ins-section ins-background-section">
        <div class="ins-section-heading">${isEn ? 'Background' : 'Latar Belakang'}</div>
        <div class="ins-mode-tabs" role="group" aria-label="${isEn ? 'Background type' : 'Jenis latar'}">
          <button type="button" data-bg-mode="color" class="${bgMode === 'color' ? 'active' : ''}">${isEn ? 'Color' : 'Warna'}</button>
          <button type="button" data-bg-mode="pattern" class="${bgMode === 'pattern' ? 'active' : ''}">${isEn ? 'Pattern' : 'Corak'}</button>
          <button type="button" data-bg-mode="image" class="${bgMode === 'image' ? 'active' : ''}">${isEn ? 'Image' : 'Gambar'}</button>
        </div>
        <div class="ins-bg-panel"${bgMode !== 'color' ? ' hidden' : ''}><p class="ins-help">${isEn ? 'Pick a color using the Canva toolbar above.' : 'Pilih warna menggunakan bar alatan di atas.'}</p></div>
        <div class="ins-bg-panel"${bgMode !== 'pattern' ? ' hidden' : ''}>
          <div class="ins-choice-row">${patternPicker}<button type="button" class="ins-choice" data-set-bg-pattern="none">${isEn ? 'None' : 'Tiada'}</button></div>
        </div>
        <div class="ins-bg-panel"${bgMode !== 'image' ? ' hidden' : ''}>${imagePicker}</div>
      </section>
      ${b.type !== 'text' ? `<section class="ins-section ins-child-section"><div class="ins-section-heading">${isEn ? 'Add inside this block:' : 'Tambah di dalam blok ini:'}</div><div class="ins-btn-grid">
        <button type="button" class="ins-action-btn" data-add-child="text">+ ${isEn ? 'Text' : 'Teks'}</button>
        <button type="button" class="ins-action-btn" data-add-child="image">+ ${isEn ? 'Image' : 'Gambar'}</button>
        <button type="button" class="ins-action-btn" data-add-child="button">+ ${isEn ? 'Button' : 'Butang'}</button>
        <button type="button" class="ins-action-btn" data-add-child="card">+ ${isEn ? 'Card' : 'Kad'}</button>
      </div></section>` : ''}`;
  } else if (isImage) {
    contextHtml = `
      <section class="ins-section">
        <div class="ins-section-heading">${isEn ? 'Image' : 'Gambar'}</div>
        <label class="ins-label" for="ins-img-url">${isEn ? 'Image URL' : 'URL Gambar'}</label>
        <input type="text" id="ins-img-url" placeholder="${isEn ? 'Paste image URL here' : 'Tampal URL gambar di sini'}" value="${qa(b.imgUrl || '')}">
        <button type="button" class="ins-action-btn" data-upload-img style="margin:6px 0;width:100%">${isEn ? '📁 Upload Image from Device (Auto-Compressed)' : '📁 Muat Naik Gambar dari Peranti (Mampat Auto)'}</button>
        <div class="ins-preset-chips ins-image-presets">
          <button type="button" class="ins-choice" data-set-img="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80">Computer</button>
          <button type="button" class="ins-choice" data-set-img="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80">Team</button>
          <button type="button" class="ins-choice" data-set-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80">Analytics</button>
        </div>
        <details class="ins-advanced"><summary>${isEn ? 'Image options' : 'Pilihan gambar'}</summary><label class="ins-label" for="ins-obj-fit">${isEn ? 'Frame fit mode' : 'Cara muat dalam bingkai'}</label><select id="ins-obj-fit">
          <option value="cover"${b.objFit === 'cover' ? ' selected' : ''}>${isEn ? 'Fill area (Cover)' : 'Penuhkan ruang'}</option>
          <option value="contain"${b.objFit === 'contain' ? ' selected' : ''}>${isEn ? 'Contain (Show whole)' : 'Muat penuh (Contain)'}</option>
          <option value="fill"${b.objFit === 'fill' ? ' selected' : ''}>${isEn ? 'Stretch (Fill)' : 'Regangkan'}</option>
        </select></details>
      </section>`;
  } else if (isLink) {
    contextHtml = `
      <section class="ins-section">
        <div class="ins-section-heading">${isEn ? 'When clicked, open' : 'Apabila ditekan, buka'}</div>
        <select id="ins-link-dest" aria-label="${isEn ? 'Select page or link' : 'Pilih halaman atau pautan'}">
          <option value="#">${isEn ? 'No link' : 'Tiada pautan'}</option>
          ${Object.keys(S.pages).map(pg => `<option value="${qa(pg)}"${b.href === pg ? ' selected' : ''}>${isEn ? 'Page' : 'Halaman'}: ${esc(S.pages[pg].name)}</option>`).join('')}
          ${S.extLinks.map(ext => `<option value="${qa(ext.url)}"${b.href === ext.url ? ' selected' : ''}>${esc(ext.title)}</option>`).join('')}
        </select>
        <label class="ins-label" for="ins-link-url">${isEn ? 'Or enter custom URL' : 'Atau masukkan alamat sendiri'}</label>
        <input type="url" id="ins-link-url" value="${qa(b.href || '')}" placeholder="${isEn ? 'https://example.com or /page.html' : 'https://laman.com atau /halaman.html'}">
      </section>`;
  } else if (isDropdown) {
    b.items = (b.items && b.items.length) ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
    const itemsCount = b.items.length;
    contextHtml = `<section class="ins-section">
      <div class="ins-section-heading">${isEn ? 'Dropdown Options Management' : 'Pengurusan Pilihan Dropdown'}</div>
      <p class="ins-help" style="margin:0 0 8px">${isEn ? 'Control option count and customize labels for this dropdown:' : 'Kawal bilangan pilihan dan ubah suai label untuk dropdown ini:'}</p>
      
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:6px 10px;border-radius:6px;border:1px solid var(--line);margin-bottom:10px">
        <span style="font-size:11.5px;font-weight:600">${isEn ? 'Total Options:' : 'Jumlah Pilihan:'}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <button type="button" class="ins-stepper-btn" data-drop-count-step="-1" title="${isEn ? 'Decrease options' : 'Kurangkan pilihan'}" ${itemsCount <= 1 ? 'disabled' : ''}>−</button>
          <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--cy);min-width:60px;text-align:center">${itemsCount} ${isEn ? 'Options' : 'Pilihan'}</span>
          <button type="button" class="ins-stepper-btn" data-drop-count-step="1" title="${isEn ? 'Increase options' : 'Tambahkan pilihan'}">+</button>
        </div>
      </div>

      <div class="dropdown-items-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${b.items.map((it, idx) => `
          <div class="dropdown-item-row" style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--mute);min-width:18px">${idx + 1}.</span>
            <input type="text" class="ins-drop-item-input" data-drop-item-idx="${idx}" value="${esc(it)}" placeholder="${isEn ? 'Option' : 'Pilihan'} ${idx + 1}" style="flex:1;padding:4px 8px;font-size:12px">
            <button type="button" class="ins-drop-item-del" data-drop-item-del="${idx}" title="${isEn ? 'Delete this option' : 'Padam pilihan ini'}" style="background:rgba(255,60,60,0.15);border:1px solid rgba(255,80,80,0.3);color:#ff8888;padding:4px 8px;border-radius:4px;cursor:pointer"${itemsCount <= 1 ? ' disabled style="opacity:0.3;cursor:not-allowed"' : ''}>✕</button>
          </div>
        `).join('')}
      </div>

      <button type="button" class="ins-action-btn ins-wide-action" data-drop-add-item="true" style="margin-top:4px">
        ${isEn ? '+ Add New Option' : '+ Tambah Pilihan Baharu'}
      </button>
    </section>`;
  } else if (isForm) {
    b.fields = (b.fields && b.fields.length) ? b.fields : (b.t ? b.t.split(',').map(x => x.trim()).filter(Boolean) : (isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']));
    b.submitText = b.submitText || (isEn ? 'Send Message' : 'Hantar Mesej');
    const fieldsCount = b.fields.length;
    contextHtml = `<section class="ins-section">
      <div class="ins-section-heading">${isEn ? 'Form Fields (&lt;form&gt;)' : 'Medan Borang (&lt;form&gt;)'}</div>
      <p class="ins-help" style="margin:0 0 8px">${isEn ? 'Customize input labels and submit button for this form:' : 'Ubah suai label medan input dan teks butang hantar:'}</p>
      <div class="dropdown-items-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${b.fields.map((fld, idx) => `
          <div class="dropdown-item-row" style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--mute);min-width:18px">${idx + 1}.</span>
            <input type="text" class="ins-form-field-input" data-form-field-idx="${idx}" value="${esc(fld)}" placeholder="${isEn ? 'Field' : 'Medan'} ${idx + 1}" style="flex:1;padding:4px 8px;font-size:12px">
            <button type="button" class="ins-form-field-del" data-form-field-del="${idx}" title="${isEn ? 'Delete field' : 'Padam medan'}" style="background:rgba(255,60,60,0.15);border:1px solid rgba(255,80,80,0.3);color:#ff8888;padding:4px 8px;border-radius:4px;cursor:pointer"${fieldsCount <= 1 ? ' disabled style="opacity:0.3;cursor:not-allowed"' : ''}>✕</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="ins-action-btn ins-wide-action" data-form-add-field="true" style="margin-bottom:10px">
        ${isEn ? '+ Add Form Field' : '+ Tambah Medan Borang'}
      </button>
      <label class="ins-label" for="ins-form-submit">${isEn ? 'Submit Button Text' : 'Teks Butang Hantar'}</label>
      <input type="text" id="ins-form-submit" value="${qa(b.submitText)}" placeholder="${isEn ? 'Send Message' : 'Hantar Mesej'}">
    </section>`;
  } else if (isNav) {
    const items = typeof splitNavItems === 'function' ? splitNavItems(b.t) : (b.t.includes(',') ? b.t.split(',') : b.t.trim().split(/\s+/));
    const drops = b.dropdowns || {};
    const navHrefs = b.navHrefs || {};
    const navCtas = b.navCtas || {};
    const curIdx = (S.selNavIdx !== null && S.selNavIdx < items.length) ? S.selNavIdx : 0;
    const curTitle = (items[curIdx] || items[0] || 'Menu').trim();
    const isDrop = !!(drops[curTitle] || drops[curIdx] || drops[curTitle.toLowerCase()]);
    const matchPage = Object.keys(S.pages).find(k => S.pages[k].name.toLowerCase().includes(curTitle.toLowerCase()));
    const curItemHref = navHrefs[curTitle] || navHrefs[curIdx] || matchPage || '#';
    const isItemCta = !isDrop && (navCtas[curTitle] !== undefined ? !!navCtas[curTitle] : /mula|daftar|beli|start|sign|hubungi|contact/i.test(curTitle));
    const defaultSubList = isEn ? ['WhatsApp', 'Email', 'Location'] : ['WhatsApp', 'Emel', 'Lokasi'];
    const dropData = drops[curTitle] || drops[curIdx] || drops[curTitle.toLowerCase()] || defaultSubList;
    const subItems = Array.isArray(dropData) ? dropData : (dropData.items || defaultSubList);
    const subCount = subItems.length;

    contextHtml = `<section class="ins-section">
      <div class="ins-section-heading">${isEn ? 'Navigation Menu Links (Click each to style)' : 'Pautan Menu Navigasi (Klik satu-persatu)'}</div>
      <div class="ins-choice-row ins-nav-choices">${items.map((item, index) => {
        const title = item.trim();
        if (!title) return '';
        const itemDrop = !!(drops[title] || drops[index] || drops[title.toLowerCase()]);
        return `<button type="button" class="ins-choice${index === curIdx ? ' active' : ''}" data-ins-nav-select="${index}" data-ins-nav-title="${esc(title)}">${itemDrop ? '▾ ' : '🔗 '}${esc(title)}</button>`;
      }).join('')}</div>
      ${isDrop ? `
        <div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:700;font-size:12px;color:var(--cy)">Menu: ${esc(curTitle)} ▾</span>
            <span class="ins-badge" style="font-size:9.5px">Dropdown HTML5</span>
          </div>

          <!-- Sub-options count stepper -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.25);padding:6px 8px;border-radius:4px;margin-bottom:8px">
            <span style="font-size:11px">${isEn ? 'Sub-Options Count:' : 'Bilangan Sub-Pilihan:'}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <button type="button" class="ins-stepper-btn" data-nav-sub-step="-1" data-target-title="${esc(curTitle)}" title="${isEn ? 'Decrease' : 'Kurangkan'}" ${subCount <= 1 ? 'disabled' : ''}>−</button>
              <span style="font-family:var(--font-mono);font-size:11.5px;font-weight:700;color:var(--cy)">${subCount}</span>
              <button type="button" class="ins-stepper-btn" data-nav-sub-step="1" data-target-title="${esc(curTitle)}" title="${isEn ? 'Increase' : 'Tambah'}">+</button>
            </div>
          </div>

          <!-- Item-by-item sub-options list -->
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
            ${subItems.map((sub, sIdx) => `
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:10.5px;font-family:var(--font-mono);color:var(--mute);min-width:16px">${sIdx + 1}.</span>
                <input type="text" class="ins-nav-sub-input" data-nav-sub-idx="${sIdx}" data-target-title="${esc(curTitle)}" value="${esc(sub)}" placeholder="${isEn ? 'Sub-option' : 'Sub-pilihan'} ${sIdx + 1}" style="flex:1;padding:4px 8px;font-size:11.5px">
                <button type="button" class="ins-nav-sub-del" data-nav-sub-del="${sIdx}" data-target-title="${esc(curTitle)}" title="${isEn ? 'Delete' : 'Padam'}" style="background:rgba(255,60,60,0.15);border:1px solid rgba(255,80,80,0.3);color:#ff8888;padding:3px 7px;border-radius:4px;cursor:pointer"${subCount <= 1 ? ' disabled style="opacity:0.3"' : ''}>✕</button>
              </div>
            `).join('')}
          </div>

          <button type="button" class="ins-action-btn ins-wide-action" data-nav-sub-add="true" data-target-title="${esc(curTitle)}" style="margin-bottom:8px">
            ${isEn ? '+ Add Sub-Option' : '+ Tambah Sub-Pilihan'}
          </button>

          <button type="button" class="ins-action-btn ins-wide-action" data-ins-nav-drop="remove" data-target-title="${esc(curTitle)}" style="background:rgba(255,60,60,0.12);border-color:rgba(255,80,80,0.3);color:#ff8888">
            ${isEn ? 'Revert to Regular Link' : 'Tukar Semula ke Pautan Biasa'}
          </button>
        </div>
      ` : `
        <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:6px">
          <div style="font-size:11px;font-weight:700;margin-bottom:6px;color:var(--cy)">🔗 ${esc(curTitle)}</div>
          <label class="ins-label" for="ins-nav-item-dest">${isEn ? 'Link Destination (href)' : 'Destinasi Pautan (href)'}</label>
          <select id="ins-nav-item-dest" data-target-title="${esc(curTitle)}">
            <option value="#"${curItemHref === '#' ? ' selected' : ''}># (${isEn ? 'Anchor / None' : 'Tiada'})</option>
            ${Object.keys(S.pages).map(pg => `<option value="${qa(pg)}"${curItemHref === pg ? ' selected' : ''}>${isEn ? 'Page' : 'Halaman'}: ${esc(S.pages[pg].name)}</option>`).join('')}
            ${S.extLinks.map(ext => `<option value="${qa(ext.url)}"${curItemHref === ext.url ? ' selected' : ''}>${esc(ext.title)}</option>`).join('')}
          </select>
          <label class="ins-label" for="ins-nav-item-url" style="margin-top:6px">${isEn ? 'Or Custom URL' : 'Atau Alamat URL Sendiri'}</label>
          <input type="text" id="ins-nav-item-url" data-target-title="${esc(curTitle)}" value="${qa(curItemHref)}" placeholder="index.html / https://...">
          <div style="display:flex;gap:6px;margin-top:8px">
            <button type="button" class="ins-action-btn${isItemCta ? ' active' : ''}" data-ins-nav-cta="${esc(curTitle)}" style="flex:1">
              ${isItemCta ? (isEn ? '✓ CTA Button Style' : '✓ Gaya Butang CTA') : (isEn ? 'Make CTA Button' : 'Jadikan Butang CTA')}
            </button>
            <button type="button" class="ins-action-btn" data-ins-nav-drop="add" data-target-title="${esc(curTitle)}" style="flex:1">
              ${isEn ? '▾ Dropdown' : '▾ Dropdown'}
            </button>
          </div>
        </div>
      `}
    </section>`;
  }

  const contentLabel = isImage
    ? (isEn ? 'Image caption' : 'Kapsyen gambar')
    : isNav
      ? (isEn ? 'Link labels (separated by commas)' : 'Label pautan (pisahkan dengan koma)')
      : isForm
        ? (isEn ? 'Form field labels (separated by commas)' : 'Label medan borang (pisahkan dengan koma)')
        : (isEn ? 'Displayed text content' : 'Kandungan teks dipaparkan');
  const componentOptions = Object.keys(TY).map(key => `<option value="${key}"${key === b.type ? ' selected' : ''}>${esc(isEn ? (TY[key].en || TY[key].n) : TY[key].n)}</option>`).join('');
  const advancedHtml = `<details class="ins-advanced ins-code-advanced"><summary>${isEn ? 'Advanced options' : 'Tetapan lanjutan'}</summary>
    <p class="ins-help">${isEn ? 'Optional technical component settings.' : 'Tetapan teknikal tambahan untuk komponen ini.'}</p>
    <div class="ins-advanced-tag">${isEn ? 'Rendered HTML tag:' : 'Tag HTML dijana:'} <code>&lt;${T.tag}&gt;</code></div>
    <div class="ins-quick-converts"><button type="button" class="ins-choice" data-convert-type="nav">${isEn ? 'Navigation' : 'Navigasi'}</button><button type="button" class="ins-choice" data-convert-type="button">${isEn ? 'CTA Button' : 'Butang CTA'}</button><button type="button" class="ins-choice" data-convert-type="header">Header</button><button type="button" class="ins-choice" data-convert-type="form">${isEn ? 'Form' : 'Borang'}</button></div>
  </details>`;

  const childBlocks = typeof kids === 'function' ? kids(b) : [];
  const childSwitcherHtml = childBlocks.length ? `
    <section class="ins-section" style="background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.28);border-radius:8px;padding:8px 10px;margin-bottom:8px">
      <div class="ins-section-heading" style="color:var(--cy);margin-bottom:4px">${isEn ? '📦 Elements Inside This Box' : '📦 Elemen Di Dalam Kotak Ini'}</div>
      <p class="ins-help" style="margin:0 0 6px;font-size:11px">${isEn ? 'Click an inner element below to style its text or links:' : 'Klik elemen di bawah untuk gaya teks atau pautan di dalamnya:'}</p>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${childBlocks.map(ch => {
          const chTxt = stripHtmlTags(ch.t || '').trim() || (TY[ch.type]?.n || ch.type);
          return `<button type="button" class="ins-action-btn" data-select-child-id="${qa(ch.id)}" style="text-align:left;justify-content:flex-start;font-weight:700;padding:6px 8px">👉 ${esc(chTxt.slice(0, 42))}</button>`;
        }).join('')}
      </div>
    </section>` : '';

  const showInlineStyler = !isImage && !isForm && !isDropdown && !isNav && !childBlocks.length && typeof parseBlockInlineItems === 'function';
  const inlineItems = showInlineStyler ? parseBlockInlineItems(b) : [];
  const curInlineIdx = (typeof S.selInlineIdx === 'number' && S.selInlineIdx >= 0 && S.selInlineIdx < inlineItems.length) ? S.selInlineIdx : 0;
  const activeInline = inlineItems[curInlineIdx] || inlineItems[0] || null;
  const inlineStylerHtml = (showInlineStyler && activeInline) ? `
    <section class="ins-section" id="ins-inline-styler" style="border:1px solid rgba(0,212,255,0.28);background:rgba(0,212,255,0.05);border-radius:8px;padding:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px">
        <div class="ins-section-heading" style="margin:0;color:var(--cy)">🎯 ${esc(activeInline.text || (isEn ? 'Selected Text' : 'Teks Dipilih'))}</div>
        <button type="button" class="inline-fmt-btn" data-inline-add="link" title="${isEn ? 'Add another text/link phrase' : 'Tambah teks/pautan baharu'}" style="font-size:10.5px;padding:0 7px">+ ${isEn ? 'Add' : 'Tambah'}</button>
      </div>
      ${inlineItems.length > 1 ? `
        <div class="ins-choice-row" style="margin-bottom:8px">
          ${inlineItems.map((it, idx) => `<button type="button" class="ins-choice${idx === curInlineIdx ? ' active' : ''}" data-inline-select="${idx}">${it.isLink ? '🔗 ' : ''}${esc(it.text)}</button>`).join('')}
        </div>
      ` : ''}
      <div class="inline-item-card" style="margin-bottom:0">
        <label class="ins-label" style="margin:0">${isEn ? 'Text' : 'Teks'}</label>
        <div class="inline-item-row">
          <input type="text" data-inline-txt="${curInlineIdx}" value="${qa(activeInline.text)}" placeholder="${isEn ? 'Text phrase...' : 'Teks / frasa...'}" style="flex:1;padding:5px 8px;font-size:12.5px;font-weight:600">
          ${inlineItems.length > 1 ? `<button type="button" class="inline-fmt-btn" data-inline-del="${curInlineIdx}" title="${isEn ? 'Delete this text' : 'Padam teks ini'}" style="color:#ff8888;border-color:rgba(255,80,80,0.3)">✕</button>` : ''}
        </div>

        <label class="ins-label" style="margin:4px 0 0;color:var(--cy)">🔗 &lt;a href="..."&gt; (${isEn ? 'Link Destination' : 'Pautan Halaman / URL'})</label>
        <select data-inline-dest="${curInlineIdx}" style="width:100%;padding:5px 8px;font-size:12px">
          <option value=""${!activeInline.isLink ? ' selected' : ''}>${isEn ? '— Plain Text (No Link) —' : '— Teks Biasa (Tiada Link) —'}</option>
          ${Object.keys(S.pages).map(pg => `<option value="${qa(pg)}"${(activeInline.isLink && activeInline.href === pg) ? ' selected' : ''}>📄 ${esc(S.pages[pg].name)} (${esc(pg)})</option>`).join('')}
          ${S.extLinks.map(ext => `<option value="${qa(ext.url)}"${(activeInline.isLink && activeInline.href === ext.url) ? ' selected' : ''}>🌐 ${esc(ext.title)}</option>`).join('')}
          <option value="#"${(activeInline.isLink && (!activeInline.href || activeInline.href === '#')) ? ' selected' : ''}>🔗 # (Anchor)</option>
        </select>
        <input type="text" data-inline-href="${curInlineIdx}" value="${qa(activeInline.isLink ? (activeInline.href || '#') : '')}" placeholder="${isEn ? 'Type URL or page (e.g. index.html, https://...)' : 'Taip URL atau halaman (cth: index.html, https://...)'}" style="width:100%;padding:5px 8px;font-size:11.5px;font-family:var(--font-mono);margin-top:4px">

        <div class="inline-item-row" style="justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.1)">
          <div style="display:flex;align-items:center;gap:4px">
            <button type="button" class="inline-fmt-btn${activeInline.isLink ? ' active' : ''}" data-inline-link="${curInlineIdx}" title="Link (<a>)" style="width:auto;padding:0 7px">🔗 Link</button>
            <button type="button" class="inline-fmt-btn${activeInline.isBtn ? ' active' : ''}" data-inline-btn="${curInlineIdx}" title="${isEn ? 'Style as Button' : 'Gaya Butang'}" style="width:auto;padding:0 7px">🔘 ${isEn ? 'Button' : 'Butang'}</button>
            <button type="button" class="inline-fmt-btn${activeInline.bold ? ' active' : ''}" data-inline-fmt="bold" data-inline-idx="${curInlineIdx}" title="Bold"><b>B</b></button>
            <button type="button" class="inline-fmt-btn${activeInline.italic ? ' active' : ''}" data-inline-fmt="italic" data-inline-idx="${curInlineIdx}" title="Italic"><i>I</i></button>
            <button type="button" class="inline-fmt-btn${activeInline.underline ? ' active' : ''}" data-inline-fmt="underline" data-inline-idx="${curInlineIdx}" title="Underline"><u>U</u></button>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--mute);cursor:pointer" title="${isEn ? 'Text color' : 'Warna teks'}">
              <span>A</span>
              <input type="color" data-inline-col="${curInlineIdx}" value="${qa(activeInline.color && /^#[0-9a-f]{6}$/i.test(activeInline.color) ? activeInline.color : (activeInline.isLink ? '#2563eb' : '#1e293b'))}" style="width:20px;height:20px;padding:0;border:none;background:transparent;cursor:pointer">
            </label>
            <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--mute);cursor:pointer" title="${isEn ? 'Background / Button color' : 'Warna latar / butang'}">
              <span>🎨</span>
              <input type="color" data-inline-bg="${curInlineIdx}" value="${qa(activeInline.bg && /^#[0-9a-f]{6}$/i.test(activeInline.bg) ? activeInline.bg : '#2563eb')}" style="width:20px;height:20px;padding:0;border:none;background:transparent;cursor:pointer">
            </label>
          </div>
        </div>
      </div>
    </section>` : '';

  el.innerHTML = `
    <section class="ins-section ins-item-section">
      <div class="ins-head-row"><span class="ins-title">${esc(tName)}</span></div>
      <label class="ins-label" for="ty">${isEn ? 'Component Type' : 'Jenis Komponen'}</label>
      <select id="ty" aria-label="${isEn ? 'Component Type' : 'Jenis Komponen'}">${componentOptions}</select>
    </section>
    ${childSwitcherHtml}
    ${inlineStylerHtml}
    <section class="ins-section ins-content-section">
      <label class="ins-label" for="tx">${contentLabel}</label>
      <textarea id="tx" rows="3" placeholder="${isEn ? 'Type content here...' : 'Taip kandungan di sini...'}">${qa(b.t)}</textarea>
    </section>
    <section class="ins-section ins-size-section">
      <div class="ins-section-heading">${isEn ? 'Canvas Grid Size' : 'Saiz Grid Kanvas'}</div>
      <div class="steppers-row">
        <div class="stepper-box"><span class="stepper-lbl">${isEn ? 'Width' : 'Lebar'}</span><div class="stepper-ctrls">
          <button type="button" data-step="w-dec" aria-label="${isEn ? 'Decrease width' : 'Kurangkan lebar'}">−</button><span class="stepper-num"><b>${b.w}</b><small>${isEn ? 'cols' : 'kol'}</small></span><button type="button" data-step="w-inc" aria-label="${isEn ? 'Increase width' : 'Tambahkan lebar'}">+</button>
        </div></div>
        <div class="stepper-box"><span class="stepper-lbl">${isEn ? 'Height' : 'Tinggi'}</span><div class="stepper-ctrls">
          <button type="button" data-step="h-dec" aria-label="${isEn ? 'Decrease height' : 'Kurangkan tinggi'}">−</button><span class="stepper-num"><b>${b.h}</b><small>${isEn ? 'rows' : 'baris'}</small></span><button type="button" data-step="h-inc" aria-label="${isEn ? 'Increase height' : 'Tambahkan tinggi'}">+</button>
        </div></div>
      </div>
    </section>
    ${contextHtml}
    ${advancedHtml}
    <button class="del" id="del" title="${isEn ? 'Delete this element from canvas' : 'Padam elemen ini daripada kanvas'}">${isEn ? 'Delete Element' : 'Padam Elemen'}</button>`;
}

function renderLayersPanel() {
  const panel = $('#layers-panel');
  if (!panel) return;
  const isEn = S.lang === 'en';
  if (!S.layerSortMode) S.layerSortMode = 'flow';
  const isZIndex = S.layerSortMode === 'zindex';

  const labelFor = b => {
    const clean = String(b.t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || (isEn ? (TY[b.type]?.en || TY[b.type]?.n) : TY[b.type]?.n) || (isEn ? 'Element' : 'Elemen');
  };

  const sortFn = isZIndex
    ? (a, b) => S.blocks.indexOf(b) - S.blocks.indexOf(a)
    : (a, b) => (a.r - b.r) || (a.c - b.c) || (S.blocks.indexOf(a) - S.blocks.indexOf(b));

  const renderBranch = parent => {
    const siblings = S.blocks.filter(b => par(b) === parent).sort(sortFn);
    return siblings.map((b, index) => {
      const title = labelFor(b);
      const meta = (isEn ? (TY[b.type]?.en || TY[b.type]?.n) : TY[b.type]?.n) || (isEn ? 'Element' : 'Elemen');
      const children = renderBranch(b);
      const canMoveUp = index > 0;
      const canMoveDown = index < siblings.length - 1;
      return `<div class="layer-node" data-layer-row data-layer-id="${qa(b.id)}" draggable="true">
        <div class="layer-row${b.id == S.sel ? ' selected' : ''}" style="--layer-depth:${dep(b)}">
          <button type="button" class="layer-select" data-layer-select="${qa(b.id)}" title="${qa(title)}">
            <span class="layer-row-icon">${icon(b.type, 'layer-icon', 16)}</span>
            <span class="layer-row-copy"><b>${esc(title.slice(0, 38))}${title.length > 38 ? '…' : ''}</b><small>${meta}</small></span>
          </button>
          <span class="layer-row-actions">
            <button type="button" data-layer-move="up" data-layer-id="${qa(b.id)}" aria-label="${isEn ? 'Move up' : 'Naikkan ke atas'}" title="${isEn ? 'Move up' : 'Naikkan ke atas'}"${!canMoveUp ? ' disabled' : ''}>↑</button>
            <button type="button" data-layer-move="down" data-layer-id="${qa(b.id)}" aria-label="${isEn ? 'Move down' : 'Turunkan ke bawah'}" title="${isEn ? 'Move down' : 'Turunkan ke bawah'}"${!canMoveDown ? ' disabled' : ''}>↓</button>
          </span>
        </div>
        ${children ? `<div class="layer-children">${children}</div>` : ''}
      </div>`;
    }).join('');
  };

  const roots = renderBranch(null);
  const subtitleText = isEn
    ? (isZIndex ? `${S.blocks.length} elements · graphic stack (Front ➡ Back)` : `${S.blocks.length} elements · webpage flow (Header ➡ Footer)`)
    : (isZIndex ? `${S.blocks.length} elemen · tindihan grafik (Hadapan ➡ Belakang)` : `${S.blocks.length} elemen · susunan laman (Pengepala ➡ Pengaki)`);

  panel.innerHTML = `
    <div class="layers-head">
      <div><h3>${isEn ? 'Layers' : 'Susunan Lapisan'}</h3><p>${subtitleText}</p></div>
      <span class="layers-count">${S.blocks.length}</span>
    </div>
    <div class="layers-mode-toggle" role="group" aria-label="${isEn ? 'Layer sorting mode' : 'Mod susunan lapisan'}" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">
      <button type="button" class="ins-choice${!isZIndex ? ' active' : ''}" data-layer-sort="flow" title="${isEn ? 'Sort by natural webpage flow: Header at top, Footer at bottom' : 'Susun mengikut aliran fizikal laman: Pengepala di atas, Pengaki di bawah'}">${isEn ? '📄 Page Flow (DOM)' : '📄 Aliran Laman (DOM)'}</button>
      <button type="button" class="ins-choice${isZIndex ? ' active' : ''}" data-layer-sort="zindex" title="${isEn ? 'Sort by graphic design overlapping stack (Z-Index / Front to Back)' : 'Susun mengikut tindihan grafik ala Photoshop/Canva (Z-Index / Depan ke Belakang)'}">${isEn ? '📑 Z-Index Stack' : '📑 Tindihan Z-Index'}</button>
    </div>
    <div class="layers-hint">${isEn ? 'Drag to reorder or use the arrow buttons.' : 'Seret untuk susun semula atau gunakan butang anak panah.'}</div>
    <div class="layer-list">${roots || `<div class="layers-empty">${isEn ? 'No elements on this canvas yet.' : 'Belum ada elemen pada kanvas ini.'}</div>`}</div>`;

  document.querySelectorAll('[data-right-tab]').forEach(tab => {
    const active = tab.dataset.rightTab === S.rightTab;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  $('#inspector-content').hidden = false;
  panel.hidden = false;
}

function shiftSubtree(root, deltaR, deltaC) {
  if (!deltaR && !deltaC) return;
  const moveDescendants = p => {
    kids(p).forEach(child => {
      child.r += deltaR;
      child.c += deltaC;
      moveDescendants(child);
    });
  };
  moveDescendants(root);
}

function swapFlowBlocks(first, second, isFirstMovingUp) {
  if (first.r !== second.r) {
    if (isFirstMovingUp) {
      const newFirstR = second.r;
      const newSecondR = second.r + first.h;
      const deltaFirstR = newFirstR - first.r;
      const deltaSecondR = newSecondR - second.r;
      first.r = newFirstR;
      shiftSubtree(first, deltaFirstR, 0);
      second.r = newSecondR;
      shiftSubtree(second, deltaSecondR, 0);
    } else {
      const newSecondR = first.r;
      const newFirstR = first.r + second.h;
      const deltaSecondR = newSecondR - second.r;
      const deltaFirstR = newFirstR - first.r;
      second.r = newSecondR;
      shiftSubtree(second, deltaSecondR, 0);
      first.r = newFirstR;
      shiftSubtree(first, deltaFirstR, 0);
    }
  } else if (first.c !== second.c) {
    if (isFirstMovingUp) {
      const newFirstC = second.c;
      const newSecondC = second.c + first.w;
      const deltaFirstC = newFirstC - first.c;
      const deltaSecondC = newSecondC - second.c;
      first.c = newFirstC;
      shiftSubtree(first, 0, deltaFirstC);
      second.c = newSecondC;
      shiftSubtree(second, 0, deltaSecondC);
    } else {
      const newSecondC = first.c;
      const newFirstC = first.c + second.w;
      const deltaSecondC = newSecondC - second.c;
      const deltaFirstC = newFirstC - first.c;
      second.c = newSecondC;
      shiftSubtree(second, 0, deltaSecondC);
      first.c = newFirstC;
      shiftSubtree(first, 0, deltaFirstC);
    }
  }
  const fromIndex = S.blocks.indexOf(first);
  const toIndex = S.blocks.indexOf(second);
  S.blocks[fromIndex] = second;
  S.blocks[toIndex] = first;
  R = Math.max(12, ...S.blocks.map(b => b.r + b.h - 1));
  sorted();
}

function moveLayer(id, direction) {
  const block = get(id);
  if (!block) return;
  const parent = par(block);
  const isZIndex = S.layerSortMode === 'zindex';
  const sortFn = isZIndex
    ? (a, b) => S.blocks.indexOf(b) - S.blocks.indexOf(a)
    : (a, b) => (a.r - b.r) || (a.c - b.c) || (S.blocks.indexOf(a) - S.blocks.indexOf(b));

  const siblings = S.blocks.filter(item => par(item) === parent).sort(sortFn);
  const index = siblings.findIndex(item => item.id === block.id);
  const targetIndex = index + (direction === 'up' ? -1 : 1);
  const target = siblings[targetIndex];
  if (!target) return;

  snap();
  if (isZIndex) {
    const fromIndex = S.blocks.indexOf(block);
    S.blocks.splice(fromIndex, 1);
    const toIndex = S.blocks.indexOf(target);
    S.blocks.splice(toIndex + (direction === 'up' ? 1 : 0), 0, block);
  } else {
    const isMovingUp = direction === 'up';
    swapFlowBlocks(block, target, isMovingUp);
  }
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  render();
}

let draggingLayerId = null;
document.addEventListener('dragstart', e => {
  const row = e.target.closest('[data-layer-row]');
  if (!row) return;
  draggingLayerId = row.dataset.layerId;
  row.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
document.addEventListener('dragend', e => {
  const row = e.target.closest('[data-layer-row]');
  if (row) row.classList.remove('dragging');
  document.querySelectorAll('.layer-node.drop-target').forEach(node => node.classList.remove('drop-target'));
  draggingLayerId = null;
});
document.addEventListener('dragover', e => {
  const row = e.target.closest('[data-layer-row]');
  if (!row || !draggingLayerId || row.dataset.layerId === draggingLayerId) return;
  const source = get(draggingLayerId);
  const target = get(row.dataset.layerId);
  if (source && target && par(source) === par(target)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    row.classList.add('drop-target');
  }
});
document.addEventListener('dragleave', e => {
  const row = e.target.closest('[data-layer-row]');
  if (row && !row.contains(e.relatedTarget)) row.classList.remove('drop-target');
});
document.addEventListener('drop', e => {
  const row = e.target.closest('[data-layer-row]');
  if (!row || !draggingLayerId) return;
  e.preventDefault();
  row.classList.remove('drop-target');
  const source = get(draggingLayerId);
  const target = get(row.dataset.layerId);
  if (!source || !target || source === target || par(source) !== par(target)) return;
  snap();
  const isZIndex = S.layerSortMode === 'zindex';
  if (isZIndex) {
    const sourceIndex = S.blocks.indexOf(source);
    S.blocks.splice(sourceIndex, 1);
    const targetIndex = S.blocks.indexOf(target);
    S.blocks.splice(targetIndex + 1, 0, source);
  } else {
    const isMovingUp = (source.r > target.r) || (source.r === target.r && source.c > target.c);
    swapFlowBlocks(source, target, isMovingUp);
  }
  if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
  render();
});

($('#canva-drawer') || $('#ins') || document).addEventListener('input', e => {
  if (e.target.matches('[data-source-dropdown-label]')) {
    const dropdown = getCodeSourceSelectedElement();
    const label = sourceDropdownParts(dropdown).label;
    if (label) { label.textContent = e.target.value; syncCodeCanvasFrame(); }
    return;
  }
  if (e.target.matches('[data-source-dropdown-item]')) {
    const dropdown = getCodeSourceSelectedElement();
    const index = Number(e.target.dataset.sourceDropdownItem);
    const link = sourceDropdownParts(dropdown).links[index];
    if (link) { link.textContent = e.target.value; syncCodeCanvasFrame(); }
    return;
  }
  if (e.target.dataset.sourceProperty === 'text') {
    const element = getCodeSourceSelectedElement();
    if (element) { element.textContent = e.target.value; syncCodeCanvasFrame(); }
    return;
  }
  if (['width', 'height'].includes(e.target.dataset.sourceProperty)) {
    const element = getCodeSourceSelectedElement();
    if (element) applySourceDimension(element, e.target.dataset.sourceProperty, e.target);
    return;
  }
  const b = get(S.sel);
  if (!b) return;
  if (e.target.id == 'tx') {
    b.t = e.target.value;
    if (b.type === 'form') {
      b.fields = b.t.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
    renderCanvaBar();
  } else if (e.target.id == 'ins-form-submit') {
    b.submitText = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.classList.contains('ins-form-field-input')) {
    const idx = parseInt(e.target.dataset.formFieldIdx, 10);
    const isEn = S.lang === 'en';
    b.fields = (b.fields && b.fields.length) ? b.fields : (isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']);
    b.fields[idx] = e.target.value;
    b.t = b.fields.join(', ');
    if ($('#tx')) $('#tx').value = b.t;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.id == 'ins-bg-img') {
    b.bgImg = e.target.value.trim();
    b.bgMode = 'image';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.id == 'ins-img-url') {
    b.imgUrl = e.target.value.trim();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.classList.contains('ins-drop-item-input')) {
    const idx = parseInt(e.target.dataset.dropItemIdx, 10);
    const isEn = S.lang === 'en';
    b.items = (b.items && b.items.length) ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
    b.items[idx] = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.classList.contains('ins-nav-sub-input')) {
    const idx = parseInt(e.target.dataset.navSubIdx, 10);
    const title = e.target.dataset.targetTitle;
    const isEn = S.lang === 'en';
    b.dropdowns = b.dropdowns || {};
    let arr = Array.isArray(b.dropdowns[title]) ? b.dropdowns[title] : (b.dropdowns[title]?.items || (isEn ? ['WhatsApp', 'Email', 'Location'] : ['WhatsApp', 'Emel', 'Lokasi']));
    arr[idx] = e.target.value;
    b.dropdowns[title] = arr;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.id == 'ins-nav-drop-items') {
    b.dropdowns = b.dropdowns || {};
    const title = S.selNavTitle || (b.t.split(/[,\s|]+/)[0] || 'Nav');
    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    b.dropdowns[title] = arr.length ? arr : [S.lang === 'en' ? 'Option 1' : 'Pilihan 1'];
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
  } else if (e.target.dataset.inlineTxt !== undefined) {
    const idx = parseInt(e.target.dataset.inlineTxt, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      items[idx].text = e.target.value;
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if ($('#tx')) $('#tx').value = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      refresh();
    }
  } else if (e.target.dataset.inlineHref !== undefined) {
    const idx = parseInt(e.target.dataset.inlineHref, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      const val = e.target.value.trim();
      if (val) {
        items[idx].href = val;
        items[idx].isLink = true;
      } else {
        items[idx].isLink = false;
        items[idx].isBtn = false;
      }
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if ($('#tx')) $('#tx').value = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      refresh();
    }
  } else if (e.target.dataset.inlineCol !== undefined) {
    const idx = parseInt(e.target.dataset.inlineCol, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      items[idx].color = e.target.value;
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if ($('#tx')) $('#tx').value = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      refresh();
    }
  } else if (e.target.dataset.inlineBg !== undefined) {
    const idx = parseInt(e.target.dataset.inlineBg, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      items[idx].bg = e.target.value;
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if ($('#tx')) $('#tx').value = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      refresh();
    }
  }
});

($('#canva-drawer') || $('#ins') || document).addEventListener('change', e => {
  if (e.target.matches('[data-source-unit]')) {
    const element = getCodeSourceSelectedElement();
    if (element) applySourceDimension(element, e.target.dataset.sourceUnit, e.target);
    return;
  }
  if (e.target.dataset.sourceProperty) {
    const element = getCodeSourceSelectedElement();
    if (!element) return;
    const property = e.target.dataset.sourceProperty;
    if (property === 'fontSize') element.style.fontSize = `${Math.max(8, Math.min(120, Number(e.target.value) || 16))}px`;
    else if (property === 'width' || property === 'height') applySourceDimension(element, property, e.target);
    else if (property === 'textAlign') element.style.textAlign = e.target.value;
    else if (property === 'text') element.textContent = e.target.value;
    else if (property === 'objectFit') element.style.objectFit = e.target.value;
    else if (property === 'color' || property === 'backgroundColor') element.style[property] = e.target.value;
    else element.setAttribute(property, e.target.value);
    syncCodeCanvasFrame();
    return;
  }
  const b = get(S.sel);
  if (!b) return;
  snap();
  if (e.target.id == 'ty') {
    const o = TY[b.type] || TY.text;
    const isEn = S.lang === 'en';
    b.type = typeof normalizeBlockType === 'function' ? normalizeBlockType(e.target.value) : e.target.value;
    const nextT = TY[b.type] || TY.text;
    if (b.t == o.t || b.t == o.tMs) b.t = isEn ? nextT.t : (nextT.tMs || nextT.t);
    if (['button', 'logo', 'link'].includes(b.type) && !b.href) b.href = '#';
    if (b.type === 'dropdown' && !b.items) b.items = isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
    if (b.type === 'form') {
      if (!b.fields) b.fields = isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda'];
      if (!b.submitText) b.submitText = isEn ? 'Send Message' : 'Hantar Mesej';
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-bg-repeat') {
    b.bgRepeat = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-bg-size') {
    b.bgSize = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-obj-fit') {
    b.objFit = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-link-dest') {
    b.href = e.target.value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-link-url') {
    b.href = e.target.value.trim() || '#';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (e.target.id == 'ins-nav-item-dest' || e.target.id == 'ins-nav-item-url') {
    const title = e.target.dataset.targetTitle || S.selNavTitle;
    if (title) {
      b.navHrefs = b.navHrefs || {};
      b.navHrefs[title] = e.target.value.trim() || '#';
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    }
  } else if (e.target.dataset.inlineDest !== undefined) {
    const idx = parseInt(e.target.dataset.inlineDest, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      const val = e.target.value;
      if (!val) {
        items[idx].isLink = false;
        items[idx].isBtn = false;
      } else {
        items[idx].href = val;
        items[idx].isLink = true;
      }
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      render();
    }
  }
});

($('#canva-drawer') || $('#ins') || document).addEventListener('click', e => {
  const target = e.target;
  const isEn = S.lang === 'en';
  if (target.closest('[data-source-nav-select]')) {
    const index = Number(target.closest('[data-source-nav-select]').dataset.sourceNavSelect);
    const context = sourceNavigationContext(getCodeSourceSelectedElement());
    const link = context && context.topLinks[index];
    if (link) setCodeSourceSelectedElement(link);
    return;
  }
  if (target.closest('[data-source-nav-add]')) {
    const context = sourceNavigationContext(getCodeSourceSelectedElement());
    if (!context) return;
    const doc = context.container.ownerDocument;
    const link = doc.createElement('a');
    link.href = '#';
    link.textContent = isEn ? 'New link' : 'Pautan baharu';
    const first = context.topLinks[0];
    const listParent = first && first.parentElement && first.parentElement.tagName === 'LI' ? first.parentElement.parentElement : context.container;
    if (first && first.parentElement && first.parentElement.tagName === 'LI') {
      const item = doc.createElement('li');
      item.appendChild(link);
      listParent.appendChild(item);
    } else listParent.appendChild(link);
    setCodeSourceSelectedElement(link);
    syncCodeCanvasFrame();
    return;
  }
  if (target.closest('[data-source-nav-dropdown]')) {
    const context = sourceNavigationContext(getCodeSourceSelectedElement());
    const link = context && (context.activeLink && context.topLinks.includes(context.activeLink) ? context.activeLink : context.topLinks[0]);
    if (!link) return;
    const doc = link.ownerDocument;
    const details = doc.createElement('details');
    details.className = 'nav-dropdown';
    sourceDropdownHref.set(details, link.getAttribute('href') || '#');
    const summary = doc.createElement('summary');
    summary.textContent = (link.textContent || '').trim() || 'Menu';
    const menu = doc.createElement('div');
    menu.className = 'dropdown-content';
    (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']).forEach(label => {
      const item = doc.createElement('a');
      item.href = '#';
      item.textContent = label;
      menu.appendChild(item);
    });
    details.append(summary, menu);
    link.replaceWith(details);
    setCodeSourceSelectedElement(details);
    syncCodeCanvasFrame();
    return;
  }
  if (target.closest('[data-source-dropdown-revert]')) {
    const dropdown = getCodeSourceSelectedElement();
    if (!dropdown) return;
    const { label } = sourceDropdownParts(dropdown);
    const link = dropdown.ownerDocument.createElement('a');
    link.href = sourceDropdownHref.get(dropdown) || '#';
    link.textContent = (label && label.textContent || '').replace(/\s*▾\s*$/, '').trim() || (isEn ? 'Link' : 'Pautan');
    dropdown.replaceWith(link);
    setCodeSourceSelectedElement(link);
    syncCodeCanvasFrame();
    return;
  }
  if (target.closest('[data-source-dropdown-add]')) {
    const dropdown = getCodeSourceSelectedElement();
    if (!dropdown) return;
    let { content } = sourceDropdownParts(dropdown);
    if (!content) {
      content = dropdown.ownerDocument.createElement('div');
      content.className = 'dropdown-content';
      dropdown.appendChild(content);
    }
    const link = dropdown.ownerDocument.createElement('a');
    link.href = '#';
    link.textContent = `${isEn ? 'Option' : 'Pilihan'} ${sourceDropdownParts(dropdown).links.length + 1}`;
    content.appendChild(link);
    syncCodeCanvasFrame();
    renderCodeSourceInspector();
    return;
  }
  if (target.closest('[data-source-dropdown-delete]')) {
    const button = target.closest('[data-source-dropdown-delete]');
    const dropdown = getCodeSourceSelectedElement();
    if (!dropdown) return;
    const link = sourceDropdownParts(dropdown).links[Number(button.dataset.sourceDropdownDelete)];
    if (link) link.remove();
    syncCodeCanvasFrame();
    renderCodeSourceInspector();
    return;
  }
  if (target.closest('[data-code-source-action]')) {
    const element = getCodeSourceSelectedElement();
    if (!element) return;
    const action = target.closest('[data-code-source-action]').dataset.codeSourceAction;
    if (action === 'bold') element.style.fontWeight = element.style.fontWeight === 'bold' ? '' : 'bold';
    else if (action === 'italic') element.style.fontStyle = element.style.fontStyle === 'italic' ? '' : 'italic';
    else if (action === 'underline') element.style.textDecoration = element.style.textDecoration === 'underline' ? '' : 'underline';
    else if (action === 'delete') { element.remove(); codeSourceSelectedElement = null; renderCodeSourceInspector(); }
    syncCodeCanvasFrame();
    return;
  }
  if (target.closest('[data-code-source-insert]')) {
    insertCodeSourceElement(target.closest('[data-code-source-insert]').dataset.codeSourceInsert);
    return;
  }
  if (target.closest('[data-upload-source-img]')) {
    const element = getCodeSourceSelectedElement();
    if (!element || element.tagName !== 'IMG') return;
    pickAndCompressImage(dataUrl => {
      element.setAttribute('src', dataUrl);
      syncCodeCanvasFrame();
      renderCodeSourceInspector();
      toast(isEn ? 'Image uploaded & compressed for fast storage!' : 'Gambar dimuat naik & dimampatkan!');
    });
    return;
  }
  if (target.closest('[data-import-code-to-blocks]')) {
    const htmlCode = typeof currentCodeText === 'function' ? currentCodeText('html') : '';
    const parsed = typeof parseHtmlToBlocks === 'function' ? parseHtmlToBlocks(htmlCode) : null;
    if (parsed && parsed.length) {
      snap();
      S.blocks = parsed;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = parsed;
      clearPageCodeOverrides();
      codeSourceSelectedElement = null;
      S.sel = parsed[0].id;
      render();
      toast(isEn
        ? `⚡ Converted ${parsed.length} HTML elements into visual studio blocks! (Ctrl+Z to undo)`
        : `⚡ ${parsed.length} elemen HTML ditukar kepada blok visual studio! (Ctrl+Z untuk buat asal)`);
    } else {
      toast(isEn ? 'No convertible HTML elements found on this page.' : 'Tiada elemen HTML yang boleh ditukar kepada blok.');
    }
    return;
  }
  if (target.closest('[data-reset-code-source]')) {
    appConfirm(
      isEn
        ? 'The custom HTML, CSS, and JavaScript on this page will be replaced with your saved visual blocks. You can press Undo (Ctrl+Z) at any time to restore your custom code.'
        : 'Kod HTML, CSS dan JavaScript bebas pada halaman ini akan digantikan dengan blok visual tersimpan. Anda boleh tekan Undo (Ctrl+Z) pada bila-bila masa untuk memulihkan kod bebas anda.',
      isEn ? 'Return to visual blocks?' : 'Kembali kepada blok visual?',
      '⚠️',
      true,
      isEn ? 'Return to visual blocks' : 'Kembali ke blok visual'
    ).then(confirmed => {
      if (!confirmed) return;
      snap();
      clearPageCodeOverrides();
      codeSourceSelectedElement = null;
      render();
      toast(isEn ? 'Returned to studio visual blocks. (Press Ctrl+Z to undo)' : 'Kembali kepada blok visual studio. (Tekan Ctrl+Z untuk buat asal)');
    });
    return;
  }
  const b = get(S.sel);
  if (!b) return;
  if (target.closest('[data-upload-img]')) {
    pickAndCompressImage(dataUrl => {
      snap();
      b.imgUrl = dataUrl;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(isEn ? 'Image uploaded & compressed automatically!' : 'Gambar berjaya dimuat naik & dimampatkan!');
    });
    return;
  }
  if (target.closest('[data-upload-bg-img]')) {
    pickAndCompressImage(dataUrl => {
      snap();
      b.bgImg = dataUrl;
      b.bgMode = 'image';
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(isEn ? 'Background image uploaded & compressed!' : 'Gambar latar berjaya dimuat naik & dimampatkan!');
    });
    return;
  }
  const modeButton = target.closest('[data-bg-mode]');
  if (modeButton) {
    const mode = modeButton.dataset.bgMode;
    b.bgMode = mode;
    if (mode === 'color') b.bgImg = '';
    else if (mode === 'pattern' && !String(b.bgImg || '').startsWith('pattern-')) b.bgImg = 'pattern-blueprint';
    else if (mode === 'image' && String(b.bgImg || '').startsWith('pattern-')) b.bgImg = '';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.dataset.addChild) {
    addChildToBlock(b.id, target.dataset.addChild);
  } else if (target.dataset.setBgPattern) {
    snap();
    b.bgImg = target.dataset.setBgPattern === 'none' ? '' : target.dataset.setBgPattern;
    b.bgMode = b.bgImg ? 'pattern' : 'color';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
    toast(b.bgImg ? `Background pattern applied: ${b.bgImg}` : 'Background pattern removed.');
  } else if (target.dataset.setBgImg) {
    snap();
    b.bgImg = target.dataset.setBgImg;
    b.bgMode = 'image';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
    toast('Background image applied!');
  } else if (target.dataset.setImg) {
    snap();
    b.imgUrl = target.dataset.setImg;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
    toast('Mockup image selected!');
  } else if (target.closest('[data-drop-count-step]')) {
    const btn = target.closest('[data-drop-count-step]');
    const step = parseInt(btn.dataset.dropCountStep, 10);
    b.items = (b.items && b.items.length) ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
    if (step > 0) {
      b.items.push((isEn ? 'Option ' : 'Pilihan ') + (b.items.length + 1));
    } else if (step < 0 && b.items.length > 1) {
      b.items.pop();
    }
    snap();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-drop-add-item]')) {
    b.items = (b.items && b.items.length) ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
    b.items.push((isEn ? 'Option ' : 'Pilihan ') + (b.items.length + 1));
    snap();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-drop-item-del]')) {
    const btn = target.closest('[data-drop-item-del]');
    const idx = parseInt(btn.dataset.dropItemDel, 10);
    b.items = (b.items && b.items.length) ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
    if (b.items.length > 1) {
      b.items.splice(idx, 1);
      snap();
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    }
  } else if (target.closest('[data-form-add-field]')) {
    b.fields = (b.fields && b.fields.length) ? b.fields : (isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']);
    b.fields.push((isEn ? 'Field ' : 'Medan ') + (b.fields.length + 1));
    b.t = b.fields.join(', ');
    snap();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-form-field-del]')) {
    const btn = target.closest('[data-form-field-del]');
    const idx = parseInt(btn.dataset.formFieldDel, 10);
    b.fields = (b.fields && b.fields.length) ? b.fields : (isEn ? ['Full Name', 'Email Address', 'Your Message'] : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda']);
    if (b.fields.length > 1) {
      b.fields.splice(idx, 1);
      b.t = b.fields.join(', ');
      snap();
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    }
  } else if (target.closest('[data-nav-sub-step]')) {
    const btn = target.closest('[data-nav-sub-step]');
    const step = parseInt(btn.dataset.navSubStep, 10);
    const title = btn.dataset.targetTitle;
    b.dropdowns = b.dropdowns || {};
    let arr = Array.isArray(b.dropdowns[title]) ? b.dropdowns[title] : (b.dropdowns[title]?.items || (isEn ? ['WhatsApp', 'Email', 'Location'] : ['WhatsApp', 'Emel', 'Lokasi']));
    if (step > 0) {
      arr.push((isEn ? 'Sub-Option ' : 'Sub-Pilihan ') + (arr.length + 1));
    } else if (step < 0 && arr.length > 1) {
      arr.pop();
    }
    b.dropdowns[title] = arr;
    snap();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-nav-sub-add]')) {
    const btn = target.closest('[data-nav-sub-add]');
    const title = btn.dataset.targetTitle;
    b.dropdowns = b.dropdowns || {};
    let arr = Array.isArray(b.dropdowns[title]) ? b.dropdowns[title] : (b.dropdowns[title]?.items || (isEn ? ['WhatsApp', 'Email', 'Location'] : ['WhatsApp', 'Emel', 'Lokasi']));
    arr.push((isEn ? 'Sub-Option ' : 'Sub-Pilihan ') + (arr.length + 1));
    b.dropdowns[title] = arr;
    snap();
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-nav-sub-del]')) {
    const btn = target.closest('[data-nav-sub-del]');
    const idx = parseInt(btn.dataset.navSubDel, 10);
    const title = btn.dataset.targetTitle;
    b.dropdowns = b.dropdowns || {};
    let arr = Array.isArray(b.dropdowns[title]) ? b.dropdowns[title] : (b.dropdowns[title]?.items || (isEn ? ['WhatsApp', 'Email', 'Location'] : ['WhatsApp', 'Emel', 'Lokasi']));
    if (arr.length > 1) {
      arr.splice(idx, 1);
      b.dropdowns[title] = arr;
      snap();
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    }
  } else if (target.closest('[data-ins-nav-select]')) {
    const btn = target.closest('[data-ins-nav-select]');
    S.selNavIdx = parseInt(btn.dataset.insNavSelect, 10);
    S.selNavTitle = btn.dataset.insNavTitle;
    render();
  } else if (target.closest('[data-ins-nav-cta]')) {
    const btn = target.closest('[data-ins-nav-cta]');
    const title = btn.dataset.insNavCta;
    if (title) {
      b.navCtas = b.navCtas || {};
      const curAuto = /mula|daftar|beli|start|sign|hubungi|contact/i.test(title);
      const curState = b.navCtas[title] !== undefined ? !!b.navCtas[title] : curAuto;
      b.navCtas[title] = !curState;
      snap();
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(b.navCtas[title]
        ? (isEn ? `"${title}" styled as CTA Button (.btn-cta)` : `"${title}" digayakan sebagai Butang CTA (.btn-cta)`)
        : (isEn ? `"${title}" set as regular link` : `"${title}" ditukar ke pautan biasa`));
    }
  } else if (target.closest('[data-ins-nav-drop]')) {
    const btn = target.closest('[data-ins-nav-drop]');
    const action = btn.dataset.insNavDrop;
    const title = btn.dataset.targetTitle || S.selNavTitle || (b.t.split(/[,\s|]+/)[0] || 'Nav');
    b.dropdowns = b.dropdowns || {};
    snap();
    if (action === 'add') {
      let defSubs = isEn ? ['Official WhatsApp', 'Send Email', 'Location Map'] : ['WhatsApp Rasmi', 'Hantar Emel', 'Peta Lokasi'];
      if (/produk|servis|pilihan|service|product/i.test(title)) defSubs = isEn ? ['Basic Plan', 'Premium Plan', 'Custom Plan'] : ['Pakej Asas', 'Pakej Premium', 'Pakej Khas'];
      else if (/tentang|about/i.test(title)) defSubs = isEn ? ['About Us', 'Our Team', 'Vision & Mission'] : ['Latar Belakang', 'Pasukan Kami', 'Visi & Misi'];
      b.dropdowns[title] = defSubs;
      S.selNavTitle = title;
      toast(`Menu "${title}" converted to semantic Dropdown!`);
    } else {
      delete b.dropdowns[title];
      if (S.selNavIdx !== null) delete b.dropdowns[S.selNavIdx];
      toast(`Menu "${title}" reverted to regular link.`);
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (target.closest('[data-select-child-id]')) {
    const childId = target.closest('[data-select-child-id]').dataset.selectChildId;
    const childBlk = get(childId);
    if (childBlk) {
      S.sel = childBlk.id;
      S.selInlineIdx = 0;
      render();
      toast(isEn ? 'Selected inner element for styling!' : 'Elemen dalaman dipilih untuk digayakan!');
    }
  } else if (target.closest('[data-inline-select]')) {
    const idx = parseInt(target.closest('[data-inline-select]').dataset.inlineSelect, 10);
    S.selInlineIdx = idx;
    render();
  } else if (target.closest('[data-inline-link]')) {
    const btn = target.closest('[data-inline-link]');
    const idx = parseInt(btn.dataset.inlineLink, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      snap();
      items[idx].isLink = !items[idx].isLink;
      if (!items[idx].isLink) items[idx].isBtn = false;
      else if (!items[idx].href) items[idx].href = 'index.html';
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      render();
      toast(items[idx].isLink
        ? (isEn ? `"${items[idx].text}" converted to Link (<a>)` : `"${items[idx].text}" dijadikan Pautan (<a>)`)
        : (isEn ? `"${items[idx].text}" set to plain text` : `"${items[idx].text}" ditukar ke teks biasa`));
    }
  } else if (target.closest('[data-inline-btn]')) {
    const btn = target.closest('[data-inline-btn]');
    const idx = parseInt(btn.dataset.inlineBtn, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx]) {
      snap();
      items[idx].isBtn = !items[idx].isBtn;
      if (items[idx].isBtn) {
        items[idx].isLink = true;
        if (!items[idx].href) items[idx].href = '#';
      }
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      render();
      toast(items[idx].isBtn
        ? (isEn ? `"${items[idx].text}" styled as Pill Button` : `"${items[idx].text}" digayakan sebagai Butang`)
        : (isEn ? `"${items[idx].text}" button style removed` : `Gaya butang "${items[idx].text}" dibuang`));
    }
  } else if (target.closest('[data-inline-fmt]')) {
    const btn = target.closest('[data-inline-fmt]');
    const fmt = btn.dataset.inlineFmt;
    const idx = parseInt(btn.dataset.inlineIdx, 10);
    const items = parseBlockInlineItems(b);
    if (items[idx] && ['bold', 'italic', 'underline'].includes(fmt)) {
      snap();
      items[idx][fmt] = !items[idx][fmt];
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      render();
    }
  } else if (target.closest('[data-inline-del]')) {
    const btn = target.closest('[data-inline-del]');
    const idx = parseInt(btn.dataset.inlineDel, 10);
    const items = parseBlockInlineItems(b);
    if (items.length > 1 && items[idx]) {
      snap();
      items.splice(idx, 1);
      S.selInlineIdx = Math.max(0, Math.min(idx, items.length - 1));
      b.t = serializeBlockInlineItems(items);
      b._lastInlineHtml = b.t;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
      render();
    }
  } else if (target.closest('[data-inline-add]')) {
    const items = parseBlockInlineItems(b);
    snap();
    items.push({
      text: isEn ? `Link ${items.length + 1}` : `Pautan ${items.length + 1}`,
      isLink: true,
      isBtn: false,
      href: '#',
      color: '#2563eb',
      bg: '',
      bold: true,
      italic: false,
      underline: true
    });
    S.selInlineIdx = items.length - 1;
    b.t = serializeBlockInlineItems(items);
    b._lastInlineHtml = b.t;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    if (S.codeEdits && S.codeEdits[S.curPage]) delete S.codeEdits[S.curPage].html;
    render();
    toast(isEn ? 'Added new inline link item!' : 'Teks / pautan baharu ditambah!');
  }
});

function renderCanvaBar() {
  const bar = $('#canva-bar');
  if (!bar) return;
  const isEn = S.lang === 'en';
  if (typeof hasCodePreviewOverride === 'function' && hasCodePreviewOverride()) {
    bar.style.display = S.view === 'plan' ? 'flex' : 'none';
    bar.innerHTML = `<span class="canva-hint">${isEn ? 'Select any element on the page to edit its text and style; changes sync directly to code.' : 'Pilih elemen pada halaman untuk sunting teks dan rupa; perubahan disimpan terus ke kod.'}</span>`;
    const pop = $('#color-popover');
    if (pop) pop.hidden = true;
    return;
  }
  if (S.view !== 'plan') {
    bar.style.display = 'none';
    const pop = $('#color-popover');
    if (pop) pop.hidden = true;
    return;
  }
  const b = get(S.sel);
  if (!b) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    const pop = $('#color-popover');
    if (pop) pop.hidden = true;
    return;
  }
  bar.style.display = 'flex';
  const T = TY[b.type] || { n: 'Element', tag: 'div' };
  const isImg = b.type === 'image';
  const hasTypo = !isImg;

  // Check if this block has clickable inline phrases (e.g., "🏠 Laman Utama 📞 Hubungi Kami")
  const canUseInlinePhrases = !['image', 'form', 'dropdown', 'nav'].includes(b.type) && !(typeof kids === 'function' && kids(b).length) && typeof parseBlockInlineItems === 'function';
  const inlineItems = canUseInlinePhrases ? parseBlockInlineItems(b) : [];
  const curInlineIdx = (typeof S.selInlineIdx === 'number' && S.selInlineIdx >= 0 && S.selInlineIdx < inlineItems.length) ? S.selInlineIdx : 0;
  const activeInline = inlineItems[curInlineIdx] || null;
  const isMultiOrLinkedPhrase = canUseInlinePhrases && (inlineItems.length > 1 || (activeInline && (activeInline.isLink || activeInline.isBtn)));

  // Background Fill status
  const isNoneFill = b.f === 'none';
  const curFillColor = isNoneFill ? 'transparent' : (typeof b.f === 'number' ? (FILLS[b.f] || '#ffffff') : (b.f || '#ffffff'));
  const fillTitle = isNoneFill ? 'Background Fill: Transparent (Click to open color palette)' : `Background Fill: ${curFillColor} (Click to open color palette)`;

  // Border status
  const curBw = b.bw || 0;
  const borderDesc = curBw ? `${curBw}px ${b.bs || 'solid'}` : 'No Border';

  // Corner Radius status
  const curRad = b.rad || 0;
  const radDesc = curRad === 999 ? 'Pill (Full Round)' : `${curRad}px`;

  // Typography statuses (reflect active phrase if selected!)
  const curFont = b.font || "'Inter', sans-serif";
  const curFs = b.fs || (b.type === 'header' ? 20 : ['hero', 'section', 'card'].includes(b.type) ? 16 : 14);
  const curCol = (isMultiOrLinkedPhrase && activeInline && activeInline.color) ? activeInline.color : (b.col || (isColorDark(curFillColor) ? '#ffffff' : '#203a5b'));
  const currentWeight = b.fw === 'bold' ? 700 : Number(b.fw) || (/\b(?:bold|strong)\b|<\/?(?:b|strong)(?=[\s>])/i.test(b.t || '') ? 700 : 400);
  const isBold = isMultiOrLinkedPhrase && activeInline ? !!activeInline.bold : (currentWeight >= 700);
  const isItalic = isMultiOrLinkedPhrase && activeInline ? !!activeInline.italic : (b.fst === 'italic' || /<\/?(?:i|em)(?=[\s>])/i.test(b.t || ''));
  const isUnderline = isMultiOrLinkedPhrase && activeInline ? !!activeInline.underline : (b.td === 'underline');
  const align = b.ta || 'left';
  const alignIcon = align === 'center' ? 'alignCenter' : align === 'right' ? 'alignRight' : 'alignLeft';
  const alignTitle = align === 'left' ? 'Align: Left (Click for Center)' : align === 'center' ? 'Align: Center (Click for Right)' : 'Align: Right (Click for Left)';
  const curPad = b.pad !== undefined ? b.pad : 16;
  const curShd = b.shd && b.shd !== 'none' ? b.shd : 'none';

  // Build Direct Top-Bar <a href> controls for the clicked phrase / nav item / link block
  let directHrefClusterHtml = '';
  if (b.type === 'nav') {
    const navParts = typeof splitNavItems === 'function' ? splitNavItems(b.t) : b.t.split(',');
    const navIdx = (S.selNavIdx !== null && S.selNavIdx < navParts.length) ? S.selNavIdx : 0;
    const navTitle = (navParts[navIdx] || navParts[0] || 'Menu').trim();
    const curHref = (b.navHrefs && (b.navHrefs[navTitle] || b.navHrefs[navIdx])) || '#';
    const isCta = !!(b.navCtas && b.navCtas[navTitle]);
    directHrefClusterHtml = `
      <div class="canva-href-cluster" title="${isEn ? 'Direct link (href) for clicked menu item' : 'Tetapan terus a href untuk item menu yang diklik'}">
        <span style="font-size:11px;font-weight:700;color:#1e40af;white-space:nowrap">🔗 ${esc(navTitle.slice(0, 16))}:</span>
        <select id="canva-href-sel" class="canva-href-select" data-href-mode="nav" data-nav-title="${qa(navTitle)}">
          <option value="#"${curHref === '#' ? ' selected' : ''}># (Anchor)</option>
          ${Object.keys(S.pages).map(pg => `<option value="${qa(pg)}"${curHref === pg ? ' selected' : ''}>📄 ${esc(pg)}</option>`).join('')}
          ${S.extLinks.map(ext => `<option value="${qa(ext.url)}"${curHref === ext.url ? ' selected' : ''}>🌐 ${esc(ext.title)}</option>`).join('')}
        </select>
        <input type="text" id="canva-href-input" class="canva-href-input" data-href-mode="nav" data-nav-title="${qa(navTitle)}" value="${qa(curHref)}" placeholder="index.html / https://...">
        <button type="button" class="canva-btn${isCta ? ' active' : ''}" data-cbar="nav-cta" data-nav-title="${qa(navTitle)}" title="${isEn ? 'Style this link as CTA Button' : 'Jadikan pautan ini Butang CTA'}" style="height:26px;padding:0 7px;font-size:11px;font-weight:600">🔘 ${isEn ? 'Btn' : 'Butang'}</button>
      </div>`;
  } else if (canUseInlinePhrases && activeInline) {
    const curHref = activeInline.isLink ? (activeInline.href || 'index.html') : '';
    directHrefClusterHtml = `
      <div class="canva-href-cluster" title="${isEn ? 'Click any phrase on canvas to set its <a href> and button style directly' : 'Klik mana-mana teks di kanvas untuk terus tetapkan <a href> dan gaya butang'}">
        ${inlineItems.length > 1 ? `
          <select id="canva-inline-pick" class="canva-href-select" style="font-weight:700;color:#1e40af;max-width:140px" title="${isEn ? 'Selected text phrase on canvas' : 'Teks yang sedang dipilih di kanvas'}">
            ${inlineItems.map((it, idx) => `<option value="${idx}"${idx === curInlineIdx ? ' selected' : ''}>🎯 ${esc(it.text)}</option>`).join('')}
          </select>
        ` : `<span style="font-size:11px;font-weight:700;color:#1e40af;white-space:nowrap">🔗 a href:</span>`}
        <select id="canva-href-sel" class="canva-href-select" data-href-mode="inline" data-inline-idx="${curInlineIdx}">
          <option value=""${!activeInline.isLink ? ' selected' : ''}>${isEn ? 'No Link (Text)' : 'Tiada Link (Teks)'}</option>
          ${Object.keys(S.pages).map(pg => `<option value="${qa(pg)}"${(activeInline.isLink && curHref === pg) ? ' selected' : ''}>📄 ${esc(pg)}</option>`).join('')}
          ${S.extLinks.map(ext => `<option value="${qa(ext.url)}"${(activeInline.isLink && curHref === ext.url) ? ' selected' : ''}>🌐 ${esc(ext.title)}</option>`).join('')}
          <option value="#"${(activeInline.isLink && curHref === '#') ? ' selected' : ''}>🔗 # (Anchor)</option>
        </select>
        <input type="text" id="canva-href-input" class="canva-href-input" data-href-mode="inline" data-inline-idx="${curInlineIdx}" value="${qa(curHref)}" placeholder="${isEn ? 'index.html / URL...' : 'index.html / URL...'}">
        <button type="button" class="canva-btn${activeInline.isBtn ? ' active' : ''}" data-cbar="inline-btn" data-inline-idx="${curInlineIdx}" title="${isEn ? 'Style this phrase as a Button' : 'Gayakan teks ini sebagai Butang'}" style="height:26px;padding:0 7px;font-size:11px;font-weight:600">🔘 ${isEn ? 'Btn' : 'Butang'}</button>
      </div>`;
  }

  // Google Font Options HTML
  const fontOptionsHtml = GOOGLE_FONTS.map(f => {
    const isSelected = curFont.toLowerCase().includes(f.id.toLowerCase());
    return `<option value="${f.fam}"${isSelected ? ' selected' : ''} style="font-family:${f.fam}">${f.name}</option>`;
  }).join('');

  bar.innerHTML = `
    <div class="canva-group">
      <div class="canva-cluster canva-cluster-element">
      <!-- 1. W3C Semantic Element Tag (switchable directly from canvas bar) -->
      <select id="canva-tag-sel" class="canva-tag-select" title="${isEn ? 'Change W3C semantic tag' : 'Tukar tag semantik W3C'}">
        ${Object.keys(TY).map(k => `<option value="${k}"${k === b.type ? ' selected' : ''}>&lt;${TY[k].tag}&gt; ${esc(isEn ? (TY[k].en || TY[k].n) : TY[k].n)}</option>`).join('')}
      </select>

      ${directHrefClusterHtml}

      ${b.type === 'nav' ? (function() {
        const drops = b.dropdowns || {};
        const curTitle = S.selNavTitle || (b.t.split(/[,\s|]+/)[0] || 'Nav');
        const isCurrentDrop = !!(drops[curTitle] || (S.selNavIdx !== null && drops[S.selNavIdx]) || drops[curTitle.toLowerCase()]);
        return `
          <button type="button" class="canva-btn${isCurrentDrop ? ' active' : ''}" data-nav-drop="${isCurrentDrop ? 'remove' : 'add'}" title="${isCurrentDrop ? `Revert ${esc(curTitle)} back to regular link` : `Convert ${esc(curTitle)} into an HTML5 Dropdown menu`}" style="${isCurrentDrop ? 'border-color:var(--cy);color:var(--cy);' : ''}">
            <span style="font-size:11px;font-weight:700">${isCurrentDrop ? '✕ Revert Dropdown' : '▾ + Dropdown'}</span>
          </button>
        `;
      })() : ''}

      </div>
      <div class="canva-cluster canva-cluster-style">

      <!-- 2. Fill Color Swatch -> Opens Color Palette Popover -->
      <button type="button" class="canva-btn canva-swatch-btn" id="canva-fill-btn" data-cpop="fill" title="${fillTitle}">
        ${isNoneFill ? `<span class="canva-swatch-none" title="${isEn ? 'Transparent' : 'Lutsinar'}"></span>` : `<span class="canva-swatch-dot" style="background:${curFillColor}"></span>`}
      </button>

      <!-- 3. Border Stroke (Cycle) -->
      <button type="button" class="canva-btn${curBw ? ' active' : ''}" data-cbar="border" title="Border Style: ${borderDesc} (Click to cycle)">
        ${icon('border', 'canva-ic', 15)}
      </button>

      <!-- 4. Corner Radius (Cycle) -->
      <button type="button" class="canva-btn${curRad ? ' active' : ''}" data-cbar="radius" title="Corner Radius: ${radDesc} (Click to cycle)">
        ${icon('radius', 'canva-ic', 15)}
      </button>
      </div>

      ${hasTypo ? `
        <div class="canva-cluster canva-cluster-typo">

        <!-- 5. Google Fonts Dropdown (Compact) -->
        <select id="canva-font-sel" class="canva-font-select" aria-label="Google Fonts" title="Select Google Font">
          ${fontOptionsHtml}
        </select>

        <!-- 6. Font Size Stepper (− 16 +) -->
        <div class="canva-stepper" title="Font Size (px)">
          <button type="button" data-cfs="dec" title="Decrease Font Size">−</button>
          <input type="number" id="canva-fs-input" class="canva-fs-input" value="${curFs}" min="8" max="72" title="${isEn ? 'Font Size' : 'Saiz Fon'}">
          <button type="button" data-cfs="inc" title="Increase Font Size">+</button>
        </div>

        <label class="canva-weight-wrap" title="${isEn ? 'Text weight' : 'Ketebalan teks'}">
          <select id="canva-weight-sel" class="canva-weight-select" aria-label="${isEn ? 'Text weight' : 'Ketebalan teks'}">
            ${(isEn ? [[400,'Regular'],[500,'Medium'],[600,'Semi-bold'],[700,'Bold'],[800,'Extra bold']] : [[400,'Biasa'],[500,'Sederhana'],[600,'Separa tebal'],[700,'Tebal'],[800,'Sangat tebal']]).map(([value,label]) => `<option value="${value}"${currentWeight === value ? ' selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>

        <!-- 7. Text Color Button (A) -> Opens Color Palette Popover -->
        <button type="button" class="canva-btn canva-txtcol-btn" id="canva-col-btn" data-cpop="col" title="Text Color (Click to open color palette)">
          <span class="canva-txt-a" style="color:${curCol}">A</span>
          <span class="canva-rainbow-bar"></span>
        </button>

        <!-- 8. Text Formatting: B, I, U & Inline Link (🔗) -->
        <button type="button" class="canva-btn${isBold ? ' active' : ''}" data-cbar="bold" title="${isEn ? 'Bold' : 'Tebal'}"><b>B</b></button>
        <button type="button" class="canva-btn${isItalic ? ' active' : ''}" data-cbar="italic" title="${isEn ? 'Italic' : 'Condong'}"><i>I</i></button>
        <button type="button" class="canva-btn${isUnderline ? ' active' : ''}" data-cbar="underline" title="${isEn ? 'Underline' : 'Garis Bawah'}"><span style="text-decoration:underline">U</span></button>

        <!-- 9. Text Alignment Cycle (Left -> Center -> Right) -->
        <button type="button" class="canva-btn active" data-cbar="align" title="${alignTitle}">
          ${icon(alignIcon, 'canva-ic', 15)}
        </button>
        </div>
      ` : ''}

      <div class="canva-cluster canva-cluster-layout">

      <!-- 10. Inner Padding Spacing ↕ -->
      <button type="button" class="canva-btn${curPad ? ' active' : ''}" data-cbar="pad" title="Inner Padding: ${curPad}px (Click to cycle)">
        ${icon('spacing', 'canva-ic', 15)}
      </button>

      <!-- 11. Box Shadow Effects -->
      <button type="button" class="canva-btn${curShd !== 'none' ? ' active' : ''}" data-cbar="effects" title="Box Shadow: ${curShd} (Click to cycle)">
        ${icon('effects', 'canva-ic', 14)}
      </button>

      <!-- 12. Layer Stacking Order (Position) -->
      <button type="button" class="canva-btn" data-cbar="position" title="Layer Stacking Order (Bring Forward)">
        ${icon('layers', 'canva-ic', 14)}
      </button>
      </div>

      <!-- 13. Quick Delete Element -->
      <div class="canva-cluster canva-cluster-delete">
      <button type="button" class="canva-btn canva-btn-del" data-cbar="del" title="Delete Element (Del)">
        ${icon('trash', 'canva-ic', 15)}
      </button>
      </div>
    </div>
  `;
}
