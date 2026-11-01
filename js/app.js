/**
 * BLUEPRINT CODE STUDIO - Main Application & Coordinator (app.js)
 * Menguruskan kitaran hidup aplikasi (lifecycle), penyelarasan paparan (render & refresh),
 * tab fail kod, peta sitemap nod, audit Guru AI, pintasan papan kekunci, dan permulaan aplikasi.
 */


/**
 * =====================================================================
 * PENGESAHAN SINTAKS & EDITOR KOD DUA HALA (LIVE CODE EDITOR)
 * =====================================================================
 */


function pageCodeEdits(page = S.curPage) {
  S.codeEdits = S.codeEdits || {};
  S.codeEdits[page] = S.codeEdits[page] || {};
  return S.codeEdits[page];
}

let workspaceReturnState = null;

function generatedCodeText(tab = S.tab) {
  const lines = tab === 'html' ? htmlLines() : tab === 'css' ? css() : js();
  return lines.map(line => line.s).join('\n');
}

function currentCodeText(tab = S.tab) {
  const edits = pageCodeEdits();
  return Object.prototype.hasOwnProperty.call(edits, tab) ? edits[tab] : generatedCodeText(tab);
}

function currentCodeLines(tab = S.tab) {
  const edits = pageCodeEdits();
  if (Object.prototype.hasOwnProperty.call(edits, tab)) return String(edits[tab]).split(/\r?\n/).map(s => ({ s }));
  return tab === 'html' ? htmlLines() : tab === 'css' ? css() : js();
}

function hasCodeHtmlOverride(page = S.curPage) {
  return Object.prototype.hasOwnProperty.call(pageCodeEdits(page), 'html');
}

function hasCodePreviewOverride(page = S.curPage) {
  return Object.keys(pageCodeEdits(page)).some(tab => ['html', 'css', 'js'].includes(tab));
}

function injectPreviewPart(source, kind, text) {
  if (!text || !text.trim()) return source;
  const safe = kind === 'style' ? text.replace(/<\/style/gi, '<\\/style') : text.replace(/<\/script/gi, '<\\/script');
  const part = `<${kind} data-studio-code-override>${safe}</${kind}>`;
  const closeTag = new RegExp(`</${kind === 'style' ? 'head' : 'body'}\\s*>`, 'i');
  if (closeTag.test(source)) return source.replace(closeTag, `${part}\n$&`);
  if (kind === 'style' && /<body\b/i.test(source)) return source.replace(/<body\b[^>]*>/i, `$&\n${part}`);
  if (kind === 'script' && /<\/html\s*>/i.test(source)) return source.replace(/<\/html\s*>/i, `${part}\n$&`);
  return source.replace(/<\/body\s*>/i, `${part}\n</body>`);
}

function stripExecutableMarkup(source) {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  doc.querySelectorAll('script').forEach(script => script.remove());
  doc.querySelectorAll('*').forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      else if (/^(?:href|src|xlink:href|formaction)$/i.test(attribute.name) && /^\s*javascript:/i.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return `${doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : '<!DOCTYPE html>\n'}${doc.documentElement.outerHTML}`;
}

function codePreviewDocument() {
  const edits = pageCodeEdits();
  let source = hasCodeHtmlOverride() ? edits.html : preview();
  if (!/<html\b/i.test(source)) source = `<!doctype html><html><head></head><body>${source}</body></html>`;
  if (!/<head\b/i.test(source)) source = source.replace(/<html\b[^>]*>/i, '$&<head></head>');
  if (!/<body\b/i.test(source)) source = source.replace(/<\/html\s*>/i, '<body></body></html>');
  if (Object.prototype.hasOwnProperty.call(edits, 'css')) source = injectPreviewPart(source, 'style', edits.css);
  if (Object.prototype.hasOwnProperty.call(edits, 'js')) source = injectPreviewPart(source, 'script', edits.js);
  if (!S.hasCss) source = source.replace(/<link\b(?=[^>]*rel=[\"']?stylesheet)[^>]*>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '').replace(/\sstyle=(\"[^\"]*\"|'[^']*')/gi, '');
  if (!S.hasJs || !S.previewScripts) source = stripExecutableMarkup(source);
  return source;
}

function clearPageCodeOverrides(page = S.curPage) {
  if (S.codeEdits && S.codeEdits[page]) delete S.codeEdits[page];
}

function attachCodeCanvasEditing(frame) {
  if (!frame || frame.dataset.codeEditorBound) return;
  frame.dataset.codeEditorBound = 'true';
  frame.addEventListener('load', () => {
    let doc;
    try { doc = frame.contentDocument; } catch (error) { return; }
    if (!doc || !doc.body || doc.documentElement.dataset.studioEditorReady) return;
    doc.documentElement.dataset.studioEditorReady = 'true';
    if (!doc.body.hasAttribute('contenteditable')) {
      doc.body.setAttribute('contenteditable', 'true');
      doc.body.setAttribute('data-studio-contenteditable-added', 'true');
    }
    const uiStyle = doc.createElement('style');
    uiStyle.dataset.studioUi = 'true';
    uiStyle.textContent = `*{caret-color:#203a5b!important}
      div{outline:1px dashed rgba(71,121,184,.58)!important;outline-offset:-1px!important}
      div:hover{outline:2px solid #4779b8!important;outline-offset:-1px!important}
      details.nav-dropdown{position:relative;display:inline-block}
      details.nav-dropdown>summary{list-style:none;cursor:pointer;padding:5px 9px;border-radius:5px}
      details.nav-dropdown>summary::-webkit-details-marker{display:none}
      details.nav-dropdown[open]>.dropdown-content{position:absolute;top:calc(100% + 4px);left:0;z-index:100;display:flex;min-width:150px;flex-direction:column;gap:3px;padding:7px;background:#fff;color:#203a5b;border:1px solid #c7d9ef;border-radius:7px;box-shadow:0 6px 18px rgba(32,58,91,.18)}
      details.nav-dropdown[open]>.dropdown-content a{display:block;padding:6px 8px;color:#203a5b;text-decoration:none}
      [data-studio-selected]{outline:2px solid #203a5b!important;outline-offset:-2px!important;cursor:text!important}`;
    doc.head.appendChild(uiStyle);
    doc.addEventListener('click', event => {
      const link = event.target.closest && event.target.closest('a,button,input[type=submit],input[type=button]');
      if (link) event.preventDefault();
      const selected = doc.querySelector('[data-studio-selected]');
      if (selected) selected.removeAttribute('data-studio-selected');
      const clickedElement = event.target.nodeType === 1 ? event.target : event.target.parentElement;
      const target = clickedElement && (clickedElement.closest('a,button,summary') || clickedElement.closest('*')) || doc.body;
      target.setAttribute('data-studio-selected', 'true');
      if (typeof setCodeSourceSelectedElement === 'function') setCodeSourceSelectedElement(target);
    }, true);
    doc.addEventListener('input', () => syncCodeCanvasFrame(frame), true);
    doc.addEventListener('change', () => syncCodeCanvasFrame(frame), true);
    doc.addEventListener('submit', event => event.preventDefault(), true);
  });
}

function syncCodeCanvasFrame(frame = $('#cv .code-source-frame')) {
  const doc = frame && frame.contentDocument;
  if (!doc || !doc.documentElement) return;
  const clone = doc.documentElement.cloneNode(true);
  clone.removeAttribute('data-studio-editor-ready');
  clone.querySelectorAll('[data-studio-ui], [data-studio-code-override]').forEach(node => node.remove());
  clone.querySelectorAll('[data-studio-selected]').forEach(node => node.removeAttribute('data-studio-selected'));
  const body = clone.querySelector('body');
  if (body && body.getAttribute('data-studio-contenteditable-added') === 'true') {
    body.removeAttribute('contenteditable');
    body.removeAttribute('data-studio-contenteditable-added');
  }
  const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : '<!DOCTYPE html>\n';
  pageCodeEdits().html = doctype + clone.outerHTML;
  save();
  renderCode();
  if (S.view === 'prev') renderPreview();
}

/**
 * Mengesahkan sintaks kod HTML secara masa nyata.
 * Memeriksa tag tidak tertutup, tag berlebihan, dan komen terbuka.
 * @param {string} code Kod HTML
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateHtmlSyntax(code) {
  if (!code || !code.trim()) return { valid: true };
  // HTML browser biasa membaiki susunan tag secara automatik (contohnya <li>
  // tanpa penutup). Jangan sekat kod web sah dengan validator tag yang terlalu ketat.
  // DOMParser digunakan supaya preview ikut parser HTML sebenar browser.
  try {
    const doc = new DOMParser().parseFromString(code, 'text/html');
    const parserErr = doc.querySelector('parsererror');
    if (parserErr) return { valid: false, line: 1, msg: 'Browser tidak dapat membaca dokumen HTML ini.' };
    return { valid: true };
  } catch (error) {
    return { valid: false, line: 1, msg: 'Dokumen HTML tidak dapat dibaca oleh browser.' };
  }
}

/**
 * Mengesahkan sintaks kod CSS.
 * Memeriksa imbangan tanda kurung kurawal '{' dan '}' serta blok komen.
 * @param {string} code Kod CSS
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateCssSyntax(code) {
  if (!code || !code.trim()) return { valid: true };
  const lines = code.split('\n');

  const openComments = (code.match(/\/\*/g) || []).length;
  const closeComments = (code.match(/\*\//g) || []).length;
  if (openComments > closeComments) {
    let lastCommentLine = 1;
    lines.forEach((l, idx) => { if (l.includes('/*')) lastCommentLine = idx + 1; });
    return {
      valid: false,
      line: lastCommentLine,
      msg: `Komen CSS dibuka '/*' pada baris ${lastCommentLine} tetapi belum ditutup dengan '*/'.`
    };
  }

  let braceCount = 0;
  let lastOpenLine = 1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].replace(/\/\*[\s\S]*?\*\//g, '');
    for (let j = 0; j < l.length; j++) {
      const ch = l[j];
      if (ch === '{') {
        braceCount++;
        lastOpenLine = i + 1;
      } else if (ch === '}') {
        braceCount--;
        if (braceCount < 0) {
          return {
            valid: false,
            line: i + 1,
            msg: `Simbol penutup '}' pada baris ${i + 1} berlebihan tanpa simbol pembuka '{'.`
          };
        }
      }
    }
  }

  if (braceCount > 0) {
    return {
      valid: false,
      line: lastOpenLine,
      msg: `Blok pemilih CSS dibuka dengan '{' pada baris ${lastOpenLine} tetapi belum ditutup dengan '}'.`
    };
  }

  return { valid: true };
}

/**
 * Mengesahkan sintaks kod JavaScript.
 * Menggunakan konstruktor Function untuk mengesan sebarang SyntaxError.
 * @param {string} code Kod JavaScript
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateJsSyntax(code) {
  if (!code || !code.trim()) return { valid: true };
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
    return { valid: true };
  } catch (err) {
    let line = 1;
    const lines = code.split('\n');
    const msg = err.message || 'Ralat sintaks JavaScript.';
    const openParen = (code.match(/\(/g) || []).length;
    const closeParen = (code.match(/\)/g) || []).length;
    if (openParen !== closeParen) {
      lines.forEach((l, idx) => { if (l.includes('(')) line = idx + 1; });
    }
    return {
      valid: false,
      line,
      msg: `Ralat JavaScript: ${msg}`
    };
  }
}

/**
 * Mengesahkan kod mengikut jenis tab semasa.
 * @param {string} code Kod sumber
 * @param {'html'|'css'|'js'} tab Jenis tab
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateSyntax(code, tab) {
  if (tab === 'html') return validateHtmlSyntax(code);
  if (tab === 'css') return validateCssSyntax(code);
  if (tab === 'js') return validateJsSyntax(code);
  return { valid: true };
}

/**
 * Mengemaskini nombor baris di dalam gutter kod.
 * @param {number} lineCount Bilangan baris
 * @param {number|null} errLine Nombor baris yang mempunyai ralat
 */
function updateGutter(lineCount, errLine) {
  const gutter = $('#code-gutter');
  if (!gutter) return;
  const count = Math.max(1, lineCount);
  let html = '';
  for (let i = 1; i <= count; i++) {
    const isErr = errLine === i;
    html += `<div class="g-line${isErr ? ' gutter-error' : ''}">${i}</div>`;
  }
  gutter.innerHTML = html;
}

/**
 * Menghurai kod HTML yang disunting dan memetakan kembali ke blok kanvas.
 * @param {string} htmlCode Kod HTML lengkap
 * @returns {Array<object>|null} Senarai blok baharu atau null jika gagal
 */
function parseHtmlToBlocks(htmlCode) {
  try {
    const doc = new DOMParser().parseFromString(htmlCode, 'text/html');
    if (doc.querySelector('parsererror')) return null;
    // Accept both semantic <main> and the studio's classic #main/.main-container export.
    const main = doc.querySelector('main, #main.main-container, #main, .main-container') || doc.body;
    if (!main) return null;
    const children = Array.from(main.children).filter(el => !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName));
    if (!children.length) return null;

    const cssSource = Object.prototype.hasOwnProperty.call(pageCodeEdits(), 'css')
      ? pageCodeEdits().css : css().map(line => line.s).join('\n');
    const gridRules = new Map();
    const ruleRegex = /\.([\w-]+)\s*\{([^}]+)\}/g;
    let rule;
    while ((rule = ruleRegex.exec(cssSource)) !== null) gridRules.set(rule[1], rule[2]);
    let currentR = 1;

    return children.map((el, idx) => {
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList || []);
      const studioClass = classes.find(name => /^(?:nav|header|hero|section|card(?:-\d+)?|footer|aside|button|logo|image|text|box)(?:-\d+)?$/.test(name));
      let type = 'box';
      if (tag === 'header' || classes.includes('header')) type = 'header';
      else if (tag === 'nav' || classes.includes('nav')) type = 'nav';
      else if (tag === 'footer' || classes.includes('footer')) type = 'footer';
      else if (tag === 'article' || classes.some(name => /^card(?:-\d+)?$/.test(name))) type = 'card';
      else if (tag === 'figure' || classes.includes('image')) type = 'image';
      else if (tag === 'section' || classes.includes('section')) type = classes.includes('hero') ? 'hero' : 'section';
      else if (tag === 'aside' || classes.includes('aside')) type = 'aside';
      else if (tag === 'details') type = 'accordion';
      else if (tag === 'a' || classes.includes('btn-cta') || classes.includes('button')) type = 'button';

      let textValue = '';
      let dropdowns = null;
      if (type === 'nav') {
        const links = Array.from(el.querySelectorAll(':scope > a, :scope > .nav-dropdown > .nav-drop-btn'));
        const titles = links.map(link => (link.textContent || '').replace(/\s*▾\s*$/, '').trim()).filter(Boolean);
        textValue = titles.join(', ');
        dropdowns = {};
        links.forEach(link => {
          const menu = link.parentElement && link.parentElement.querySelector('.dropdown-content');
          if (menu) dropdowns[link.textContent.replace(/\s*▾\s*$/, '').trim()] = Array.from(menu.querySelectorAll('a')).map(a => a.textContent.trim()).filter(Boolean);
        });
      } else {
        const content = el.querySelector('h1, h2, h3, h4, h5, h6, p');
        textValue = content ? content.innerHTML.trim() : (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240);
      }

      const existing = (studioClass && S.blocks.find(block => block.cls === studioClass)) || S.blocks[idx];
      let imported;
      if (existing) imported = { ...existing, type, cls: studioClass || existing.cls, t: textValue || existing.t };
      else {
        let w = type === 'button' ? 3 : 12;
        let h = ['card', 'section'].includes(type) ? 3 : type === 'hero' ? 4 : 2;
        let c = 1;
        let r = currentR;
        if (studioClass && gridRules.has(studioClass)) {
          const ruleText = gridRules.get(studioClass);
          const col = ruleText.match(/grid-column\s*:\s*(\d+)\s*\/\s*span\s*(\d+)/i);
          const row = ruleText.match(/grid-row\s*:\s*(\d+)\s*\/\s*span\s*(\d+)/i);
          if (col) { c = +col[1]; w = +col[2]; }
          if (row) { r = +row[1]; h = +row[2]; }
        }
        imported = { id: String(Date.now() + idx), type, cls: studioClass || `${type}-${idx + 1}`, c, r, w, h, t: textValue || (TY[type] ? TY[type].t : 'Blok Baharu'), f: 0 };
        currentR = Math.max(currentR, r + h);
      }
      if (dropdowns && Object.keys(dropdowns).length) imported.dropdowns = { ...(imported.dropdowns || {}), ...dropdowns };
      if (el.getAttribute('href')) imported.href = el.getAttribute('href');
      const inlineStyle = el.getAttribute('style') || '';
      const bg = inlineStyle.match(/(?:background-color|background)\s*:\s*([^;]+)/i);
      const color = inlineStyle.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (bg) imported.f = bg[1].trim();
      if (color) imported.col = color[1].trim();
      const fontSize = inlineStyle.match(/font-size\s*:\s*([\d.]+)px/i);
      if (fontSize) imported.fs = +fontSize[1];
      return imported;
    });
  } catch (err) {
    console.warn('Ralat menghurai HTML ke blok:', err);
    return null;
  }
}

function isStudioExportHtml(htmlCode) {
  try {
    const doc = new DOMParser().parseFromString(htmlCode, 'text/html');
    const main = doc.querySelector('#main.main-container, #main, .main-container');
    if (!main) return false;
    const children = Array.from(main.children);
    if (!children.length) return false;
    const classes = children.map(el => Array.from(el.classList || []).find(name => /^(?:nav|header|hero|section|card(?:-\d+)?|footer|aside|button|logo|image|text|box)(?:-\d+)?$/.test(name)));
    const marked = /HTML Biasa|Semantik/.test(htmlCode) && classes.every(Boolean);
    const known = classes.every(Boolean) && classes.some(name => name === 'nav') && classes.some(name => /^(?:card|footer)/.test(name || ''));
    return marked || known;
  } catch (_) { return false; }
}

function convertSourceHtmlMode(mode) {
  if (!hasCodeHtmlOverride()) return false;
  const doc = new DOMParser().parseFromString(pageCodeEdits().html, 'text/html');
  const replaceTag = (element, tag, fallbackClass) => {
    const replacement = doc.createElement(tag);
    Array.from(element.attributes).forEach(attr => replacement.setAttribute(attr.name, attr.value));
    if (fallbackClass && !replacement.classList.length) replacement.className = fallbackClass;
    while (element.firstChild) replacement.appendChild(element.firstChild);
    element.replaceWith(replacement);
  };
  if (mode === 'div') {
    const mapping = { header: 'header', nav: 'nav', main: 'main-container', section: 'section', article: 'card', aside: 'aside', footer: 'footer' };
    Array.from(doc.querySelectorAll('header,nav,main,section,article,aside,footer')).forEach(element => {
      const tag = element.tagName.toLowerCase();
      const fallback = mapping[tag];
      replaceTag(element, 'div', fallback);
      if (tag === 'main') { const main = doc.querySelector('#main') || doc.querySelector('.main-container'); if (main && !main.id) main.id = 'main'; }
    });
  } else {
    const divs = Array.from(doc.querySelectorAll('div'));
    const previousComment = element => {
      let sibling = element.previousSibling;
      while (sibling && sibling.nodeType === Node.TEXT_NODE && !sibling.textContent.trim()) sibling = sibling.previousSibling;
      return sibling && sibling.nodeType === Node.COMMENT_NODE ? sibling.textContent.toLowerCase() : '';
    };
    const cardLike = element => !!(element.querySelector('img') && element.querySelector('h2,h3,h4,h5,h6') && element.querySelector('p'));
    const cardDivs = new Set(divs.filter(cardLike));
    const mainDivs = new Set(divs.filter(element => Array.from(element.children).filter(child => cardDivs.has(child)).length >= 2));
    const semanticType = element => {
      const classes = Array.from(element.classList);
      const comment = previousComment(element);
      if (element.id === 'main' || classes.includes('main-container')) return 'main';
      if (classes.some(name => ['nav', 'navbar', 'navigation'].includes(name))) return 'nav';
      if (classes.includes('footer')) return 'footer';
      if (classes.includes('header')) return 'header';
      if (classes.includes('hero') || classes.includes('section')) return 'section';
      if (classes.includes('aside')) return 'aside';
      if (classes.some(name => /^card(?:-|$)/.test(name))) return 'article';

      if (/menu atas|navbar|menu utama|navigasi/.test(comment)) return 'nav';
      if (/bahagian\s*\d*\s*kad|kumpulan\s*kad/.test(comment) || mainDivs.has(element)) return 'main';
      if (/kad\s*\d*|\bkad\b|\bcard\b/.test(comment) && cardLike(element)) return 'article';
      if (/hero|bahagian utama/.test(comment) && element.querySelector('h1,h2')) return 'section';

      const isTopMenu = element.parentElement === doc.body || element.parentElement?.tagName === 'HEADER';
      if (isTopMenu && element.querySelectorAll(':scope > a').length >= 2 && !element.querySelector('h1,h2,h3,h4,h5,h6,p,img,ul,ol')) return 'nav';
      if (cardLike(element)) return 'article';
      if (element.querySelector('h1') && element.querySelector('p')) return 'section';
      return null;
    };
    divs.forEach(element => {
      if (!element.isConnected) return;
      const tag = semanticType(element);
      if (tag) replaceTag(element, tag);
    });
  }
  const doctype = pageCodeEdits().html.match(/^\s*(<!doctype[^>]*>)/i)?.[1] || '<!DOCTYPE html>';
  pageCodeEdits().html = `${doctype}\n${doc.documentElement.outerHTML}`;
  save();
  render();
  return true;
}

function sourceInlineStylesToRules(doc) {
  const rules = [];
  let index = 1;
  doc.querySelectorAll('[style]').forEach(element => {
    const declarations = element.getAttribute('style');
    if (!declarations || !declarations.trim()) return;
    let selector = '';
    if (element.id && doc.querySelectorAll(`#${CSS.escape(element.id)}`).length === 1) {
      selector = `#${CSS.escape(element.id)}`;
    } else {
      let className;
      do { className = `bcs-inline-${index++}`; } while (doc.getElementsByClassName(className).length);
      element.classList.add(className);
      selector = `.${className}`;
    }
    rules.push(`${selector} { ${declarations} }`);
    element.removeAttribute('style');
  });
  return rules;
}

function sourceHead(doc) {
  if (!doc.head) {
    const head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.body || null);
  }
  return doc.head;
}

function sourceHasStudioStylesheet(doc) {
  return Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]')).some(link => /(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href')));
}

function sourceCssSpecificity(selector) {
  const withoutStrings = selector.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '');
  const ids = (withoutStrings.match(/#[\w-]+/g) || []).length;
  const classes = (withoutStrings.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
  const tags = (withoutStrings.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:{1,2}[\w-]+(?:\([^)]*\))?/g, ' ').match(/(?:^|[\s>+~])(?:[a-z][\w-]*|\*)/gi) || []).filter(tag => tag.trim() !== '*').length;
  return ids * 10000 + classes * 100 + tags;
}

function applySourceCssInline(doc, cssText) {
  if (!cssText.trim()) return '';
  const parser = doc.createElement('style');
  parser.textContent = cssText;
  sourceHead(doc).appendChild(parser);
  const candidates = [];
  const leftovers = [];
  let order = 0;
  const collect = rules => Array.from(rules || []).forEach(rule => {
    if (rule.type === 1 && rule.selectorText) {
      const selector = rule.selectorText;
      if (/:(?:hover|focus|focus-visible|active|visited|checked|disabled|enabled|target|root)\b|::/i.test(selector)) { leftovers.push(rule.cssText); return; }
      let matches = [];
      try { matches = Array.from(doc.querySelectorAll(selector)); } catch (_) { leftovers.push(rule.cssText); return; }
      const specificity = Math.max(...selector.split(',').map(sourceCssSpecificity));
      matches.forEach(element => {
        for (let i = 0; i < rule.style.length; i++) {
          const property = rule.style[i];
          candidates.push({ element, property, value: rule.style.getPropertyValue(property), important: rule.style.getPropertyPriority(property) === 'important', specificity, order: order++ });
        }
      });
    } else if (rule.cssRules) {
      if (rule.conditionText && rule.conditionText !== 'all') leftovers.push(rule.cssText);
      else collect(rule.cssRules);
    } else leftovers.push(rule.cssText || '');
  });
  try { collect(parser.sheet && parser.sheet.cssRules); }
  catch (_) { leftovers.push(cssText); }
  parser.remove();
  candidates.sort((a, b) => Number(a.important) - Number(b.important) || a.specificity - b.specificity || a.order - b.order);
  candidates.forEach(({ element, property, value, important }) => {
    const existingPriority = element.style.getPropertyPriority(property);
    const existingInlineValue = element.style.getPropertyValue(property);
    if (existingInlineValue && (existingPriority === 'important' || !important)) return;
    element.style.setProperty(property, value, important ? 'important' : '');
  });
  return leftovers.filter(Boolean).join('\n');
}

function convertSourceCssMode(mode) {
  if (!hasCodeHtmlOverride() || !['int', 'ext', 'inl', 'all'].includes(mode)) return false;
  const edits = pageCodeEdits();
  const doc = new DOMParser().parseFromString(edits.html, 'text/html');
  const inlineRules = mode === 'inl' ? [] : sourceInlineStylesToRules(doc);
  const internalParts = Array.from(doc.querySelectorAll('style:not([data-studio-ui])')).map(style => style.textContent || '').filter(text => text.trim());
  doc.querySelectorAll('style:not([data-studio-ui])').forEach(style => style.remove());
  const editorCss = Object.prototype.hasOwnProperty.call(edits, 'css') ? String(edits.css || '') : '';
  const collectedCss = [editorCss, ...internalParts, ...inlineRules].filter(text => text.trim()).join('\n\n');
  const head = sourceHead(doc);

  if (mode === 'int') {
    doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(link => {
      if (editorCss.trim() && /(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href'))) link.remove();
    });
    if (collectedCss.trim()) {
      const style = doc.createElement('style');
      style.textContent = collectedCss;
      head.appendChild(style);
    }
    delete edits.css;
  } else if (mode === 'ext' || mode === 'all') {
    if (!sourceHasStudioStylesheet(doc)) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'style.css';
      head.appendChild(link);
    }
    edits.css = collectedCss;
  } else if (mode === 'inl') {
    const remainingCss = applySourceCssInline(doc, collectedCss);
    if (remainingCss) {
      const style = doc.createElement('style');
      style.textContent = remainingCss;
      head.appendChild(style);
    } else delete edits.css;
    delete edits.css;
    doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(link => {
      if (/(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href'))) link.remove();
    });
  }

  const doctype = edits.html.match(/^\s*(<!doctype[^>]*>)/i)?.[1] || '<!DOCTYPE html>';
  edits.html = `${doctype}\n${doc.documentElement.outerHTML}`;
  save();
  return true;
}

let autoApplyTimer = null;
let codeStatusTimer = null;
function showCodeStatus(message, state = 'success', duration = 1900) {
  const pill = $('#code-status-pill');
  const text = $('#code-status-text');
  if (!pill) return;
  clearTimeout(codeStatusTimer);
  pill.className = `code-status-pill ${state} visible`;
  pill.title = message;
  if (text) text.textContent = message;
  codeStatusTimer = setTimeout(() => pill.classList.remove('visible'), duration);
}

/**
 * Pengendali input semasa pengguna menaip di dalam textarea editor kod.
 */
function onEditorInput(fromUser = false) {
  const textarea = $('#code-textarea');
  if (!textarea) return;

  const code = textarea.value;
  if (fromUser) {
    pageCodeEdits()[S.tab] = code;
    save();
  }
  const lines = code.split('\n');
  const res = validateSyntax(code, S.tab);

  const banner = $('#code-error-banner');
  const bannerMsg = $('#code-error-msg');
  if (!res.valid) {
    // Makluman ralat ringkas akan pudar sendiri supaya ruang editor kekal lapang.
    if (banner) banner.hidden = true;
    if (bannerMsg) bannerMsg.textContent = res.msg || 'Ralat sintaks dikesan.';
    showCodeStatus(`Semak sintaks · baris ${res.line}`, 'error', 3000);
    updateGutter(lines.length, res.line);
    S.lastErrorCode = res;

    // Batalkan sebarang auto-apply jika ada ralat
    if (autoApplyTimer) {
      clearTimeout(autoApplyTimer);
      autoApplyTimer = null;
    }
  } else {
    // Sembunyikan banner ralat
    if (banner) banner.hidden = true;
    showCodeStatus('Menyimpan…', 'editing', 1000);
    updateGutter(lines.length, null);
    S.lastErrorCode = null;

    // Debounce auto-apply ke kanvas selepas 750ms
    if (autoApplyTimer) clearTimeout(autoApplyTimer);
    autoApplyTimer = setTimeout(() => {
      applyCodeChanges(false);
    }, 750);
  }
}

/**
 * Melompat ke baris yang mengandungi ralat di dalam textarea.
 */
function gotoErrorLine() {
  if (!S.lastErrorCode || !S.lastErrorCode.line) return;
  const textarea = $('#code-textarea');
  if (!textarea) return;

  const lineNum = S.lastErrorCode.line;
  const lines = textarea.value.split('\n');
  let charIdx = 0;
  for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
    charIdx += lines[i].length + 1;
  }
  const endIdx = charIdx + (lines[lineNum - 1] ? lines[lineNum - 1].length : 0);

  textarea.focus();
  textarea.setSelectionRange(charIdx, endIdx);

  // Skrol textarea dan gutter supaya baris kelihatan
  const lineHeight = 20.625;
  const targetScroll = Math.max(0, (lineNum - 3) * lineHeight);
  textarea.scrollTop = targetScroll;
  const gutter = $('#code-gutter');
  if (gutter) gutter.scrollTop = targetScroll;

  toast(`Jump to line ${lineNum}: ${S.lastErrorCode.msg || 'Please check syntax'}`);
}

/**
 * Menerapkan perubahan kod yang disunting ke dalam keadaan kanvas studio.
 * @param {boolean} showToast Sama ada memaparkan makluman toast
 */
function applyCodeChanges(showToast = true) {
  const textarea = $('#code-textarea');
  if (!textarea) return;
  const code = textarea.value;

  const res = validateSyntax(code, S.tab);
  if (!res.valid) {
    toast(`⚠️ Unable to update: Error on line ${res.line}!`);
    gotoErrorLine();
    return;
  }

  if (S.tab === 'html') {
    const studioExport = isStudioExportHtml(code);
    const parsed = parseHtmlToBlocks(code);
    if (parsed && parsed.length) {
      snap();
      S.blocks = parsed;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = parsed;
      if (studioExport) delete pageCodeEdits()[S.tab];
    }
    renderCanvas();
    renderTabsBar();
    renderPreview();
    renderIns();
    renderCanvaBar();
    if (!parsed || !parsed.length) toast('Code preserved and displayed. This layout cannot be converted to visual blocks.');
    else if (studioExport) toast('Studio export recognized: grid canvas and visual controls are active.');
  } else if (S.tab === 'css') {
    S.customCss = code;
    renderPreview();
  } else if (S.tab === 'js') {
    S.customJs = code;
    renderPreview();
  }

  showCodeStatus('Disimpan', 'success');

  if (showToast) {
    const tabName = S.tab === 'html' ? 'HTML' : S.tab === 'css' ? 'CSS' : 'JavaScript';
    toast(`⚡ ${tabName} changes successfully updated to Canvas!`);
  }
  save();
}

/**
 * Memulihkan kod di dalam editor kepada kod yang dijana oleh kanvas studio.
 */
function revertCodeChanges() {
  const textarea = $('#code-textarea');
  if (!textarea) return;

  delete pageCodeEdits()[S.tab];
  textarea.value = generatedCodeText(S.tab);
  S.lastErrorCode = null;
  render();

  showCodeStatus('Kod dipulihkan', 'success');
  toast('↺ Code restored from canvas design.');
}

/**
 * Menukar mod antara Papar (Syntax Highlighted) dan Sunting (Editable Textarea).
 * @param {'view'|'edit'} mode Mod editor
 * @param {number|null} targetLine Baris sasaran untuk lompat jika ada
 */
function setCodeMode(mode, targetLine = null) {
  S.codeMode = mode;

  // Kemaskini butang suis mod
  document.querySelectorAll('[data-cmode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cmode === mode);
  });

  const src = $('#src');
  const editorWrap = $('#code-editor-wrap');
  const btnApply = $('#btn-apply-code');
  const btnRevert = $('#btn-revert-code');
  const textarea = $('#code-textarea');
  const banner = $('#code-error-banner');

  if (mode === 'edit') {
    if (src) src.hidden = true;
    if (editorWrap) editorWrap.hidden = false;
    if (btnApply) btnApply.hidden = false;
    if (btnRevert) btnRevert.hidden = false;

    // Muatkan kod semasa ke dalam textarea jika belum ada
    // Apabila kod sedang dipaparkan, gunakan teks yang sama persis dengan paparan.
    // Ini mengelakkan editor kosong jika keadaan sunting tersimpan sudah tidak sepadan.
    const curCode = src && !src.hidden && typeof S.text === 'string' ? S.text : currentCodeText(S.tab);
    if (textarea) {
      textarea.value = curCode;
      onEditorInput();
      if (targetLine) {
        setTimeout(() => {
          const lines = textarea.value.split('\n');
          let charIdx = 0;
          for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
            charIdx += lines[i].length + 1;
          }
          const endIdx = charIdx + (lines[targetLine - 1] ? lines[targetLine - 1].length : 0);
          textarea.focus();
          textarea.setSelectionRange(charIdx, endIdx);
          const lineHeight = 20.625;
          const targetScroll = Math.max(0, (targetLine - 3) * lineHeight);
          textarea.scrollTop = targetScroll;
          const gutter = $('#code-gutter');
          if (gutter) gutter.scrollTop = targetScroll;
        }, 50);
      } else {
        textarea.focus();
      }
    }
  } else {
    if (src) src.hidden = false;
    if (editorWrap) editorWrap.hidden = true;
    if (btnApply) btnApply.hidden = true;
    if (btnRevert) btnRevert.hidden = true;
    if (banner) banner.hidden = true;

    renderCode();
  }
}

function findCodeCommentRanges(lines, tab) {
  let inBlock = false;
  const ranges = [];
  const html = tab === 'html';
  const supportsLineComments = tab === 'js';
  const opener = html ? '<!--' : '/*';
  const closer = html ? '-->' : '*/';
  lines.forEach(lineObj => {
    const line = String(lineObj.s || '');
    if (inBlock) {
      const closeAt = line.indexOf(closer);
      if (closeAt < 0) { ranges.push([0, line.length]); return; }
      inBlock = false;
      ranges.push([0, closeAt + closer.length]);
      return;
    }
    let quote = '';
    let escaped = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (!html && quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
        continue;
      }
      if (!html && (char === '"' || char === "'" || (tab === 'js' && char === '`'))) { quote = char; continue; }
      if (line.startsWith(opener, i)) {
        const closeAt = line.indexOf(closer, i + opener.length);
        if (closeAt < 0) { inBlock = true; ranges.push([i, line.length]); }
        else ranges.push([i, closeAt + closer.length]);
        return;
      }
      if (supportsLineComments && line.startsWith('//', i)) { ranges.push([i, line.length]); return; }
    }
    ranges.push(null);
  });
  return ranges;
}

function renderCode() {
  const L = currentCodeLines(S.tab);
  S.text = L.map(l => l.s).join('\n');
  S.folded = S.folded || {};

  const isHidden = l => {
    let p = l.parentFk;
    while (p) {
      if (S.folded[p]) return true;
      const parentLine = L.find(x => x.fk === p && x.fold === 'start');
      p = parentLine ? parentLine.parentFk : null;
    }
    return false;
  };

  const html = [];
  const commentRanges = findCodeCommentRanges(L, S.tab);
  let lineNo = 1;
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    if (isHidden(l)) continue;
    const isStart = l.fold === 'start';
    const isFolded = isStart && S.folded[l.fk];
    const arrow = isStart ? `<span class="fold-btn${isFolded ? ' folded' : ''}" data-fold-toggle="${l.fk}">${isFolded ? '▶' : '▼'}</span>` : '<span class="fold-spacer"></span>';
    const closeTag = l.tag === '}' ? ' }' : ` &lt;/${l.tag || ''}&gt;`;
    const ellipsis = isFolded ? `<span class="fold-ellipsis" data-fold-toggle="${l.fk}">...${closeTag}</span>` : '';

    let cssHlClass = '';
    if (S.cssHighlight) {
      if (S.tab === 'css') cssHlClass = ' hl-css-active';
      else if (l.isCss || l.parentFk === 'style') cssHlClass = ' hl-css-block';
      else if (l.isCssInline) cssHlClass = ' hl-css-inline';
    }

    let colorPill = '';
    let borderStyle = '';
    if (l.blockColor) {
      const c = l.blockColor;
      borderStyle = ` style="border-left-color: ${c};"`;
      if (l.isSelectorLine || l.isTagLine) {
        colorPill = `<span class="code-color-pill" style="background:${c};box-shadow:0 0 6px ${c};" title="Element color matching corresponding canvas box"></span>`;
      }
    }

    html.push(`<div class="ln${cssHlClass}" data-id="${l.id || ''}"${borderStyle}>
      <span class="no">${lineNo++}</span>
      ${arrow}
      ${colorPill}
      <span class="code-txt">${hl(l.s, S.tab, S.cssHighlight, commentRanges[i])}${ellipsis}</span>
    </div>`);
  }
  $('#src').innerHTML = html.join('');

  // Jika sedang dalam mod edit, segerakkan kandungan textarea dan nombor baris
  if (S.codeMode === 'edit') {
    const textarea = $('#code-textarea');
    if (textarea && textarea.value !== S.text) textarea.value = S.text;
    updateGutter(L.length, null);
  }
}

function renderTabsBar() {
  const bar = $('#page-tabs-bar');
  const pageKeys = Object.keys(S.pages);
  bar.innerHTML = pageKeys.map(k => {
    const p = S.pages[k];
    const isAct = k == S.curPage;
    return `<div class="ptab${isAct ? ' active' : ''}" data-page="${qa(k)}" title="${qa(p.name || k)}">
      <span>📄 ${esc(k)}</span>
      <button type="button" class="ptab-del" data-del-page="${k}" title="Delete tab ${p.name}">✕</button>
    </div>`;
  }).join('') + '<button class="btn-new-page" id="btn-add-page" title="Tambah Halaman Baru (Tambah fail HTML baharu)">+</button>';
}

/**
 * Mengemaskini pratonton hasil (Live Preview iframe) secara selamat dan responsif.
 */
function renderPreview() {
  const paper = $('#paper');
  const pv = $('#pv');
  if (!paper || !pv) return;

  if (S.view === 'prev') {
    paper.hidden = false;
    const content = codePreviewDocument();
    try {
      pv.srcdoc = content;
    } catch (err) {
      console.warn('Gagal tetapkan srcdoc secara langsung, menggunakan fallback blob:', err);
      const blob = new Blob([content], { type: 'text/html' });
      pv.src = URL.createObjectURL(blob);
    }
  } else {
    paper.hidden = true;
  }
}

function refresh() {
  renderCanvas();
  renderCode();
  renderTabsBar();
  if (S.view === 'nodes') renderNodes();
  if (S.view === 'prev') renderPreview();
  save();
}

function render() {
  // 1. Kawal paparan bekas utama (Canvas vs Nodes vs Hasil) terlebih dahulu
  $('#cv').hidden = S.view !== 'plan';
  $('#nodes-wrap').hidden = S.view !== 'nodes';
  $('#paper').hidden = S.view !== 'prev';

  // 2. Mode paparan visual / split / kod & viewport responsif
  const vpClass = `vp-${S.viewport || 'desktop'}`;
  const stage = $('#stage');
  stage.className = `stage ${S.mode} ${vpClass}`;
  stage.dataset.view = S.view;
  const liveViewportTools = $('#live-viewport-tools');
  if (liveViewportTools) liveViewportTools.hidden = !(S.mode === 'v' && S.view === 'prev');
  const runPreviewJsButton = $('#run-preview-js');
  if (runPreviewJsButton) {
    runPreviewJsButton.setAttribute('aria-pressed', String(!!S.previewScripts));
    runPreviewJsButton.classList.toggle('active', !!S.previewScripts);
    runPreviewJsButton.textContent = S.previewScripts ? 'JS berjalan' : 'Jalankan JS';
    runPreviewJsButton.title = S.previewScripts ? 'Matikan JavaScript pratonton' : 'Jalankan JavaScript dalam pratonton terasing';
  }

  // 3. Kemaskini komponen visual
  refresh();
  renderIns();
  renderLayersPanel();
  renderCanvaBar();
  if (S.view === 'prev') renderPreview();

  // Toggle Panel Kiri: HTML vs CSS Studio
  const panelHtml = $('#side-panel-html');
  const panelCss = $('#side-panel-css');
  const isCssSide = S.sideTab === 'css';
  if (panelHtml) panelHtml.hidden = isCssSide;
  if (panelCss) panelCss.hidden = !isCssSide;

  const tabHtmlBtn = $('#sidetab-html');
  const tabCssBtn = $('#sidetab-css');
  if (tabHtmlBtn) tabHtmlBtn.classList.toggle('active', !isCssSide);
  if (tabCssBtn) tabCssBtn.classList.toggle('active', isCssSide);

  // Sync token inputs
  const th = S.theme || { primary: '#203a5b', bg: '#ffffff', text: '#203a5b' };
  const tokPri = $('#token-primary');
  const tokBg = $('#token-bg');
  const tokTxt = $('#token-text');
  if (tokPri) { tokPri.value = th.primary || '#203a5b'; const c = $('#token-primary-val'); if (c) c.textContent = tokPri.value; }
  if (tokBg) { tokBg.value = th.bg || '#ffffff'; const c = $('#token-bg-val'); if (c) c.textContent = tokBg.value; }
  if (tokTxt) { tokTxt.value = th.text || '#203a5b'; const c = $('#token-text-val'); if (c) c.textContent = tokTxt.value; }

  // Sync Viewport buttons
  document.querySelectorAll('[data-vp]').forEach(btn => {
    const active = btn.dataset.vp === (S.viewport || 'desktop');
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  // Sync Suis CSS Responsif (@media)
  const respBtn = $('#btn-toggle-resp-css');
  if (respBtn) {
    respBtn.setAttribute('aria-pressed', !!S.responsiveCSS);
    const txt = respBtn.querySelector('.toggle-pill-text');
    if (txt) txt.textContent = S.responsiveCSS ? 'ON' : 'OFF';
  }

  // Sync Butang Mod Tag HTML (Semantik HTML5 vs HTML Biasa div)
  const isDivMode = S.htmlMode === 'div';
  document.querySelectorAll('[data-html-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.htmlMode === (S.htmlMode || 'semantic'));
  });
  const subLbl = $('#side-html-mode-sub');
  if (subLbl) subLbl.textContent = isDivMode ? 'Biasa <div>' : 'HTML5 semantik';

  // Sync Gap & Row buttons
  document.querySelectorAll('[data-set-gap]').forEach(btn => {
    btn.classList.toggle('active', +btn.dataset.setGap === (S.gridGap !== undefined ? S.gridGap : 8));
  });
  document.querySelectorAll('[data-set-rowh]').forEach(btn => {
    btn.classList.toggle('active', +btn.dataset.setRowh === (S.gridRowH || 40));
  });

  const isExtOrAll = S.hasCss && (S.sty === 'ext' || S.sty === 'all');
  if (S.tab === 'css' && !isExtOrAll) {
    S.tab = 'html';
  }

  document.querySelectorAll('#mode [data-m], #mode [data-dw-view]').forEach(button => {
    const active = button.dataset.m === 'c' ? S.mode === 'c'
      : button.dataset.m === 's' ? S.mode === 's'
      : button.dataset.dwView === 'plan' ? S.mode === 'v' && S.view === 'plan'
      : button.dataset.dwView === 'prev' ? S.mode === 'v' && S.view === 'prev'
      : button.dataset.dwView === 'nodes' ? S.mode === 'v' && S.view === 'nodes'
      : false;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  document.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === S.view));
  document.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x.dataset.t === S.tab));
  document.querySelectorAll('[data-tool]').forEach(x => x.setAttribute('aria-pressed', x.dataset.tool === S.tool));
  document.querySelectorAll('[data-sty]').forEach(x => x.setAttribute('aria-pressed', x.dataset.sty === S.sty));

  const cssTabBtn = document.querySelector('[data-t="css"]');
  if (cssTabBtn) {
    cssTabBtn.disabled = false;
    cssTabBtn.removeAttribute('aria-disabled');
    cssTabBtn.title = 'Buka style.css; kod CSS boleh ditambah bila-bila masa';
    cssTabBtn.innerHTML = 'style.css';
  }

  $('#layer-css').setAttribute('aria-pressed', S.hasCss);
  $('#layer-css').textContent = S.hasCss ? 'CSS' : 'Tanpa CSS';
  $('#layer-js').setAttribute('aria-pressed', S.hasJs);
  $('#layer-js').textContent = S.hasJs ? 'JS' : 'Tanpa JS';

  // Sinkronisasi Canva Left Rail & Contextual Drawer
  const mainEl = $('main');
  if (mainEl) {
    mainEl.classList.toggle('drawer-collapsed', !S.drawerOpen);
  }

  document.querySelectorAll('.rail-item[data-rail]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rail === S.railTab);
  });

  const drawerTitleMap = {
    elem: { icon: '📦', title: S.htmlMode === 'div' ? 'Elemen <div>' : 'Elemen HTML5' },
    tpl: { icon: '📐', title: 'Templat susun atur' },
    ins: { icon: '⚙️', title: 'Tetapan elemen' },
    layers: { icon: '📑', title: 'Susunan lapisan' },
    css: { icon: '🎨', title: 'Gaya dan saiz peranti' },
    ai: { icon: '💡', title: 'Tutor AI' }
  };

  const curDrawerMeta = drawerTitleMap[S.railTab] || drawerTitleMap.elem;
  const dIcon = $('#drawer-icon');
  const dTitle = $('#drawer-title');
  if (dIcon) dIcon.textContent = curDrawerMeta.icon;
  if (dTitle) dTitle.textContent = curDrawerMeta.title;

  const panels = {
    elem: $('#drawer-panel-elem'),
    tpl: $('#drawer-panel-tpl'),
    ins: $('#drawer-panel-ins'),
    layers: $('#drawer-panel-layers'),
    css: $('#drawer-panel-css'),
    ai: $('#drawer-panel-ai')
  };
  Object.keys(panels).forEach(k => {
    if (panels[k]) panels[k].hidden = (k !== S.railTab);
  });

  if (S.railTab === 'ins') renderIns();
  if (S.railTab === 'layers') renderLayersPanel();
  if (S.railTab === 'ai') runAiAudit();

  const tlBtn = $('#tl');
  if (tlBtn) tlBtn.setAttribute('aria-pressed', S.drawerOpen);
  const tiBtn = $('#ti');
  if (tiBtn) tiBtn.setAttribute('aria-pressed', S.railTab === 'ins' && S.drawerOpen);

  if (!$('#ai-modal').hidden) runAiAudit();
}

function renderNodes() {
  const wrap = $('#nodes-wrap');
  if (!wrap) return;

  const pageKeys = Object.keys(S.pages);
  const rootKey = pageKeys.includes('index.html') ? 'index.html' : pageKeys[0];
  const otherKeys = pageKeys.filter(k => k !== rootKey);

  // 1. Kira statistik seni bina navigasi
  let totalLinks = 0;
  pageKeys.forEach(k => {
    totalLinks += (S.pages[k].links || []).length;
  });

  // 2. Bina Carta Aliran Navigasi SVG (Interactive Sitemap Flowchart)
  const svgW = 860;
  const itemH = 65;
  const gapY = 18;
  const rightItems = otherKeys.concat(S.extLinks.slice(0, 4));
  const totalRight = Math.max(1, rightItems.length);
  const svgH = Math.max(260, totalRight * (itemH + gapY) + 30);

  const rootX = 35;
  const rootW = 220;
  const rootH = 80;
  const rootY = Math.max(25, (svgH - rootH) / 2);

  const rootMidX = rootX + rootW;
  const rootMidY = rootY + rootH / 2;
  const targetX = 540;
  const targetW = 240;

  const svgConnectors = [];
  const svgNodes = [];

  // Gambar nod Utama (Root Node)
  const isRootCur = rootKey === S.curPage;
  svgNodes.push(`
    <g class="sitemap-node${isRootCur ? ' active' : ''}" data-page="${rootKey}" style="cursor:pointer">
      <rect x="${rootX}" y="${rootY}" width="${rootW}" height="${rootH}" rx="10"
            fill="#203a5b" stroke="#c4d7ed" stroke-width="${isRootCur ? '2.5' : '1.5'}"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"/>
      <text x="${rootX + 16}" y="${rootY + 28}" fill="#ffffff" font-size="13" font-family="'JetBrains Mono', monospace" font-weight="700">🏠 ${esc(S.pages[rootKey].name)}</text>
      <text x="${rootX + 16}" y="${rootY + 48}" fill="#c4d7ed" font-size="11" font-family="'Inter', sans-serif">🧭 Root Navigation Hub</text>
      <text x="${rootX + 16}" y="${rootY + 66}" fill="#c4d7ed" font-size="10" font-family="'JetBrains Mono', monospace">${(S.pages[rootKey].links || []).length} outgoing navigation links</text>
      ${isRootCur ? `<rect x="${rootX + rootW - 55}" y="${rootY + 12}" width="42" height="18" rx="9" fill="#c4d7ed" stroke="#c4d7ed"/><text x="${rootX + rootW - 34}" y="${rootY + 24}" fill="#203a5b" font-size="9.5" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="700">ACTIVE</text>` : ''}
    </g>
  `);

  // Gambar nod sasaran dan garisan aliran navigasi
  rightItems.forEach((item, idx) => {
    const isExt = typeof item === 'object';
    const itemKey = isExt ? item.id : item;
    const targetY = 20 + idx * (itemH + gapY);
    const targetMidY = targetY + itemH / 2;
    const isCur = itemKey === S.curPage;
    const isConnected = (S.pages[rootKey] && S.pages[rootKey].links && S.pages[rootKey].links.includes(itemKey));

    if (isConnected) {
      const cpx1 = rootMidX + 130;
      const cpy1 = rootMidY;
      const cpx2 = targetX - 130;
      const cpy2 = targetMidY;

      svgConnectors.push(`
        <path d="M ${rootMidX} ${rootMidY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${targetX - 4} ${targetMidY}"
              fill="none" stroke="#c4d7ed" stroke-width="2.2" marker-end="url(#arrow-cyan)"/>
        <g transform="translate(${(rootMidX + targetX) / 2 - 32}, ${(rootMidY + targetMidY) / 2 - 10})">
          <rect width="64" height="20" rx="4" fill="#203a5b" stroke="#c4d7ed" stroke-width="1"/>
          <text x="32" y="14" fill="#c4d7ed" font-size="9.5" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="600">🧭 &lt;nav&gt;</text>
        </g>
      `);
    }

    if (!isExt && S.pages[itemKey] && S.pages[itemKey].links && S.pages[itemKey].links.includes(rootKey)) {
      const returnY = targetMidY + 14;
      const cpx1 = targetX - 100;
      const cpy1 = returnY + 22;
      const cpx2 = rootMidX + 100;
      const cpy2 = rootMidY + 22;

      svgConnectors.push(`
        <path d="M ${targetX} ${returnY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${rootMidX + 4} ${rootMidY + 15}"
              fill="none" stroke="#c4d7ed" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#arrow-green)"/>
      `);
    }

    if (!isExt) {
      const p = S.pages[itemKey];
      svgNodes.push(`
        <g class="sitemap-node${isCur ? ' active' : ''}" data-page="${itemKey}" style="cursor:pointer">
          <rect x="${targetX}" y="${targetY}" width="${targetW}" height="${itemH}" rx="8"
                fill="#203a5b" stroke="#c4d7ed" stroke-width="${isCur ? '2' : '1'}"
                filter="drop-shadow(0 3px 10px rgba(0,0,0,0.4))"/>
          <text x="${targetX + 14}" y="${targetY + 26}" fill="#ffffff" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="600">📄 ${esc(p.name)}</text>
          <text x="${targetX + 14}" y="${targetY + 46}" fill="#c4d7ed" font-size="10.5" font-family="'Inter', sans-serif">🧭 Return Link: ${(p.links || []).includes(rootKey) ? 'Connected to Home' : 'No return link'}</text>
          ${isCur ? `<rect x="${targetX + targetW - 55}" y="${targetY + 12}" width="42" height="18" rx="9" fill="#c4d7ed" stroke="#c4d7ed"/><text x="${targetX + targetW - 34}" y="${targetY + 24}" fill="#203a5b" font-size="9.5" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="700">AKTIF</text>` : ''}
        </g>
      `);
    } else {
      svgNodes.push(`
        <g class="sitemap-node ext-node" style="cursor:default">
          <rect x="${targetX}" y="${targetY}" width="${targetW}" height="${itemH}" rx="8"
                fill="#203a5b" stroke="#c4d7ed" stroke-width="1.2" stroke-dasharray="3 3"/>
          <text x="${targetX + 14}" y="${targetY + 26}" fill="#ffffff" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="600">🔗 ${esc(item.title)}</text>
          <text x="${targetX + 14}" y="${targetY + 46}" fill="#c4d7ed" font-size="10" font-family="'JetBrains Mono', monospace">${esc(item.url || 'External Link')}</text>
        </g>
      `);
    }
  });

  const flowchartHtml = `
    <div class="nodes-flowchart-card">
      <div class="flowchart-head">
        <div class="flowchart-title-wrap">
          <span class="flowchart-ic">🧭</span>
          <div>
            <b class="flowchart-title">Website Navigation Flowchart (Visual Sitemap & Navigation Mesh)</b>
            <span class="flowchart-sub">Menunjukkan aliran pelawat merentasi halaman melalui bar navigasi &lt;nav&gt; dan butang &lt;a&gt;. Klik mana-mana kotak untuk terus membukanya di kanvas!</span>
          </div>
        </div>
        <div class="flowchart-legend">
          <span class="legend-item"><span class="legend-line line-primary"></span> &lt;nav&gt; Navigation Path</span>
          <span class="legend-item"><span class="legend-line line-primary"></span> Return Link to Home</span>
        </div>
      </div>
      <div class="flowchart-svg-wrap">
        <svg class="nodes-flow-svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="${svgH}">
          <defs>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c4d7ed"/>
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c4d7ed"/>
            </marker>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#c4d7ed" flood-opacity="0.6"/>
            </filter>
          </defs>
          <g class="flow-connectors">${svgConnectors.join('')}</g>
          <g class="flow-nodes">${svgNodes.join('')}</g>
        </svg>
      </div>
    </div>
  `;

  // 3. Bina Grid Pengurusan Navigasi Mengikut Halaman
  const cardsHtml = pageKeys.map(k => {
    const p = S.pages[k];
    const isCur = k === S.curPage;
    const links = p.links || [];

    // Imbas elemen navigasi dalam halaman
    const navBlock = p.blocks.find(b => b.type === 'nav');
    const buttonBlocks = p.blocks.filter(b => b.type === 'button');
    const footerBlock = p.blocks.find(b => b.type === 'footer');

    const targetOpts = pageKeys.filter(x => x !== k).map(x => `<option value="${x}">📄 ${S.pages[x].name}</option>`).join('') +
      S.extLinks.map(ext => `<option value="${ext.id}">🔗 ${ext.title}</option>`).join('');

    return `
      <div class="node-card${isCur ? ' active' : ''}">
        <div class="node-head">
          <div class="node-title-group">
            <span class="node-icon">📄</span>
            <div>
              <b class="node-name">${esc(p.name)}</b>
              <span class="node-meta">${p.blocks.length} elements on canvas</span>
            </div>
          </div>
          <button type="button" class="node-open-btn${isCur ? ' is-active' : ''}" data-page="${k}" title="Open and edit this page on canvas">
            ${isCur ? '● Currently Editing' : '👁️ Open on Canvas'}
          </button>
        </div>

        <div class="node-nav-components">
          <div class="nav-comp-title">🧭 Detected Navigation Components:</div>
          <div class="nav-comp-list">
            ${navBlock ? `<div class="nav-comp-item"><span class="badge-tag">&lt;nav&gt;</span> <span class="nav-comp-txt">${esc(navBlock.t || 'Site Menu')}</span></div>` : '<div class="nav-comp-item none"><span class="badge-tag dim">&lt;nav&gt;</span> <span class="dim">No nav menu bar</span></div>'}
            ${buttonBlocks.length ? buttonBlocks.map(btn => `<div class="nav-comp-item"><span class="badge-tag btn">&lt;a.btn&gt;</span> <span class="nav-comp-txt">${esc(btn.t || 'Action Button')}</span></div>`).join('') : ''}
            ${footerBlock ? `<div class="nav-comp-item"><span class="badge-tag foot">&lt;footer&gt;</span> <span class="nav-comp-txt">${esc(footerBlock.t || 'Footer Links')}</span></div>` : ''}
          </div>
        </div>

        <div class="node-links">
          <div class="node-links-head">
            <b>Outgoing Links (${links.length}):</b>
            <span class="node-links-badge">${links.length ? 'Active' : 'Isolated'}</span>
          </div>
          <div class="node-links-list">
            ${links.length ? links.map((linkTarget, idx) => {
              const targetName = S.pages[linkTarget] ? S.pages[linkTarget].name : (S.extLinks.find(e => e.id === linkTarget) || {}).title || linkTarget;
              const isExternal = String(linkTarget).startsWith('ext-');
              return `
                <div class="node-link-item${isExternal ? ' ext' : ''}">
                  <span class="node-link-dest">
                    ${isExternal ? '🌐' : '➡'} ${esc(targetName)}
                  </span>
                  <button type="button" class="node-link-del" data-del-link="${k}:${idx}" title="Disconnect this navigation link">✕</button>
                </div>
              `;
            }).join('') : '<div class="node-empty-links">⚠️ This page is not connected to any other page yet. Please add a link below.</div>'}
          </div>

          <div class="node-add-link-box">
            <label class="add-link-lbl">Connect to:</label>
            <div class="node-add-link-row">
              <select id="sel-link-${k.replace(/\./g, '_')}" class="node-select">${targetOpts}</select>
              <button type="button" class="btn-node-add" data-add-link="${k}">+ Connect</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 4. Kad Pautan Luar
  const extCardHtml = `
    <div class="node-card ext-card">
      <div class="node-head">
        <div class="node-title-group">
          <span class="node-icon">🌐</span>
          <div>
            <b class="node-name" style="color:var(--am)">External Web Links</b>
            <span class="node-meta">${S.extLinks.length} external third-party links</span>
          </div>
        </div>
        <button type="button" class="btn-node-add ext-add-btn" id="btn-add-ext">+ Add External</button>
      </div>
      <div class="node-desc">External destinations such as official WhatsApp, Google Maps, or social media links.</div>
      <div class="node-links-list">
        ${S.extLinks.map((ext, i) => `
          <div class="node-link-item ext">
            <span class="node-link-dest">
              <b>${esc(ext.title)}</b><br>
              <small style="color:var(--mute)">${esc(ext.url)}</small>
            </span>
            <button type="button" class="node-link-del" data-del-ext="${i}" title="Delete external link">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Cantumkan keseluruhan paparan Peta Sambungan
  wrap.innerHTML = `
    <div class="nodes-top-bar">
      <div class="nodes-title-main">
        <span>🗺️ Website Navigation Map (Sitemap Architecture)</span>
        <div class="nodes-stat-pills">
          <span class="stat-pill">📄 ${pageKeys.length} Halaman</span>
          <span class="stat-pill">🧭 ${totalLinks} Navigation Links</span>
          <span class="stat-pill active">⚡ Active Navigation Flow</span>
        </div>
      </div>
    </div>
    ${flowchartHtml}
    <div class="nodes-sub-title">
      <span>🗂️ Manage Navigation Links by Page File:</span>
    </div>
    <div class="nodes-grid" id="nodes-grid">
      ${cardsHtml}
      ${extCardHtml}
    </div>
  `;
}

function runAiAudit() {
  const types = S.blocks.map(b => b.type);
  const hasHead = types.includes('header');
  const hasNav = types.includes('nav');
  const hasHero = types.includes('hero') || types.includes('slider');
  const hasContent = types.includes('section') || types.includes('card');
  const hasFoot = types.includes('footer');

  const report = [];
  if (!hasHead) report.push('⚠️ No <b>&lt;header&gt;</b> yet. Following human anatomy, start with the page header on the very top row.');
  else if (!hasNav) report.push('💡 You have a Header, try adding a <b>&lt;nav&gt;</b> for menu navigation links.');
  if (!hasHero) report.push('💡 Add a <b>Hero</b> or <b>Slider</b> beneath the header as the primary visitor highlight.');
  if (!hasContent) report.push('💡 Main body is currently empty. Add several <b>&lt;section&gt;</b> or <b>Card (&lt;article&gt;)</b> blocks.');
  if (!hasFoot) report.push('⚠️ No <b>&lt;footer&gt;</b> at the bottom yet for copyright and footer links.');
  if (hasHead && hasHero && hasContent && hasFoot) report.push('🎉 <b>Excellent!</b> Your webpage anatomical structure is complete (Header ➡ Hero ➡ Body ➡ Footer).');

  if (S.htmlMode === 'div') {
    report.push('⚠️ <b>Plain HTML Mode Active:</b> Your site currently uses classic <code>&lt;div&gt;</code> tags (Div Soup). For full W3C standard compliance, screen-reader accessibility, and optimal SEO, click <b>🏷️ Semantic HTML5</b>.');
  } else {
    report.push('🏷️ <b>Semantic HTML5 Compliant:</b> Your code complies with official W3C semantic standards (&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;section&gt;, &lt;footer&gt;).');
  }

  const auditHtml = report.join('<br><br>');
  if ($('#ai-audit-text')) $('#ai-audit-text').innerHTML = auditHtml;
  if ($('#drawer-ai-audit-text')) $('#drawer-ai-audit-text').innerHTML = auditHtml;
}

// Pasang Senarai Elemen Mengikut Kumpulan Anatomi (Atas, Tengah, Komponen/Media, Bawah)
const PAL_GROUPS = [
  {
    title: '🔝 Bahagian atas',
    keys: ['header', 'nav', 'logo']
  },
  {
    title: '🏛️ Kandungan',
    keys: ['hero', 'section', 'card', 'aside']
  },
  {
    title: '🧱 Pautan & komponen',
    keys: ['text', 'link', 'button', 'dropdown']
  },
  {
    title: '🖼️ Media',
    keys: ['image', 'slider']
  },
  {
    title: '🔻 Bahagian bawah',
    keys: ['footer']
  }
];

$('#pal').innerHTML = PAL_GROUPS.map(g => `
  <div class="pal-group">
    <div class="pal-group-head">
      <span class="pal-group-title">${g.title}</span>
      <span class="pal-group-count">${g.keys.length}</span>
    </div>
    <div class="pal-grid">
      ${g.keys.map(k => {
        const item = TY[k] || { n: k, tag: 'div' };
        return `
          <button type="button" draggable="true" data-add="${k}" class="pal-btn" title="Drag or click to add ${item.n} (&lt;${item.tag}&gt;)">
            <span class="pal-ic-wrap">${icon(k, 'pal-ic', 14)}</span>
            <span class="pal-txt-wrap">
              <span class="pal-title">${item.n}</span>
              <small class="pal-sub">&lt;${item.tag}&gt;</small>
            </span>
          </button>
        `;
      }).join('')}
    </div>
  </div>
`).join('');
/**
 * Menghasilkan pratonton lakaran kenit (thumbnail SVG) bagi susun atur templat.
 * @param {Array} t Data templat daripada TP
 * @returns {string} String SVG
 */
const thumb = t => {
  const b = t[1];
  const big = b.reduce((m, x, i) => (x[3] * x[4] > b[m][3] * b[m][4] ? i : m), 0);
  return `<svg viewBox="0 0 120 100" width="100%" aria-hidden="true"><rect x=".5" y=".5" width="119" height="99" rx="4" fill="none" stroke="#fff" opacity=".7"/>${[8, 14, 20].map(x => `<circle cx="${x}" cy="6" r="1.8" fill="#fff"/>`).join('')}${b.map((a, i) => `<rect x="${(a[1] - 1) * 9.2 + 4}" y="${(a[2] - 1) * 6.6 + 14}" width="${a[3] * 9.2 - 2}" height="${a[4] * 6.6 - 2}" fill="${i === big ? '#00d4ff' : '#fff'}" opacity="${i === big ? '.85' : '.3'}"/>`).join('')}</svg>`;
};

$('#tpl').innerHTML = TP.map((t, i) => `<button type="button" data-tpl="${i}" title="${esc(t[0])}"><div class="tpl-thumb">${thumb(t)}</div><span class="tpl-title">${esc(t[0])}</span></button>`).join('');
$('#dt').textContent = 'Date: ' + new Date().toLocaleDateString('en-US');

$('#pal').addEventListener('dragstart', e => {
  const b = e.target.closest('[data-add]');
  if (b) e.dataTransfer.setData('text/plain', b.dataset.add);
});

// Penyorot Silang (Cross-Hover)
function hov(id) {
  document.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
  if (!S.cssHighlight) return;
  if (id) document.querySelectorAll(`.blk[data-id="${id}"],.ln[data-id="${id}"]`).forEach(x => x.classList.add('hl'));
}
document.addEventListener('mouseover', e => {
  const x = e.target.closest('.blk,.ln');
  hov((x && x.dataset.id) || null);
});

// Buka/Tutup Panel Tepi
function tp(id) {
  if (id === 'tl') {
    S.drawerOpen = !S.drawerOpen;
    render();
  } else if (id === 'ti') {
    S.railTab = 'ins';
    S.drawerOpen = true;
    render();
  }
}

// Pengendali Klik Dokumen
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let x;
  if (x = q('#run-preview-js')) {
    S.previewScripts = !S.previewScripts;
    if (S.previewScripts) S.hasJs = true;
    render();
    toast(S.previewScripts ? 'JavaScript pratonton dihidupkan dalam ruang terasing.' : 'JavaScript pratonton dimatikan.');
  } else if (x = q('[data-rail]')) {
    const tab = x.dataset.rail;
    if (S.railTab === tab) {
      S.drawerOpen = !S.drawerOpen;
    } else {
      S.railTab = tab;
      S.drawerOpen = true;
    }
    render();
  } else if (x = q('#drawer-close-btn,#side-close-btn')) {
    S.drawerOpen = false;
    render();
  } else if (x = q('#side-open-btn')) {
    S.drawerOpen = true;
    render();
  } else if (x = q('[data-add]')) {
    if (hasCodePreviewOverride()) insertCodeSourceElement(x.dataset.add);
    else add(x.dataset.add);
  } else if (x = q('[data-tpl]')) {
    if (hasCodePreviewOverride()) clearPageCodeOverrides();
    applyTpl(+x.dataset.tpl);
  }
  else if (x = q('[data-right-tab]')) {
    S.rightTab = x.dataset.rightTab;
    renderLayersPanel();
  } else if (x = q('[data-layer-select]')) {
    S.sel = x.dataset.layerSelect;
    render();
  } else if (x = q('[data-layer-move]')) {
    moveLayer(x.dataset.layerId, x.dataset.layerMove);
  }
  else if (x = q('#tl,#side-close-btn,#side-open-btn')) tp('tl');
  else if (x = q('#ti')) tp('ti');
  else if (x = q('#layer-html')) toast('HTML is the fundamental skeleton of the webpage, always active.');
  else if (x = q('#layer-css')) {
    S.hasCss = !S.hasCss;
    render();
    toast(S.hasCss ? 'CSS Enabled (+ CSS)' : 'CSS Disabled (No CSS)');
  } else if (x = q('#layer-js')) {
    S.hasJs = !S.hasJs;
    render();
    toast(S.hasJs ? 'JS Enabled (+ JS)' : 'JS Disabled (No JS)');
  } else if (x = q('#ai-btn')) {
    $('#ai-modal').hidden = false;
    runAiAudit();
  } else if (x = q('#ai-close-btn')) {
    $('#ai-modal').hidden = true;
  } else if (x = q('[data-q]')) {
    const ansBox = $('#ai-ans');
    ansBox.innerHTML = AI_KNOWLEDGE[x.dataset.q] || '';
    ansBox.classList.add('show');
  } else if (x = q('[data-cmode]')) {
    setCodeMode(x.dataset.cmode);
  } else if (q('#btn-apply-code')) {
    applyCodeChanges(true);
  } else if (q('#btn-revert-code')) {
    revertCodeChanges();
  } else if (q('#btn-goto-error')) {
    gotoErrorLine();
  } else if (q('#code-status-pill')) {
    if (S.lastErrorCode && S.lastErrorCode.line) {
      if (S.codeMode !== 'edit') setCodeMode('edit', S.lastErrorCode.line);
      else gotoErrorLine();
    }
  } else if (x = q('[data-del-page]')) {
    e.stopPropagation();
    const pdel = x.dataset.delPage;
    const pageName = S.pages[pdel] ? S.pages[pdel].name : pdel;
    appConfirm(
      `Are you sure you want to delete page tab "${pageName}"? All elements on this page will be removed.`,
      'Delete Page Tab',
      '🗑️',
      true,
      'Delete Page'
    ).then(ok => {
      if (!ok) return;
      delete S.pages[pdel];
      if (Object.keys(S.pages).length === 0) {
        S.pages['index.html'] = {
          name: 'Home (index.html)',
          blocks: [],
          links: []
        };
        S.curPage = 'index.html';
        toast('Page deleted. Opening new default home page (index.html).');
      } else {
        S.curPage = Object.keys(S.pages)[0];
        toast(`Page "${pageName}" has been deleted.`);
      }
      syncCurPage();
      render();
    });
  } else if (x = q('[data-page]')) {
    const pg = x.dataset.page;
    if (pg && S.pages[pg]) {
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      S.curPage = pg;
      syncCurPage();
      S.sel = null;
      render();
      toast('Switched to page: ' + S.pages[pg].name);
    }
  } else if (x = q('#btn-add-page')) {
    appPrompt(
      'Masukkan nama fail halaman baru (cth: services.html atau galeri.html):',
      'services.html',
      'Tambah Halaman Baru',
      '📄',
      'nama-fail.html'
    ).then(newName => {
      if (!newName || !newName.trim()) return;
      let cleanName = newName.trim();
      if (!cleanName.endsWith('.html')) cleanName += '.html';
      const safeId = cleanName.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      if (safeId && !S.pages[safeId]) {
        S.pages[safeId] = {
          name: safeId,
          blocks: [
            { id: '1', type: 'header', c: 1, r: 1, w: 12, h: 1, t: safeId, f: 0 },
            { id: '2', type: 'footer', c: 1, r: 12, w: 12, h: 1, t: 'Hak cipta 2026', f: 0 }
          ],
          links: ['index.html']
        };
        S.curPage = safeId;
        syncCurPage();
        render();
        toast('New page "' + safeId + '" added!');
      } else {
        appAlert('Invalid name or page already exists! Please use a different name.', 'Page Error', '⚠️');
      }
    });
  } else if (x = q('[data-add-link]')) {
    const fromP = x.dataset.addLink;
    const selEl = $('#sel-link-' + fromP.replace(/\./g, '_'));
    if (selEl && S.pages[fromP]) {
      const target = selEl.value;
      S.pages[fromP].links = S.pages[fromP].links || [];
      if (!S.pages[fromP].links.includes(target)) {
        S.pages[fromP].links.push(target);
        render();
        toast('Link successfully connected!');
      } else toast('Link to this destination already exists.');
    }
  } else if (x = q('[data-del-link]')) {
    const [fromP, idx] = x.dataset.delLink.split(':');
    if (S.pages[fromP] && S.pages[fromP].links) {
      S.pages[fromP].links.splice(+idx, 1);
      render();
      toast('Link disconnected.');
    }
  } else if (x = q('#btn-add-ext')) {
    appPrompt(
      'Masukkan nama pautan luar (cth: Instagram Kami / Facebook):',
      'Media Sosial',
      'Add External Link',
      '🌐',
      'cth: Instagram Kami'
    ).then(t => {
      if (!t || !t.trim()) return;
      appPrompt(
        'Enter full web URL address:',
        'https://',
        'External Link URL',
        '🔗',
        'https://...'
      ).then(u => {
        if (!u || !u.trim()) return;
        S.extLinks.push({ id: 'ext-' + Date.now(), title: t.trim(), url: u.trim() });
        render();
        toast('External link added!');
      });
    });
  } else if (x = q('[data-del-ext]')) {
    S.extLinks.splice(+x.dataset.delExt, 1);
    render();
    toast('External link deleted.');
  } else if (x = q('#btn-dl-all')) {
    exportProject();
  } else if (x = q('[data-del]')) {
    e.stopPropagation();
    deleteBox(x.dataset.del);
  } else if (x = q('[data-pk]')) {
    const k = x.dataset.pk;
    if (k && pend) {
      snap();
      const b = mk(k, pend.c, pend.r, pend.w, pend.h);
      S.blocks.push(b);
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      S.sel = b.id;
      hint(b);
    }
    pop(null);
    render();
  } else if (x = q('[data-dw-view]')) {
    const v = x.dataset.dwView;
    if (v === 'prev' || v === 'nodes') {
      if (S.mode === 'v' && S.view === v) {
        const fallback = workspaceReturnState || { mode: 'v', view: 'plan' };
        S.mode = fallback.mode;
        S.view = fallback.view;
        workspaceReturnState = null;
      } else {
        workspaceReturnState = { mode: S.mode, view: S.view };
        S.mode = 'v';
        S.view = v;
      }
      toast(S.view === 'prev' ? 'Pratonton aktif' : S.view === 'nodes' ? 'Aliran halaman aktif' : 'Kembali ke paparan asal');
    } else if (v === 'plan') {
      workspaceReturnState = null;
      S.mode = 'v';
      S.view = 'plan';
      toast('Reka bentuk aktif');
    }
    render();
  } else if (x = q('[data-m]')) {
    workspaceReturnState = null;
    S.mode = x.dataset.m;
    S.view = 'plan';
    if (S.mode === 's') {
      toast('Paparan Split: kanvas dan kod bersebelahan');
    } else if (S.mode === 'c') {
      toast('Editor kod dibuka');
    } else if (S.mode === 'v') {
      toast('Kanvas reka bentuk dibuka');
    }
    render();
  } else if (x = q('[data-dw-pick]')) {
    const pick = x.dataset.dwPick;
    if (pick === 'body' || pick === 'main') {
      S.sel = null;
      render();
      toast(pick === 'body' ? 'Selected <body> root container' : 'Selected <main> grid canvas');
    } else {
      const b = S.blocks.find(item => item.id === pick);
      if (b) {
        S.sel = b.id;
        render();
        toast(`Selected <${TY[b.type]?.tag || 'div'}> (${TY[b.type]?.n || b.type})`);
      }
    }
  } else if (x = q('[data-v]')) {
    S.view = x.dataset.v;
    render();
  } else if (x = q('[data-t]')) {
    S.tab = x.dataset.t;
    if (S.tab === 'css') {
      const cssWasOff = !S.hasCss || !['ext', 'all'].includes(S.sty);
      S.hasCss = true;
      if (hasCodeHtmlOverride()) convertSourceCssMode('ext');
      else if (!Object.prototype.hasOwnProperty.call(pageCodeEdits(), 'css')) pageCodeEdits().css = '';
      S.sty = 'ext';
      S.sideTab = 'css';
      if (cssWasOff) toast('style.css dibuka; CSS dihidupkan dalam mod External.');
      else toast('style.css dibuka.');
    } else if (S.tab === 'html') {
      S.sideTab = 'html';
    }
    render();
  } else if (x = q('[data-sidetab]')) {
    S.sideTab = x.dataset.sidetab;
    render();
    toast(S.sideTab === 'css' ? 'Left panel: 🎨 CSS Studio & Responsive' : 'Left panel: 📄 HTML Elements & Layout');
  } else if (x = q('[data-vp]')) {
    S.viewport = x.dataset.vp;
    if (S.view === 'plan' && (S.viewport === 'mobile' || S.viewport === 'tablet')) {
      S.view = 'prev';
    }
    render();
    const vpNames = { mobile: 'Telefon (375 px)', tablet: 'Tablet (768 px)', desktop: 'Muat ikut ruang tersedia' };
    toast(`Pratonton: ${vpNames[S.viewport]}`);
  } else if (x = q('[data-set-gap]')) {
    snap();
    S.gridGap = +x.dataset.setGap;
    render();
    toast(`Grid Gap updated: ${S.gridGap}px`);
  } else if (x = q('[data-set-rowh]')) {
    snap();
    S.gridRowH = +x.dataset.setRowh;
    render();
    toast(`Grid Row Height (grid-auto-rows): ${S.gridRowH}px`);
  } else if (x = q('[data-theme-preset]')) {
    snap();
    const tpKey = x.dataset.themePreset;
    S.theme = S.theme || {};
    if (tpKey === 'blueprint') {
      S.theme = { primary: '#00d4ff', bg: '#041633', text: '#e0f2fe' };
    } else if (tpKey === 'light') {
      S.theme = { primary: '#2563eb', bg: '#ffffff', text: '#0f172a' };
    } else if (tpKey === 'dark') {
      S.theme = { primary: '#38bdf8', bg: '#0f172a', text: '#f8fafc' };
    } else if (tpKey === 'mint') {
      S.theme = { primary: '#10b981', bg: '#f0fdf4', text: '#064e3b' };
    }
    render();
    toast(`Quick Theme applied: ${tpKey.toUpperCase()}`);
  } else if (x = q('[data-sty]')) {
    if (!S.hasCss) {
      toast('Please enable the + CSS switch first.');
      return;
    }
    const nextStyleMode = x.dataset.sty;
    const sourceConverted = hasCodeHtmlOverride() && convertSourceCssMode(nextStyleMode);
    S.sty = nextStyleMode;
    const isExtOrAll = S.sty === 'ext' || S.sty === 'all';
    if (!isExtOrAll) {
      if (S.tab === 'css') S.tab = 'html';
      toast(`${x.textContent} mode active: style.css disabled (styling in HTML only).`);
    } else {
      toast('Styling format changed to: ' + x.textContent);
    }
    render();
    if (sourceConverted) toast(`Gaya kod bebas ditukar ke mod ${x.textContent}. Semak tab HTML dan CSS.`);
  } else if (x = q('[data-f]')) {
    snap();
    get(S.sel).f = +x.dataset.f;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (q('#del') || q('#del-top')) {
    deleteSelected();
  } else if (q('#undo')) {
    undo();
  } else if (q('#redo')) {
    redo();
  } else if (x = q('[data-tool]')) {
    S.tool = x.dataset.tool;
    render();
  } else if (x = q('[data-fold-toggle]')) {
    const fk = x.dataset.foldToggle;
    S.folded = S.folded || {};
    S.folded[fk] = !S.folded[fk];
    renderCode();
  } else if (x = q('#btn-toggle-hl')) {
    S.cssHighlight = !S.cssHighlight;
    renderCode();
    $('#btn-toggle-hl').setAttribute('aria-pressed', S.cssHighlight);
    $('#btn-toggle-hl').title = S.cssHighlight ? 'Serlahan kod dihidupkan · klik untuk matikan' : 'Serlahan kod dimatikan · klik untuk hidupkan';
    toast(S.cssHighlight ? 'Code highlighter enabled' : 'Code highlighter disabled');
  } else if (x = q('#btn-toggle-resp-css')) {
    S.responsiveCSS = !S.responsiveCSS;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
    toast(S.responsiveCSS ? '📱 Responsive CSS (@media): ENABLED' : '📱 Responsive CSS (@media): DISABLED');
  } else if (x = q('[data-html-mode]')) {
    S.htmlMode = x.dataset.htmlMode;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    if (hasCodeHtmlOverride()) convertSourceHtmlMode(S.htmlMode);
    else render();
    toast(S.htmlMode === 'semantic' ? '🏷️ Semantic HTML5 Mode Enabled (W3C Standards & SEO)' : '📦 Plain HTML Mode (Div Soup) Enabled');
  } else if (x = q('[data-nav-drop]')) {
    const b = get(S.sel);
    if (!b || b.type !== 'nav') return;
    const act = x.dataset.navDrop;
    const curTitle = S.selNavTitle || (b.t.split(/[,\s|]+/)[0] || 'Nav');
    b.dropdowns = b.dropdowns || {};
    snap();
    if (act === 'add') {
      let defSubs = ['Official WhatsApp', 'Hantar Emel', 'Peta Lokasi'];
      if (/produk|servis|pilihan/i.test(curTitle)) defSubs = ['Pakej Asas', 'Pakej Premium', 'Pakej Khas'];
      else if (/tentang|about/i.test(curTitle)) defSubs = ['Latar Belakang', 'Pasukan Kami', 'Visi & Misi'];
      b.dropdowns[curTitle] = defSubs;
      S.selNavTitle = curTitle;
      toast(`Menu "${curTitle}" converted to semantic Dropdown!`);
    } else {
      delete b.dropdowns[curTitle];
      if (S.selNavIdx !== null) delete b.dropdowns[S.selNavIdx];
      toast(`Menu "${curTitle}" reverted to regular link.`);
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (x = q('[data-cbar]')) {
    const act = x.dataset.cbar;
    const b = get(S.sel);
    if (!b) return;
    snap();
    if (act === 'fill') {
      const fillCycle = [0, 1, 2, 3, 4, 5, 'none'];
      const curIdx = fillCycle.indexOf(b.f);
      const nextIdx = (curIdx + 1) % fillCycle.length;
      b.f = fillCycle[nextIdx];
      const names = ['Putih', 'Biru Lembut', 'Kuning Emas', 'Kelabu Gelap', 'Oren Coral', 'Hijau Mint', 'Lutsinar (None)'];
      toast(`Background Color: ${names[nextIdx]}`);
    } else if (act === 'border') {
      if (!b.bw || b.bw === 0) { b.bw = 1; b.bs = 'solid'; toast('Border: 1px Solid'); }
      else if (b.bw === 1) { b.bw = 2; b.bs = 'solid'; toast('Border: 2px Solid'); }
      else if (b.bw === 2 && b.bs === 'solid') { b.bw = 2; b.bs = 'dashed'; toast('Border: 2px Dashed'); }
      else { b.bw = 0; b.bs = 'none'; toast('Border: None (0px)'); }
    } else if (act === 'radius') {
      const radCycle = [0, 4, 8, 16, 999];
      const curIdx = radCycle.indexOf(b.rad || 0);
      const nextIdx = (curIdx + 1) % radCycle.length;
      b.rad = radCycle[nextIdx];
      toast(`Corner Radius: ${b.rad === 999 ? 'Pill (Fully Rounded)' : b.rad + 'px'}`);
    } else if (act === 'bold') {
      const current = b.fw === 'bold' ? 700 : Number(b.fw) || 400;
      b.fw = current >= 700 ? 400 : 700;
      toast(`Ketebalan teks: ${b.fw >= 700 ? 'Tebal' : 'Biasa'}`);
    } else if (act === 'italic') {
      b.fst = b.fst === 'italic' ? 'normal' : 'italic';
      toast(`Italic: ${b.fst === 'italic' ? 'ON' : 'OFF'}`);
    } else if (act === 'underline') {
      b.td = b.td === 'underline' ? 'none' : 'underline';
      toast(`Underline: ${b.td === 'underline' ? 'ON' : 'OFF'}`);
    } else if (act === 'align') {
      const aligns = ['left', 'center', 'right'];
      const curIdx = aligns.indexOf(b.ta || 'left');
      const nextIdx = (curIdx + 1) % aligns.length;
      b.ta = aligns[nextIdx];
      const alignNames = { left: 'Rata Kiri', center: 'Rata Tengah', right: 'Rata Kanan' };
      toast(`Alignment: ${alignNames[b.ta]}`);
    } else if (act === 'pad') {
      const padCycle = [0, 8, 16, 24, 32];
      const curIdx = padCycle.indexOf(b.pad !== undefined ? b.pad : 16);
      const nextIdx = (curIdx + 1) % padCycle.length;
      b.pad = padCycle[nextIdx];
      toast(`Padding: ${b.pad}px`);
    } else if (act === 'effects') {
      const shdCycle = ['none', 'sm', 'md', 'lg'];
      const curIdx = shdCycle.indexOf(b.shd || 'none');
      const nextIdx = (curIdx + 1) % shdCycle.length;
      b.shd = shdCycle[nextIdx];
      const names = { none: 'Tiada', sm: 'Lembut', md: 'Timbul', lg: 'Jelas' };
      toast(`Shadow: ${names[b.shd]}`);
    } else if (act === 'position') {
      const idx = S.blocks.indexOf(b);
      if (idx !== -1 && idx < S.blocks.length - 1) {
        S.blocks.splice(idx, 1);
        S.blocks.push(b);
        toast('Element brought to front');
      }
    } else if (act === 'to-nav') {
      b.type = 'nav';
      if (!b.t.includes(',')) {
        b.t = b.t.trim().split(/\s+/).join(', ');
      }
      toast('Element converted to Navigation <nav> (Separate links)');
    } else if (act === 'to-link') {
      b.type = 'button';
      b.href = b.href || 'index.html';
      toast('Element converted to Link Button <a>');
    } else if (act === 'to-dropdown') {
      b.type = 'dropdown';
      b.items = b.items && b.items.length ? b.items : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
      toast('Pautan ditukar kepada menu dropdown');
    } else if (act === 'del') {
      deleteBox(b.id);
      return;
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (x = q('[data-cpop-eyedropper]')) {
    e.preventDefault();
    pickScreenColor();
  } else if (x = q('[data-cpop-mode]')) {
    setColorPopoverMode(x.dataset.cpopMode);
  } else if (x = q('[data-set-gradient]')) {
    applyPopoverGradient(x.dataset.setGradient);
  } else if (x = q('[data-cpop]')) {
    toggleColorPopover(x.dataset.cpop, x);
  } else if (x = q('[data-set-col]')) {
    applyPopoverColor(x.dataset.setCol);
  } else if (x = q('[data-set-fill]')) {
    if (x.dataset.setFill === 'none') applyPopoverNone();
    else applyPopoverColor(x.dataset.setFill);
  } else if (q('#cpop-close') || q('[data-cpop-done]')) {
    const pop = $('#color-popover');
    if (pop) pop.hidden = true;
    curPopType = null;
    colorPopoverUndoCaptured = false;
  } else if (x = q('[data-cfs]')) {
    const b = get(S.sel);
    if (!b) return;
    snap();
    const dir = x.dataset.cfs;
    let cur = b.fs || 14;
    if (dir === 'inc') cur = Math.min(cur + 2, 72);
    else cur = Math.max(cur - 2, 8);
    b.fs = cur;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (x = q('[data-cta]')) {
    const b = get(S.sel);
    if (!b) return;
    snap();
    b.ta = x.dataset.cta;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (x = q('[data-step]')) {
    const step = x.dataset.step;
    const b = get(S.sel);
    if (!b) return;
    snap();
    if (step == 'w-inc') {
      if (free(b.c, b.r, b.w + 1, b.h, [b.id])) b.w += 1;
      else toast('No grid space to increase width.');
    } else if (step == 'w-dec') {
      if (b.w > 1) b.w -= 1;
    } else if (step == 'h-inc') {
      if (free(b.c, b.r, b.w, b.h + 1, [b.id])) b.h += 1;
      else toast('No grid space to increase height.');
    } else if (step == 'h-dec') {
      if (b.h > 1) b.h -= 1;
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  } else if (x = q('[data-convert-type]')) {
    const b = get(S.sel);
    if (!b) return;
    snap();
    b.type = x.dataset.convertType;
    if (b.type === 'nav' && !b.t.includes(',')) {
      b.t = b.t.trim().split(/\s+/).join(', ');
    }
    if (b.type === 'button' && !b.href) {
      b.href = 'index.html';
    }
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
    toast(`Element successfully converted to <${TY[b.type].tag}> (${TY[b.type].n})`);
  } else if (q('#copy')) {
    const t = S.text || '';
    const ok = () => toast('Code copied to clipboard!');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok, () => {
      const a = document.createElement('textarea');
      a.value = t;
      document.body.appendChild(a);
      a.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (_) {
        toast('Copy failed. Select code and press Ctrl+C.');
      }
      a.remove();
    });
  } else if ((x = q('#src .ln')) && x.dataset.id) {
    const block = get(x.dataset.id);
    if (!block) return;
    S.sel = block.id;
    document.querySelectorAll('#src .ln').forEach(row => {
      row.classList.toggle('code-selected', row.dataset.id === block.id);
    });
    // Jangan bina semula #src di sini; double-click perlu kekal pada baris DOM yang sama.
    renderCanvas();
    renderIns();
    renderCanvaBar();
    renderLayersPanel();
    renderBreadcrumbs();
  }
});

$('#nm').addEventListener('input', e => {
  S.name = e.target.value;
  save();
});

// Pintasan Papan Kekunci
document.addEventListener('keydown', e => {
  const t = e.target.tagName;
  if (t == 'INPUT' || t == 'SELECT' || t == 'TEXTAREA') return;
  if (e.key == '[') return tp('tl');
  if (e.key == ']') return tp('ti');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() == 'z') {
    e.preventDefault();
    return e.shiftKey ? redo() : undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key == 'y') {
    e.preventDefault();
    return redo();
  }
  if (!e.ctrlKey && !e.metaKey && (e.key == 'v' || e.key == 'r')) {
    S.tool = e.key;
    return render();
  }
  if (e.key == 'Delete' || e.key == 'Backspace') {
    deleteSelected();
    return;
  }
  const b = get(S.sel);
  if (!b) return;
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (d && free(b.c + d[0], b.r + d[1], b.w, b.h, b.id)) {
    e.preventDefault();
    snap();
    b.c += d[0];
    b.r += d[1];
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    render();
  }
});

// Peristiwa Bar Canva (Google Fonts & Saiz Fon Input)
const canvaBarEl = $('#canva-bar');
if (canvaBarEl) {
  canvaBarEl.addEventListener('change', e => {
    const b = get(S.sel);
    if (!b) return;
    if (e.target.id === 'canva-tag-sel') {
      snap();
      b.type = e.target.value;
      if (b.type === 'nav' && !b.t.includes(',')) {
        b.t = b.t.trim().split(/\s+/).join(', ');
      }
      if (b.type === 'button' && !b.href) {
        b.href = 'index.html';
      }
      if (b.type === 'link' && !b.href) b.href = '#';
      if (b.type === 'dropdown' && !b.items) b.items = ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(`Element converted to <${TY[b.type].tag}> (${TY[b.type].n})`);
    } else if (e.target.id === 'canva-font-sel') {
      snap();
      b.font = e.target.value;
      const fontObj = GOOGLE_FONTS.find(f => f.fam === b.font) || { name: b.font };
      toast(`Google Font selected: ${fontObj.name}`);
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    } else if (e.target.id === 'canva-fs-input') {
      snap();
      b.fs = Math.max(8, Math.min(72, parseInt(e.target.value, 10) || 14));
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
    } else if (e.target.id === 'canva-weight-sel') {
      snap();
      b.fw = Number(e.target.value);
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(`Ketebalan teks: ${e.target.selectedOptions[0].textContent}`);
    }
  });

  canvaBarEl.addEventListener('input', e => {
    const b = get(S.sel);
    if (!b) return;
    if (e.target.id === 'canva-fs-input') {
      b.fs = Math.max(8, Math.min(72, parseInt(e.target.value, 10) || 14));
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      refresh();
    }
  });
}

// Mulakan Aplikasi
load();
$('#nm').value = S.name;
render();


// Utiliti HSV untuk medan pemilih warna 2D.
function hexToHsv(hex) {
  const raw = String(hex || '#203a5b').replace('#', '');
  const n = parseInt(raw.length === 3 ? raw.split('').map(ch => ch + ch).join('') : raw, 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max ? delta / max : 0, v: max };
}
function hsvToHex(h, s, v) {
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
function currentPopoverHex() {
  const b = get(S.sel);
  if (!b) return '#203a5b';
  const value = curPopType === 'col' ? b.col : b.f;
  const resolved = typeof value === 'number' ? FILLS[value] : value;
  const color = String(resolved || '').match(/#[\da-f]{6}/i)?.[0] || resolved;
  return /^#[\da-f]{6}$/i.test(String(color || '')) ? color : '#203a5b';
}
function colorSelectorMarkup(hex) {
  const hsv = hexToHsv(hex);
  return `<div class="cpop-selector-wrap">
    <div class="cpop-sv-field" id="cpop-sv-field" role="slider" tabindex="0" aria-label="Pilih tona dan kecerahan" aria-valuetext="${hex}" style="--picker-hue:hsl(${Math.round(hsv.h)} 100% 50%)">
      <span class="cpop-selector-marker" style="left:${hsv.s * 100}%;top:${(1 - hsv.v) * 100}%"></span>
    </div>
    <label class="cpop-hue-control"><span>Spektrum warna</span><input type="range" id="cpop-hue-range" min="0" max="359" value="${Math.round(hsv.h)}" aria-label="Spektrum warna"></label>
  </div>`;
}
async function pickScreenColor() {
  if (typeof EyeDropper === 'undefined') {
    toast('EyeDropper is not supported in this browser. Use the color picker or HEX code.');
    return;
  }
  try {
    const result = await new EyeDropper().open();
    applyPopoverColor(result.sRGBHex);
  } catch (error) {
    if (error?.name !== 'AbortError') toast('EyeDropper could not be opened.');
  }
}

// Pengurusan Popover Jadual Warna Pintar Canva
let curPopType = null;
let colorPopoverUndoCaptured = false;
function toggleColorPopover(type, btn) {
  const pop = $('#color-popover');
  if (!pop) return;
  if (!pop.hidden && curPopType === type) {
    pop.hidden = true;
    curPopType = null;
    return;
  }
  const b = get(S.sel);
  if (!b) return;
  curPopType = type;
  colorPopoverUndoCaptured = false;

  const bar = $('#canva-bar');
  if (bar && btn) {
    const barRc = bar.getBoundingClientRect();
    const btnRc = btn.getBoundingClientRect();
    const popWidth = Math.min(340, window.innerWidth - 32);
    pop.style.left = Math.max(8, Math.min(barRc.width - popWidth - 8, btnRc.left - barRc.left)) + 'px';
  }

  const isText = type === 'col';
  const currentValue = isText ? b.col : b.f;
  const isGradient = !isText && typeof currentValue === 'string' && /^(?:linear|radial|conic)-gradient\(/i.test(currentValue);
  const currentCss = typeof currentValue === 'number' ? FILLS[currentValue] : currentValue;
  const gradientStart = isGradient ? currentCss.match(/#[\da-f]{6}/i)?.[0] : null;
  const fillForTextContrast = b.f === 'none' ? '#ffffff' : (typeof b.f === 'number' ? (FILLS[b.f] || '#ffffff') : (b.f || '#ffffff'));
  const curHex = (isText ? (b.col || (isColorDark(fillForTextContrast) ? '#ffffff' : '#203a5b')) : (gradientStart || currentCss || '#ffffff'));
  const themeSwatches = ['#203a5b', '#c4d7ed', '#ffffff'];
  const gradients = [
    'linear-gradient(135deg, #203a5b 0%, #c4d7ed 100%)',
    'linear-gradient(135deg, #7c9ac5 0%, #e8f0fa 100%)',
    'linear-gradient(135deg, #ffd166 0%, #ff7a59 100%)',
    'linear-gradient(135deg, #b8f2c9 0%, #cfe0ff 100%)',
    'linear-gradient(135deg, #a78bfa 0%, #fbcfe8 100%)',
    'linear-gradient(135deg, #0b3d91 0%, #38bdf8 100%)'
  ];
  const labels = { '#203a5b':'Navy', '#c4d7ed':'Biru lembut', '#ffffff':'Putih', '#111827':'Arang', '#cfe0ff':'Biru muda', '#ffd166':'Kuning', '#2b2f3a':'Arang gelap', '#ff7a59':'Jingga', '#b8f2c9':'Hijau lembut', '#0b3d91':'Biru', '#06255c':'Navy gelap', '#1e293b':'Slate', '#f1f5f9':'Kelabu cerah', '#fef08a':'Kuning lembut', '#fecdd3':'Merah jambu', '#ddd6fe':'Ungu lembut', '#e0e7ff':'Indigo lembut' };
  const swatchButton = (color, attr, current) => {
    const value = String(color).toLowerCase();
    return `<button type="button" class="cpop-swatch${value === String(current || '').toLowerCase() ? ' active' : ''}" ${attr}="${qa(color)}" data-color-name="${labels[value] || value}" style="--swatch-color:${color};background:${color}" aria-label="${labels[value] || color}" title="${labels[value] || color} · ${color}"></button>`;
  };
  const designColors = [...new Set(S.blocks.flatMap(block => {
    const fill = typeof block.f === 'number' ? FILLS[block.f] : block.f;
    return [fill, block.col].filter(value => /^#[\da-f]{6}$/i.test(String(value || '')));
  }).map(color => color.toLowerCase()))].slice(0, 12);
  const names = designColors.map(color => swatchButton(color, isText ? 'data-set-col' : 'data-set-fill', curHex)).join('');
  const themes = themeSwatches.map(color => swatchButton(color, isText ? 'data-set-col' : 'data-set-fill', curHex)).join('');
  const baseColors = (isText ? TEXT_SWATCHES : FILL_SWATCHES.filter(color => color !== 'none'))
    .map(color => swatchButton(color, isText ? 'data-set-col' : 'data-set-fill', curHex)).join('');
  const gradientColors = gradients.map((gradient, index) => `<button type="button" class="cpop-gradient-swatch${isGradient && currentCss === gradient ? ' active' : ''}" data-set-gradient="${qa(gradient)}" data-color-name="gradient ${index + 1}" style="background:${gradient}" aria-label="Gradien ${index + 1}" title="Gradien ${index + 1}"></button>`).join('');
  const customInputId = isText ? 'cpop-custom-input' : 'cpop-custom-fill-input';
  const customInputValue = /^#[\da-f]{6}$/i.test(curHex) ? curHex : '#ffffff';
  const closeButton = '<button type="button" class="color-popover-close" id="cpop-close" title="Close" aria-label="Close">✕</button>';

  pop.innerHTML = `
    <div class="color-popover-head"><b>Warna</b>${closeButton}</div>
    <label class="cpop-search"><span aria-hidden="true">⌕</span><input type="search" id="cpop-search" placeholder="Cari warna atau kod HEX" autocomplete="off"></label>
    ${!isText ? `<div class="cpop-mode-tabs" role="tablist" aria-label="Jenis warna"><button type="button" role="tab" data-cpop-mode="solid" aria-selected="${!isGradient}" class="${!isGradient ? 'active' : ''}">Warna padu</button><button type="button" role="tab" data-cpop-mode="gradient" aria-selected="${isGradient}" class="${isGradient ? 'active' : ''}">Gradien</button></div>` : ''}
    <div class="cpop-solid-panel"${isGradient ? ' hidden' : ''}>
      <div class="cpop-current-row">
        <span class="cpop-current-swatch${!isText && b.f === 'none' ? ' is-none' : ''}" style="${isText || b.f !== 'none' ? `--current-color:${curHex};background:${curHex}` : ''}" title="${curHex}"></span>
        <label class="cpop-hex-field"><small>Kod HEX</small><input type="text" id="cpop-hex-input" value="${customInputValue}" maxlength="7" spellcheck="false" autocomplete="off"></label>
        <label class="cpop-picker-control" title="Pemilih warna"><input type="color" id="${customInputId}" value="${customInputValue}"><span>▧</span></label>
        <button type="button" class="cpop-eyedropper" data-cpop-eyedropper title="Ambil warna dari skrin" aria-label="Ambil warna dari skrin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.2 6.1 3.7 3.7M5 19l4.8-1.2L19 8.6a2.1 2.1 0 0 0-3-3L6.8 14.8 5 19Z"/><path d="m4 20 3.3-.8"/></svg></button>
      </div>
      ${colorSelectorMarkup(customInputValue)}
      <section class="cpop-section"><div class="cpop-section-title">Warna dalam rekaan</div><div class="cpop-design-colors">${names || '<span class="cpop-empty">Warna pilihan akan muncul di sini</span>'}</div></section>
      <section class="cpop-section"><div class="cpop-section-title">Warna tema</div><div class="cpop-theme-row">${themes}${!isText ? '<button type="button" class="cpop-swatch is-none" data-set-fill="none" data-color-name="lutsinar" aria-label="Tiada warna" title="Tiada warna"></button>' : ''}</div></section>
      <section class="cpop-section cpop-base-section"><div class="cpop-section-title">Warna pilihan</div><div class="color-popover-grid">${baseColors}</div></section>
    </div>
    ${!isText ? `<div class="cpop-gradient-panel"${isGradient ? '' : ' hidden'}><section class="cpop-section"><div class="cpop-section-title">Gradien tema</div><div class="cpop-gradient-grid">${gradientColors}</div></section><p class="cpop-gradient-hint">Pilih gradien untuk guna pada latar elemen.</p></div>` : ''}
  `;
  pop.hidden = false;
  syncColorSelector(customInputValue);
}

function setColorPopoverMode(mode) {
  const solid = $('#cpop-solid-panel');
  const gradient = $('.cpop-gradient-panel');
  if (!solid || !gradient) return;
  const isGradient = mode === 'gradient';
  solid.hidden = isGradient;
  gradient.hidden = !isGradient;
  document.querySelectorAll('[data-cpop-mode]').forEach(tab => {
    const active = tab.dataset.cpopMode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}
function applyPopoverGradient(value) {
  const b = get(S.sel);
  if (!b || curPopType !== 'fill') return;
  if (b.f !== value) {
    if (!colorPopoverUndoCaptured) { snap(); colorPopoverUndoCaptured = true; }
    b.f = value;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
    renderCanvaBar();
  }
  document.querySelectorAll('.cpop-gradient-swatch').forEach(swatch => swatch.classList.toggle('active', swatch.dataset.setGradient === value));
}
function applyPopoverNone() {
  const b = get(S.sel);
  if (!b || curPopType !== 'fill') return;
  if (b.f !== 'none') {
    if (!colorPopoverUndoCaptured) { snap(); colorPopoverUndoCaptured = true; }
    b.f = 'none';
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
    renderCanvaBar();
  }
  const preview = $('.cpop-current-swatch');
  if (preview) { preview.classList.add('is-none'); preview.style.background = ''; preview.title = 'Tiada warna'; }
  document.querySelectorAll('[data-set-fill]').forEach(swatch => swatch.classList.toggle('active', swatch.dataset.setFill === 'none'));
}

// Tutup popover jika klik di luar
document.addEventListener('pointerdown', e => {
  const pop = $('#color-popover');
  if (pop && !pop.hidden) {
    if (!pop.contains(e.target) && !e.target.closest('#canva-fill-btn') && !e.target.closest('#canva-col-btn')) {
      pop.hidden = true;
      curPopType = null;
    }
  }
});

// Input warna khas dinamik: HEX dan pemilih warna kekal segerak.
function applyPopoverColor(value) {
  const normalized = String(value || '').trim().replace(/^#?([\da-f]{6})$/i, '#$1');
  if (!/^#[\da-f]{6}$/i.test(normalized)) return false;
  const b = get(S.sel);
  if (!b) return false;
  const key = curPopType === 'col' ? 'col' : 'f';
  const next = normalized.toLowerCase();
  const current = key === 'f' && typeof b.f === 'number' ? FILLS[b.f] : b[key];
  if (String(current || '').toLowerCase() !== next) {
    if (!colorPopoverUndoCaptured) {
      snap();
      colorPopoverUndoCaptured = true;
    }
    b[key] = next;
    if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
    refresh();
    renderCanvaBar();
  }
  const hexInput = $('#cpop-hex-input');
  if (hexInput && document.activeElement !== hexInput) hexInput.value = next;
  syncColorSelector(next);
  const previewSwatch = $('.cpop-current-swatch');
  document.querySelectorAll('[data-set-col],[data-set-fill]').forEach(swatch => {
    const picked = swatch.dataset.setCol || swatch.dataset.setFill;
    swatch.classList.toggle('active', String(picked).toLowerCase() === next);
  });
  if (previewSwatch) {
    previewSwatch.classList.remove('is-none');
    previewSwatch.style.background = next;
    previewSwatch.style.setProperty('--current-color', next);
    previewSwatch.title = next;
  }
  return true;
}

function syncColorSelector(hex) {
  const hsv = hexToHsv(hex);
  const hue = $('#cpop-hue-range');
  const field = $('#cpop-sv-field');
  const marker = $('.cpop-selector-marker');
  if (hue && document.activeElement !== hue) hue.value = Math.round(hsv.h);
  if (field) {
    field.style.setProperty('--picker-hue', `hsl(${Math.round(hsv.h)} 100% 50%)`);
    field.setAttribute('aria-valuetext', hex);
  }
  if (marker) {
    marker.style.left = `${hsv.s * 100}%`;
    marker.style.top = `${(1 - hsv.v) * 100}%`;
  }
}
let draggingColorField = false;
function updateFromColorField(event) {
  const field = $('#cpop-sv-field');
  const hue = $('#cpop-hue-range');
  if (!field || !hue) return;
  const rect = field.getBoundingClientRect();
  const s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  const marker = $('.cpop-selector-marker');
  if (marker) { marker.style.left = `${s * 100}%`; marker.style.top = `${(1 - v) * 100}%`; }
  applyPopoverColor(hsvToHex(Number(hue.value), s, v));
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('#cpop-sv-field')) {
    draggingColorField = true;
    updateFromColorField(e);
    e.preventDefault();
  }
});
document.addEventListener('pointermove', e => { if (draggingColorField) updateFromColorField(e); });
document.addEventListener('pointerup', () => { draggingColorField = false; });
document.addEventListener('keydown', e => {
  const field = e.target.closest('#cpop-sv-field');
  if (!field || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const hsv = hexToHsv(currentPopoverHex());
  const step = e.shiftKey ? .1 : .02;
  if (e.key === 'ArrowLeft') hsv.s = Math.max(0, hsv.s - step);
  if (e.key === 'ArrowRight') hsv.s = Math.min(1, hsv.s + step);
  if (e.key === 'ArrowUp') hsv.v = Math.min(1, hsv.v + step);
  if (e.key === 'ArrowDown') hsv.v = Math.max(0, hsv.v - step);
  applyPopoverColor(hsvToHex(Number($('#cpop-hue-range')?.value ?? hsv.h), hsv.s, hsv.v));
});

document.addEventListener('input', e => {
  if (e.target.id === 'cpop-search') {
    const query = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.cpop-swatch,.cpop-gradient-swatch').forEach(swatch => {
      const haystack = `${swatch.title || ''} ${swatch.dataset.colorName || ''} ${swatch.dataset.setCol || ''} ${swatch.dataset.setFill || ''}`.toLowerCase();
      swatch.hidden = !!query && !haystack.includes(query);
    });
  } else if (e.target.id === 'cpop-hue-range') {
    const hsv = hexToHsv(currentPopoverHex());
    applyPopoverColor(hsvToHex(Number(e.target.value), hsv.s, hsv.v));
    const field = $('#cpop-sv-field');
    if (field) field.style.setProperty('--picker-hue', `hsl(${e.target.value} 100% 50%)`);
  } else if (e.target.id === 'cpop-custom-input' || e.target.id === 'cpop-custom-fill-input') {
    applyPopoverColor(e.target.value);
    const hexInput = $('#cpop-hex-input');
    if (hexInput) hexInput.value = e.target.value.toLowerCase();
    const previewSwatch = $('.cpop-current-swatch');
    if (previewSwatch) {
      previewSwatch.classList.remove('is-none');
      previewSwatch.style.background = e.target.value;
      previewSwatch.style.setProperty('--current-color', e.target.value);
    }
  } else if (e.target.id === 'cpop-hex-input') {
    const raw = e.target.value.trim();
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    const valid = /^#[\da-f]{6}$/i.test(normalized);
    e.target.classList.toggle('invalid', raw.length > 0 && !valid);
    if (valid) {
      const colorInput = curPopType === 'col' ? $('#cpop-custom-input') : $('#cpop-custom-fill-input');
      if (colorInput) colorInput.value = normalized;
      applyPopoverColor(normalized);
    }
  } else if (e.target.id === 'token-primary') {
    S.theme = S.theme || {};
    S.theme.primary = e.target.value;
    const c = $('#token-primary-val');
    if (c) c.textContent = e.target.value;
    refresh();
  } else if (e.target.id === 'token-bg') {
    S.theme = S.theme || {};
    S.theme.bg = e.target.value;
    const c = $('#token-bg-val');
    if (c) c.textContent = e.target.value;
    refresh();
  } else if (e.target.id === 'token-text') {
    S.theme = S.theme || {};
    S.theme.text = e.target.value;
    const c = $('#token-text-val');
    if (c) c.textContent = e.target.value;
    refresh();
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'cpop-hex-input') {
    const raw = e.target.value.trim();
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[\da-f]{6}$/i.test(normalized)) {
      e.target.value = normalized.toLowerCase();
      e.target.classList.remove('invalid');
      applyPopoverColor(normalized);
    }
  } else if (e.target.id.startsWith('token-')) {
    snap();
    render();
  }
});

// ==========================================
// SISTEM DIALOG TERBINA DALAM (BUILT-IN APP DIALOG)
// Menggantikan sebarang window.alert, window.confirm, window.prompt
// ==========================================
let appDialogResolve = null;

function showAppDialog({ type = 'alert', title = 'Notice', msg = '', icon = '💬', defaultValue = '', placeholder = '', isDanger = false, confirmText = 'OK', cancelText = 'Cancel', onResolve }) {
  const overlay = $('#app-dialog-overlay');
  if (!overlay) return;
  
  appDialogResolve = onResolve;

  $('#app-dialog-title').textContent = title;
  $('#app-dialog-ic').textContent = icon;
  $('#app-dialog-msg').innerHTML = String(msg || '').replace(/\n/g, '<br>');

  const inputWrap = $('#app-dialog-input-wrap');
  const inputEl = $('#app-dialog-input');
  const cancelBtn = $('#app-dialog-cancel');
  const confirmBtn = $('#app-dialog-confirm');

  confirmBtn.textContent = confirmText;
  confirmBtn.className = isDanger ? 'app-dialog-btn app-dialog-danger' : 'app-dialog-btn app-dialog-confirm';

  if (type === 'prompt') {
    inputWrap.hidden = false;
    inputEl.value = defaultValue;
    inputEl.placeholder = placeholder || '';
    cancelBtn.hidden = false;
    cancelBtn.textContent = cancelText;
  } else if (type === 'confirm') {
    inputWrap.hidden = true;
    cancelBtn.hidden = false;
    cancelBtn.textContent = cancelText;
  } else {
    inputWrap.hidden = true;
    cancelBtn.hidden = true;
  }

  overlay.hidden = false;
  
  setTimeout(() => {
    if (type === 'prompt') {
      inputEl.focus();
      inputEl.select();
    } else {
      confirmBtn.focus();
    }
  }, 40);
}

function closeAppDialog(result) {
  const overlay = $('#app-dialog-overlay');
  if (overlay) overlay.hidden = true;
  if (appDialogResolve) {
    const cb = appDialogResolve;
    appDialogResolve = null;
    cb(result);
  }
}

function appAlert(msg, title = 'Studio Notice', icon = '💡') {
  return new Promise(resolve => {
    showAppDialog({
      type: 'alert',
      title,
      msg,
      icon,
      confirmText: 'Faham',
      onResolve: () => resolve(true)
    });
  });
}

function appConfirm(msg, title = 'Confirmation', icon = '❓', isDanger = false, confirmText = 'Yes, Continue') {
  return new Promise(resolve => {
    showAppDialog({
      type: 'confirm',
      title,
      msg,
      icon,
      isDanger,
      confirmText,
      cancelText: 'Cancel',
      onResolve: val => resolve(val)
    });
  });
}

function appPrompt(msg, defaultValue = '', title = 'Enter Information', icon = '✏️', placeholder = '') {
  return new Promise(resolve => {
    showAppDialog({
      type: 'prompt',
      title,
      msg,
      icon,
      defaultValue,
      placeholder,
      confirmText: 'Save',
      cancelText: 'Batal',
      onResolve: val => resolve(val)
    });
  });
}

// Override sebarang panggilan dialog browser secara global
window.alert = (msg) => { appAlert(msg); };
window.confirm = (msg) => { console.warn('Use appConfirm() for async dialogs.'); return false; };
window.prompt = (msg, def) => { console.warn('Use appPrompt() for async dialogs.'); return null; };

// Dialog overlay listeners
document.addEventListener('click', e => {
  if (e.target.id === 'app-dialog-confirm') {
    const inputWrap = $('#app-dialog-input-wrap');
    if (inputWrap && !inputWrap.hidden) {
      closeAppDialog($('#app-dialog-input').value);
    } else {
      closeAppDialog(true);
    }
  } else if (e.target.id === 'app-dialog-cancel' || e.target.id === 'app-dialog-close') {
    closeAppDialog(null);
  } else if (e.target.id === 'app-dialog-overlay') {
    closeAppDialog(null);
  }
});

document.addEventListener('keydown', e => {
  const overlay = $('#app-dialog-overlay');
  if (overlay && !overlay.hidden) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputWrap = $('#app-dialog-input-wrap');
      if (inputWrap && !inputWrap.hidden) {
        closeAppDialog($('#app-dialog-input').value);
      } else {
        closeAppDialog(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAppDialog(null);
    }
  }
});


// Pengendali Editor Kod Langsung (Live Code Editor)
const codeTextarea = $('#code-textarea');
const codeGutter = $('#code-gutter');

if (codeTextarea) {
  codeTextarea.addEventListener('input', () => {
    onEditorInput(true);
  });

  codeTextarea.addEventListener('scroll', () => {
    if (codeGutter) codeGutter.scrollTop = codeTextarea.scrollTop;
  });

  codeTextarea.addEventListener('keydown', e => {
    // Sokongan Tab & Shift+Tab untuk indentasi
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      const val = codeTextarea.value;

      if (e.shiftKey) {
        // Outdent (buang 2 ruang)
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        if (val.substring(lineStart, lineStart + 2) === '  ') {
          codeTextarea.value = val.substring(0, lineStart) + val.substring(lineStart + 2);
          codeTextarea.selectionStart = Math.max(lineStart, start - 2);
          codeTextarea.selectionEnd = Math.max(lineStart, end - 2);
          onEditorInput(true);
        }
      } else {
        // Indent (tambah 2 ruang)
        codeTextarea.value = val.substring(0, start) + '  ' + val.substring(end);
        codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 2;
        onEditorInput(true);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      applyCodeChanges(true);
    }
  });
}

// Dwi-klik pada baris kod dalam mod Papar untuk terus sunting baris tersebut
document.addEventListener('dblclick', e => {
  const ln = e.target.closest('.ln');
  if (ln && S.codeMode === 'view') {
    const lineNoEl = ln.querySelector('.no');
    const targetLine = lineNoEl ? parseInt(lineNoEl.textContent, 10) : 1;
    setCodeMode('edit', targetLine);
  }
});



// ============================================================================
// DREAMWEAVER SUITE: SPLIT RESIZER & DOM TAG SELECTOR
// ============================================================================

function renderBreadcrumbs() {
  const container = document.getElementById('dw-breadcrumbs');
  if (!container) return;

  const htmlTag = S.htmlMode === 'div' ? 'div' : 'main';
  const selBlock = S.blocks.find(b => b.id === S.sel);

  let html = `<button type="button" class="dw-breadcrumb-tag${!selBlock ? ' active' : ''}" data-dw-pick="body" title="Select <body> root container">&lt;body&gt;</button>`;
  html += `<span class="dw-breadcrumb-sep">&gt;</span>`;
  html += `<button type="button" class="dw-breadcrumb-tag${!selBlock ? ' active' : ''}" data-dw-pick="main" title="Select <${htmlTag}> layout container">&lt;${htmlTag}.grid&gt;</button>`;

  if (selBlock) {
    const meta = TY[selBlock.type] || { n: selBlock.type, tag: 'div' };
    const tagName = S.htmlMode === 'div' ? 'div' : (meta.tag || 'div');
    const className = `.${selBlock.type}`;
    html += `<span class="dw-breadcrumb-sep">&gt;</span>`;
    html += `<button type="button" class="dw-breadcrumb-tag active" data-dw-pick="${selBlock.id}" title="Select <${tagName}${className}> (${meta.n})">&lt;${tagName}${className}&gt;</button>`;

    if (selBlock.type === 'nav' || selBlock.type === 'dropdown') {
      const subTitle = S.selNavTitle || (selBlock.t ? selBlock.t.split(/[,\s|]+/)[0] : '');
      if (subTitle) {
        html += `<span class="dw-breadcrumb-sep">&gt;</span>`;
        html += `<span class="dw-breadcrumb-tag sub-tag">&lt;a.${subTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}&gt;</span>`;
      }
    }
  }

  container.innerHTML = html;
}

function initSplitResizer() {
  const gutter = document.getElementById('split-gutter');
  const stage = document.getElementById('stage');
  const vis = document.querySelector('.vis');
  if (!gutter || !stage || !vis) return;
  if (gutter.dataset.resizerBound) return;
  gutter.dataset.resizerBound = 'true';

  // Restore saved ratio
  const savedRatio = parseFloat(localStorage.getItem('dw_split_ratio') || '50');
  if (savedRatio >= 20 && savedRatio <= 80) {
    stage.style.setProperty('--split-left', `${savedRatio}%`);
  } else {
    stage.style.setProperty('--split-left', '50%');
  }

  let isDragging = false;
  let startX = 0;
  let startLeftWidth = 0;
  let stageWidth = 0;

  gutter.addEventListener('pointerdown', e => {
    if (!stage.classList.contains('s')) return;
    isDragging = true;
    gutter.classList.add('is-dragging');
    document.body.classList.add('is-resizing');
    try { gutter.setPointerCapture(e.pointerId); } catch (_) {}

    const stageRect = stage.getBoundingClientRect();
    const visRect = vis.getBoundingClientRect();
    startX = e.clientX;
    startLeftWidth = visRect.width;
    stageWidth = stageRect.width;
    e.preventDefault();
  });

  gutter.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const newLeftWidth = startLeftWidth + dx;
    const minLeft = 260;
    const maxLeft = stageWidth - 280;
    const clamped = Math.max(minLeft, Math.min(maxLeft, newLeftWidth));
    const pct = ((clamped / stageWidth) * 100).toFixed(2);

    stage.style.setProperty('--split-left', `${pct}%`);
    localStorage.setItem('dw_split_ratio', pct);
  });

  const stopDrag = e => {
    if (!isDragging) return;
    isDragging = false;
    gutter.classList.remove('is-dragging');
    document.body.classList.remove('is-resizing');
    try { gutter.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  gutter.addEventListener('pointerup', stopDrag);
  gutter.addEventListener('pointercancel', stopDrag);

  gutter.addEventListener('dblclick', () => {
    stage.style.setProperty('--split-left', '50%');
    localStorage.setItem('dw_split_ratio', '50');
    toast('Split view reset to 50:50 balance');
  });
}

// Cursor and Line tracker
document.addEventListener('click', e => {
  const ln = e.target.closest('.ln');
  if (ln) {
    const no = ln.querySelector('.no');
    if (no) {
      const stat = document.getElementById('dw-cursor-stat');
      if (stat) stat.textContent = `Ln ${no.textContent.trim()}, Col 1`;
    }
  }
});

// Initialize Dreamweaver Resizer
initSplitResizer();
