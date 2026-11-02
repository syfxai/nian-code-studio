/**
 * BLUEPRINT CODE STUDIO - Main Application & Coordinator (app.js)
 * Manages application lifecycle, render and refresh coordination,
 * code tabs, visual sitemap flowchart, AI Tutor audit, keyboard shortcuts, and app initialization.
 */


/**
 * =====================================================================
 * SYNTAX VALIDATION & TWO-WAY CODE EDITOR (LIVE CODE EDITOR)
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
  if (Object.prototype.hasOwnProperty.call(edits, 'css')) {
    source = source.replace(/<link\b([^>]*\bhref=(["'])(?:[^"']*\/)?style\.css(?:[?#][^"']*)?\2[^>]*)>/gi, (m, attrs) =>
      `<link${attrs.replace(/\bhref=(["'])([^"']+)\1/i, 'data-studio-href="$2"')}>`
    );
    source = injectPreviewPart(source, 'style', edits.css);
  }
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
  clone.querySelectorAll('link[data-studio-href]').forEach(link => {
    link.setAttribute('href', link.getAttribute('data-studio-href'));
    link.removeAttribute('data-studio-href');
  });
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
 * Validates HTML code syntax in real-time.
 * Checks for unclosed tags, stray tags, and open comments.
 * @param {string} code HTML code
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateHtmlSyntax(code) {
  if (!code || !code.trim()) return { valid: true };
  // Browser HTML engines automatically repair tag ordering (e.g., unclosed <li>).
  // Do not block valid web markup with overly restrictive tag validators.
  // DOMParser is used so preview aligns with native browser parsing.
  try {
    const doc = new DOMParser().parseFromString(code, 'text/html');
    const parserErr = doc.querySelector('parsererror');
    if (parserErr) return { valid: false, line: 1, msg: 'Browser failed to parse this HTML document.' };
    return { valid: true };
  } catch (error) {
    return { valid: false, line: 1, msg: 'HTML document could not be parsed by browser.' };
  }
}

/**
 * Validates CSS code syntax.
 * Checks brace balancing '{' and '}' and unclosed comment blocks.
 * @param {string} code CSS code
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
      msg: `CSS comment opened with '/*' on line ${lastCommentLine} was not closed with '*/'.`
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
            msg: `Unexpected closing '}' on line ${i + 1} without matching opening '{'.`
          };
        }
      }
    }
  }

  if (braceCount > 0) {
    return {
      valid: false,
      line: lastOpenLine,
      msg: `CSS selector block opened with '{' on line ${lastOpenLine} was not closed with '}'.`
    };
  }

  return { valid: true };
}

/**
 * Validates JavaScript code syntax.
 * Uses Function constructor to detect syntax errors.
 * @param {string} code JavaScript code
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
    const msg = err.message || 'JavaScript syntax error.';
    const openParen = (code.match(/\(/g) || []).length;
    const closeParen = (code.match(/\)/g) || []).length;
    if (openParen !== closeParen) {
      lines.forEach((l, idx) => { if (l.includes('(')) line = idx + 1; });
    }
    return {
      valid: false,
      line,
      msg: `JavaScript Error: ${msg}`
    };
  }
}

/**
 * Validates code according to current active tab.
 * @param {string} code Source code
 * @param {'html'|'css'|'js'} tab Tab type
 * @returns {{ valid: boolean, line?: number, msg?: string }}
 */
function validateSyntax(code, tab) {
  if (tab === 'html') return validateHtmlSyntax(code);
  if (tab === 'css') return validateCssSyntax(code);
  if (tab === 'js') return validateJsSyntax(code);
  return { valid: true };
}

/**
 * Updates line numbers in code editor gutter.
 * @param {number} lineCount Line count
 * @param {number|null} errLine Line number with error
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
 * Parses edited HTML code and maps it back to canvas blocks.
 * @param {string} htmlCode Full HTML source code
 * @returns {Array<object>|null} New blocks list or null on failure
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
      const studioClass = classes.find(name => /^(?:nav|header|hero|section|card(?:-\d+)?|footer|aside|button|logo|image|text|form|box)(?:-\d+)?$/.test(name));
      let type = 'box';
      if (tag === 'header' || classes.includes('header')) type = 'header';
      else if (tag === 'nav' || classes.includes('nav')) type = 'nav';
      else if (tag === 'footer' || classes.includes('footer')) type = 'footer';
      else if (tag === 'form' || classes.includes('form')) type = 'form';
      else if (tag === 'article' || classes.some(name => /^card(?:-\d+)?$/.test(name))) type = 'card';
      else if (tag === 'figure' || classes.includes('image')) type = 'image';
      else if (tag === 'section' || classes.includes('section')) type = classes.includes('hero') ? 'hero' : 'section';
      else if (tag === 'aside' || classes.includes('aside')) type = 'aside';
      else if (tag === 'details') type = 'dropdown';
      else if (tag === 'a' || classes.includes('btn-cta') || classes.includes('button')) type = 'button';

      let textValue = '';
      let dropdowns = null;
      let fields = null;
      let submitText = null;
      if (type === 'nav') {
        const links = Array.from(el.querySelectorAll(':scope > a, :scope > .nav-dropdown > .nav-drop-btn'));
        const titles = links.map(link => (link.textContent || '').replace(/\s*▾\s*$/, '').trim()).filter(Boolean);
        textValue = titles.join(', ');
        dropdowns = {};
        links.forEach(link => {
          const menu = link.parentElement && link.parentElement.querySelector('.dropdown-content');
          if (menu) dropdowns[link.textContent.replace(/\s*▾\s*$/, '').trim()] = Array.from(menu.querySelectorAll('a')).map(a => a.textContent.trim()).filter(Boolean);
        });
      } else if (type === 'form') {
        const labels = Array.from(el.querySelectorAll('label')).map(l => (l.textContent || '').trim()).filter(Boolean);
        fields = labels.length ? labels : ['Nama Penuh', 'Alamat Emel', 'Mesej Anda'];
        textValue = fields.join(', ');
        const subBtn = el.querySelector('button[type="submit"], button, input[type="submit"]');
        submitText = subBtn ? (subBtn.textContent || subBtn.value || '').trim() : 'Hantar Mesej';
      } else {
        const content = el.querySelector('h1, h2, h3, h4, h5, h6, p');
        textValue = content ? content.innerHTML.trim() : (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240);
      }

      const existing = (studioClass && S.blocks.find(block => block.cls === studioClass)) || S.blocks[idx];
      let imported;
      if (existing) imported = { ...existing, type, cls: studioClass || existing.cls, t: textValue || existing.t };
      else {
        let w = type === 'button' ? 3 : 12;
        let h = ['card', 'section'].includes(type) ? 3 : ['hero', 'form'].includes(type) ? 4 : 2;
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
      if (fields && fields.length) imported.fields = fields;
      if (submitText) imported.submitText = submitText;
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

function splitCssDeclarations(declText) {
  const results = [];
  if (!declText || !declText.trim()) return results;
  let current = '';
  let parenDepth = 0;
  let quote = '';
  for (let i = 0; i < declText.length; i++) {
    const ch = declText[i];
    if (quote) {
      current += ch;
      if (ch === quote && declText[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') parenDepth++;
    else if (ch === ')' && parenDepth > 0) parenDepth--;
    if (ch === ';' && parenDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) results.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results.map(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx < 1) return null;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    let valRaw = part.slice(colonIdx + 1).trim();
    const important = /!\s*important\s*$/i.test(valRaw);
    if (important) valRaw = valRaw.replace(/!\s*important\s*$/i, '').trim();
    if (!prop || !valRaw) return null;
    return {
      prop,
      value: valRaw,
      important,
      formatted: `${prop}: ${valRaw}${important ? ' !important' : ''};`
    };
  }).filter(Boolean);
}

function canonicalCssKey(declText) {
  return splitCssDeclarations(declText).map(d => d.formatted).join(' ');
}

function formatCssRuleBlock(selector, declText, indent = '') {
  const decls = splitCssDeclarations(declText);
  if (!decls.length) return '';
  const bodyLines = decls.map(d => `${indent}  ${d.formatted}`).join('\n');
  return `${indent}${selector.trim()} {\n${bodyLines}\n${indent}}`;
}

function formatCssStylesheet(cssText, indent = '') {
  if (!cssText || !cssText.trim()) return '';
  const blocks = [];
  const clean = cssText.trim();
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  let matchedAny = false;
  while ((match = ruleRegex.exec(clean)) !== null) {
    matchedAny = true;
    const rawSel = match[1].trim();
    const rawBody = match[2].trim();
    if (!rawSel || !rawBody) continue;
    const commentMatch = rawSel.match(/^((?:\/\*[\s\S]*?\*\/\s*)+)([\s\S]*)$/);
    if (commentMatch) {
      const comments = commentMatch[1].trim().split(/\r?\n/).map(l => `${indent}${l.trim()}`).join('\n');
      const selOnly = commentMatch[2].trim();
      const ruleFormatted = formatCssRuleBlock(selOnly, rawBody, indent);
      if (ruleFormatted) blocks.push(`${comments}\n${ruleFormatted}`);
    } else {
      const ruleFormatted = formatCssRuleBlock(rawSel, rawBody, indent);
      if (ruleFormatted) blocks.push(ruleFormatted);
    }
  }
  return matchedAny && blocks.length ? blocks.join('\n\n') : clean;
}

function stripLegacyInlineClasses(doc) {
  doc.querySelectorAll('[class]').forEach(el => {
    const legacy = Array.from(el.classList).filter(c => /^bcs-inline-\d+$/i.test(c));
    legacy.forEach(c => el.classList.remove(c));
    if (!el.classList.length && el.getAttribute('class') !== null) {
      el.removeAttribute('class');
    }
  });
}

function previousElementComment(element) {
  let node = element.previousSibling;
  while (node && node.nodeType === 3 && !node.textContent.trim()) {
    node = node.previousSibling;
  }
  return node && node.nodeType === 8 ? node.textContent.toLowerCase() : '';
}

function isCardLikeElement(element) {
  if (!element || !element.querySelector) return false;
  const tag = element.tagName.toLowerCase();
  if (!['div', 'article', 'section', 'li'].includes(tag)) return false;
  const comment = previousElementComment(element);
  if (/\bkad\b|\bcard\b/.test(comment) && !/bahagian|kumpulan|container|section/.test(comment)) return true;
  return !!(element.querySelector(':scope > img') && element.querySelector('h2, h3, h4, h5, h6') && element.querySelector('p'));
}

function inferSemanticBaseClass(element) {
  const tag = element.tagName.toLowerCase();
  const comment = previousElementComment(element);
  const parent = element.parentElement;
  const parentTag = parent ? parent.tagName.toLowerCase() : '';
  const parentClasses = parent ? Array.from(parent.classList) : [];
  const parentComment = parent ? previousElementComment(parent) : '';

  if (tag === 'nav' || /menu atas|navbar|navigasi|\bmenu\b/.test(comment)) return 'navbar';
  if (/hero|sepanduk utama/.test(comment)) return 'hero';
  if (/bahagian.*kad|cards|senarai kad/.test(comment)) return 'cards-section';
  if (isCardLikeElement(element)) return 'card';
  if (tag === 'div' && Array.from(element.children).filter(isCardLikeElement).length >= 2) return 'cards-section';

  const inNavbar = parentTag === 'nav' || parentClasses.includes('navbar') || /menu atas|navbar|navigasi/.test(parentComment);
  if (inNavbar && tag === 'a') return 'nav-link';

  const inHero = parentClasses.includes('hero') || /hero/.test(parentComment);
  if (inHero) {
    if (/^h[1-6]$/.test(tag)) return 'hero-title';
    if (tag === 'p') return 'hero-text';
    if (tag === 'a' || tag === 'button') return 'hero-btn';
  }

  const cardAncestor = element.closest && element.closest('.card, article');
  const inCard = !!cardAncestor || (parent && isCardLikeElement(parent)) || (parent && parent.parentElement && isCardLikeElement(parent.parentElement));
  if (inCard) {
    if (tag === 'img') return 'card-img';
    if (tag === 'div') return 'card-body';
    if (/^h[1-6]$/.test(tag)) return 'card-title';
    if (tag === 'p') return 'card-text';
    if (tag === 'a' || tag === 'button') return 'card-btn';
  }

  const inFooter = parentTag === 'footer' || parentClasses.includes('footer') || Boolean(element.closest && element.closest('footer'));
  if (inFooter && tag === 'p') return 'footer-text';
  if (inFooter && tag === 'a') return 'footer-link';

  const fallbackMap = {
    header: 'site-header',
    nav: 'navbar',
    main: 'main-content',
    section: 'section-box',
    article: 'card',
    aside: 'sidebar',
    footer: 'site-footer',
    div: 'container-box',
    h1: 'title-main',
    h2: 'title-section',
    h3: 'title-sub',
    p: 'text-block',
    a: 'link-btn',
    button: 'btn',
    img: 'image-item',
    form: 'form-box',
    input: 'form-input',
    textarea: 'form-textarea'
  };
  return fallbackMap[tag] || `el-${tag}`;
}

function sourceInlineStylesToRules(doc) {
  stripLegacyInlineClasses(doc);
  const rules = [];
  const styleGroupMap = new Map();
  const baseNameCounts = new Map();
  const uniqueTags = new Set(['body', 'main', 'header', 'nav', 'footer']);

  doc.querySelectorAll('[style]').forEach(element => {
    const declarations = element.getAttribute('style');
    const canonical = canonicalCssKey(declarations);
    if (!canonical) {
      element.removeAttribute('style');
      return;
    }

    const tag = element.tagName.toLowerCase();
    const existingClasses = Array.from(element.classList).filter(c => !/^bcs-inline-\d+$/i.test(c));

    // 1. Unique root/landmark tags (body, header, nav, main, footer) with no id or class
    if (uniqueTags.has(tag) && !element.id && existingClasses.length === 0 && doc.getElementsByTagName(tag).length === 1) {
      rules.push(formatCssRuleBlock(tag, canonical));
      element.removeAttribute('style');
      return;
    }

    // 2. Unique #id selector
    if (element.id && doc.querySelectorAll(`#${CSS.escape(element.id)}`).length === 1) {
      rules.push(formatCssRuleBlock(`#${CSS.escape(element.id)}`, canonical));
      element.removeAttribute('style');
      return;
    }

    // 3. Deduplicate elements that share the exact same semantic role + inline style declarations
    const baseRole = existingClasses[0] || inferSemanticBaseClass(element);
    const groupKey = `${tag}::${baseRole}::${canonical}`;
    if (styleGroupMap.has(groupKey)) {
      const reusedClass = styleGroupMap.get(groupKey);
      if (!element.classList.contains(reusedClass)) element.classList.add(reusedClass);
      element.removeAttribute('style');
      return;
    }

    // 4. Reuse existing clean class if all elements with that class share this style
    let chosenClass = '';
    if (existingClasses.length === 1) {
      const candidate = existingClasses[0];
      const peers = Array.from(doc.getElementsByClassName(candidate));
      const allSameStyle = peers.every(peer => canonicalCssKey(peer.getAttribute('style') || '') === canonical);
      if (allSameStyle && ! Array.from(styleGroupMap.values()).includes(candidate)) {
        chosenClass = candidate;
      }
    }

    if (!chosenClass) {
      const count = (baseNameCounts.get(baseRole) || 0) + 1;
      baseNameCounts.set(baseRole, count);
      // Check if another element with the same baseRole has a DIFFERENT style
      const sameRoleElements = Array.from(doc.querySelectorAll('[style]')).filter(el => {
        const cls = Array.from(el.classList).filter(c => !/^bcs-inline-\d+$/i.test(c))[0];
        return (cls || inferSemanticBaseClass(el)) === baseRole;
      });
      const distinctStylesForRole = new Set(sameRoleElements.map(el => canonicalCssKey(el.getAttribute('style') || ''))).size;

      let candidate = (count === 1 && distinctStylesForRole <= 1) ? baseRole : `${baseRole}-${count}`;
      let suffix = count;
      while (doc.getElementsByClassName(candidate).length > 0 && !element.classList.contains(candidate)) {
        suffix++;
        candidate = `${baseRole}-${suffix}`;
      }
      chosenClass = candidate;
    }

    if (!element.classList.contains(chosenClass)) element.classList.add(chosenClass);
    styleGroupMap.set(groupKey, chosenClass);
    rules.push(formatCssRuleBlock(`.${chosenClass}`, canonical));
    element.removeAttribute('style');
  });

  return rules.filter(Boolean);
}

function sourceHead(doc) {
  if (!doc.head) {
    const head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.body || null);
  }
  return doc.head;
}

function formatSourceHead(doc) {
  const head = sourceHead(doc);
  const children = Array.from(head.children);
  if (!children.length) return;
  while (head.firstChild) head.removeChild(head.firstChild);
  head.appendChild(doc.createTextNode('\n'));
  children.forEach(child => {
    head.appendChild(doc.createTextNode('    '));
    if (child.tagName === 'STYLE' && child.textContent) {
      const formattedCss = formatCssStylesheet(child.textContent, '      ');
      child.textContent = `\n${formattedCss}\n    `;
    }
    head.appendChild(child);
    head.appendChild(doc.createTextNode('\n'));
  });
}

function sourceHasStudioStylesheet(doc) {
  return Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]')).some(link => /(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href')));
}

function detectSourceCssMode(htmlCode) {
  if (!htmlCode || !htmlCode.trim()) return null;
  try {
    const doc = new DOMParser().parseFromString(htmlCode, 'text/html');
    if (sourceHasStudioStylesheet(doc)) return 'ext';
    const hasInternal = Array.from(doc.querySelectorAll('style:not([data-studio-ui])')).some(s => (s.textContent || '').trim().length > 0);
    const hasInline = doc.querySelectorAll('[style]').length > 0;
    if (hasInternal && !hasInline) return 'int';
    if (hasInline && !hasInternal) return 'inl';
    if (hasInternal) return 'int';
  } catch (_) {}
  return null;
}

function sourceCssSpecificity(selector) {
  const withoutStrings = selector.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '');
  const ids = (withoutStrings.match(/#[\w-]+/g) || []).length;
  const classes = (withoutStrings.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
  const tags = (withoutStrings.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:{1,2}[\w-]+(?:\([^)]*\))?/g, ' ').match(/(?:^|[\s>+~])(?:[a-z][\w-]*|\*)/gi) || []).filter(tag => tag.trim() !== '*').length;
  return ids * 10000 + classes * 100 + tags;
}

function applySourceCssInline(doc, cssText) {
  stripLegacyInlineClasses(doc);
  if (!cssText.trim()) return '';
  const parser = doc.createElement('style');
  parser.textContent = cssText;
  sourceHead(doc).appendChild(parser);
  const candidates = [];
  const leftovers = [];
  const inlinedClassSelectors = new Set();
  let order = 0;
  const collect = rules => Array.from(rules || []).forEach(rule => {
    if (rule.type === 1 && rule.selectorText) {
      const selector = rule.selectorText;
      if (/:(?:hover|focus|focus-visible|active|visited|checked|disabled|enabled|target|root)\b|::/i.test(selector)) { leftovers.push(rule.cssText); return; }
      let matches = [];
      try { matches = Array.from(doc.querySelectorAll(selector)); } catch (_) { leftovers.push(rule.cssText); return; }
      const specificity = Math.max(...selector.split(',').map(sourceCssSpecificity));
      // Parse raw declaration text so shorthands (padding, margin, border, flex) are preserved without CSSOM longhand expansion
      const rawBodyMatch = (rule.cssText || '').match(/\{([\s\S]*)\}/);
      const decls = rawBodyMatch ? splitCssDeclarations(rawBodyMatch[1]) : [];
      if (/^\.[\w-]+$/.test(selector.trim())) {
        inlinedClassSelectors.add(selector.trim().slice(1));
      }
      matches.forEach(element => {
        if (decls.length) {
          decls.forEach(d => {
            candidates.push({ element, property: d.prop, value: d.value, important: d.important, specificity, order: order++ });
          });
        } else {
          for (let i = 0; i < rule.style.length; i++) {
            const property = rule.style[i];
            candidates.push({ element, property, value: rule.style.getPropertyValue(property), important: rule.style.getPropertyPriority(property) === 'important', specificity, order: order++ });
          }
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

  // Build clean inline style maps per element preserving shorthand properties
  const elementDeclMaps = new Map();
  doc.querySelectorAll('[style]').forEach(el => {
    const map = new Map();
    splitCssDeclarations(el.getAttribute('style') || '').forEach(d => {
      map.set(d.prop, { value: d.value, important: d.important, fromInline: true });
    });
    elementDeclMaps.set(el, map);
  });

  candidates.forEach(({ element, property, value, important }) => {
    let map = elementDeclMaps.get(element);
    if (!map) {
      map = new Map();
      elementDeclMaps.set(element, map);
    }
    const existing = map.get(property);
    if (existing && existing.fromInline && (existing.important || !important)) return;
    map.set(property, { value, important, fromInline: false });
  });

  elementDeclMaps.forEach((map, element) => {
    const styleStr = Array.from(map.entries())
      .map(([prop, info]) => `${prop}: ${info.value}${info.important ? ' !important' : ''};`)
      .join(' ');
    if (styleStr) element.setAttribute('style', styleStr);
  });

  const remaining = leftovers.filter(Boolean).join('\n');
  if (!remaining.trim()) {
    inlinedClassSelectors.forEach(cls => {
      doc.querySelectorAll(`.${CSS.escape(cls)}`).forEach(el => {
        el.classList.remove(cls);
        if (!el.classList.length) el.removeAttribute('class');
      });
    });
  }
  return remaining;
}

function convertSourceCssMode(mode) {
  if (autoApplyTimer) {
    clearTimeout(autoApplyTimer);
    autoApplyTimer = null;
    if (S.codeMode === 'edit') {
      const textarea = $('#code-textarea');
      if (textarea && textarea.value.trim()) {
        pageCodeEdits()[S.tab] = textarea.value;
      }
    }
  }
  if (!hasCodeHtmlOverride() || !['int', 'ext', 'inl', 'all'].includes(mode)) return false;
  const edits = pageCodeEdits();
  const doc = new DOMParser().parseFromString(edits.html, 'text/html');
  const hasExternalLink = sourceHasStudioStylesheet(doc);
  const inlineRules = mode === 'inl' ? [] : sourceInlineStylesToRules(doc);
  const internalParts = Array.from(doc.querySelectorAll('style:not([data-studio-ui])')).map(style => style.textContent || '').filter(text => text.trim());
  doc.querySelectorAll('style:not([data-studio-ui])').forEach(style => style.remove());
  // Only include edits.css if the document actually links style.css or has no inline/internal styles of its own
  const editorCss = (Object.prototype.hasOwnProperty.call(edits, 'css') && (hasExternalLink || (!internalParts.length && !inlineRules.length)))
    ? String(edits.css || '')
    : '';
  const rawCollectedCss = [editorCss, ...internalParts, ...inlineRules].filter(text => text.trim()).join('\n\n');
  const collectedCss = formatCssStylesheet(rawCollectedCss);
  const head = sourceHead(doc);

  if (mode === 'int') {
    doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(link => {
      if (/(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href'))) link.remove();
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
    }
    delete edits.css;
    doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(link => {
      if (/(?:^|\/)style\.css(?:[?#]|$)/i.test(link.getAttribute('href'))) link.remove();
    });
  }

  formatSourceHead(doc);
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
 * Input handler while user types in code editor textarea.
 */
function onEditorInput(fromUser = false) {
  const textarea = $('#code-textarea');
  if (!textarea) return;

  const code = textarea.value;
  if (fromUser) {
    const edits = pageCodeEdits();
    edits[S.tab] = code;
    if (S.tab === 'html') {
      const detectedMode = detectSourceCssMode(code);
      if (detectedMode) {
        S.sty = detectedMode;
        if (detectedMode !== 'ext') delete edits.css;
      }
    }
    save();
  }
  const lines = code.split('\n');
  const res = validateSyntax(code, S.tab);

  const banner = $('#code-error-banner');
  const bannerMsg = $('#code-error-msg');
  if (!res.valid) {
    // Brief error notification auto-fades so editor area stays clean.
    if (banner) banner.hidden = true;
    if (bannerMsg) bannerMsg.textContent = res.msg || 'Syntax error detected.';
    showCodeStatus(`Check syntax · line ${res.line}`, 'error', 3000);
    updateGutter(lines.length, res.line);
    S.lastErrorCode = res;

    // Cancel pending auto-apply if error detected
    if (autoApplyTimer) {
      clearTimeout(autoApplyTimer);
      autoApplyTimer = null;
    }
  } else {
    // Hide error banner
    if (banner) banner.hidden = true;
    showCodeStatus('Saving…', 'editing', 1000);
    updateGutter(lines.length, null);
    S.lastErrorCode = null;

    // Debounce auto-apply to canvas after 750ms
    if (autoApplyTimer) clearTimeout(autoApplyTimer);
    autoApplyTimer = setTimeout(() => {
      applyCodeChanges(false);
    }, 750);
  }
}

/**
 * Jumps to line containing syntax error in textarea.
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

  // Scroll textarea and gutter so line is visible
  const lineHeight = 20.625;
  const targetScroll = Math.max(0, (lineNum - 3) * lineHeight);
  textarea.scrollTop = targetScroll;
  const gutter = $('#code-gutter');
  if (gutter) gutter.scrollTop = targetScroll;

  toast(`Jump to line ${lineNum}: ${S.lastErrorCode.msg || 'Please check syntax'}`);
}

/**
 * Applies edited code changes into studio canvas state.
 * @param {boolean} showToast Whether to display toast notification
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
    const parsed = studioExport ? parseHtmlToBlocks(code) : null;
    if (studioExport && parsed && parsed.length) {
      snap();
      S.blocks = parsed;
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = parsed;
      delete pageCodeEdits()[S.tab];
    } else {
      const detectedMode = detectSourceCssMode(code);
      if (detectedMode) {
        S.sty = detectedMode;
        if (detectedMode !== 'ext') delete pageCodeEdits().css;
      }
    }
    document.querySelectorAll('[data-sty]').forEach(x => x.setAttribute('aria-pressed', x.dataset.sty === S.sty));
    renderCanvas();
    renderTabsBar();
    renderPreview();
    renderIns();
    renderCanvaBar();
    if (studioExport) toast('Studio export recognized: grid canvas and visual controls are active.');
  } else if (S.tab === 'css') {
    S.customCss = code;
    renderCanvas();
    renderPreview();
  } else if (S.tab === 'js') {
    S.customJs = code;
    renderCanvas();
    renderPreview();
  }

  showCodeStatus(S.lang === 'en' ? 'Saved' : 'Disimpan', 'success');

  if (showToast) {
    const tabName = S.tab === 'html' ? 'HTML' : S.tab === 'css' ? 'CSS' : 'JavaScript';
    toast(S.lang === 'en' ? `⚡ ${tabName} changes successfully updated to Canvas!` : `⚡ Perubahan ${tabName} berjaya dikemas kini ke Kanvas!`);
  }
  save();
}

/**
 * Restores code in editor to studio canvas generated code.
 */
function revertCodeChanges() {
  const textarea = $('#code-textarea');
  if (!textarea) return;

  delete pageCodeEdits()[S.tab];
  textarea.value = generatedCodeText(S.tab);
  S.lastErrorCode = null;
  render();

  showCodeStatus(S.lang === 'en' ? 'Code restored' : 'Kod dipulihkan', 'success');
  toast('↺ Code restored from canvas design.');
}

/**
 * Toggles mode between View (Syntax Highlighted) and Edit (Editable Textarea).
 * @param {'view'|'edit'} mode Editor mode
 * @param {number|null} targetLine Target line to jump to if any
 */
function setCodeMode(mode, targetLine = null) {
  S.codeMode = mode;

  // Update mode toggle buttons
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

    // Load current code into textarea if not already present.
    // When code is currently displayed, use the exact text from the view.
    // This prevents an empty editor if the saved edit state was out of sync.
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

  // If in edit mode, sync textarea content and gutter line numbers
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
  }).join('') + '<button class="btn-new-page" id="btn-add-page" title="Add New Page (Create new HTML file)">+</button>';
}

/**
 * Updates Live Preview iframe securely and responsively.
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
      console.warn('Failed to set srcdoc directly, falling back to blob:', err);
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
  renderBreadcrumbs();
  if (S.view === 'nodes') renderNodes();
  if (S.view === 'prev') renderPreview();
  save();
}

function render() {
  // 1. Control main container visibility (Canvas vs Nodes vs Live Preview)
  $('#cv').hidden = S.view !== 'plan';
  $('#nodes-wrap').hidden = S.view !== 'nodes';
  $('#paper').hidden = S.view !== 'prev';

  // 2. Visual / Split / Code display mode & responsive viewport
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
    runPreviewJsButton.textContent = S.previewScripts ? 'JS Running' : 'Run JS';
    runPreviewJsButton.title = S.previewScripts ? 'Disable preview JavaScript' : 'Run JavaScript inside isolated preview';
  }

  // 3. Update visual components
  refresh();
  renderIns();
  renderLayersPanel();
  renderCanvaBar();
  if (S.view === 'prev') renderPreview();

  // Toggle Left Panel: HTML vs CSS Studio
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

  // Sync responsive CSS media query switch (@media)
  const respBtn = $('#btn-toggle-resp-css');
  if (respBtn) {
    respBtn.setAttribute('aria-pressed', !!S.responsiveCSS);
    const txt = respBtn.querySelector('.toggle-pill-text');
    if (txt) txt.textContent = S.responsiveCSS ? 'ON' : 'OFF';
  }

  // Sync HTML tag mode buttons (HTML5 Semantic vs Standard div)
  const isDivMode = S.htmlMode === 'div';
  document.querySelectorAll('[data-html-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.htmlMode === (S.htmlMode || 'semantic'));
  });
  const subLbl = $('#side-html-mode-sub');
  if (subLbl) subLbl.textContent = isDivMode ? 'Standard <div>' : 'HTML5 Semantic';

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
  const isEn = S.lang === 'en';
  if (cssTabBtn) {
    cssTabBtn.disabled = false;
    cssTabBtn.removeAttribute('aria-disabled');
    cssTabBtn.title = isEn ? 'Open style.css; CSS code can be customized anytime' : 'Buka style.css; kod CSS boleh ditambah bila-bila masa';
  }

  $('#layer-css').setAttribute('aria-pressed', S.hasCss);
  $('#layer-css').textContent = S.hasCss ? 'CSS' : (isEn ? 'No CSS' : 'Tanpa CSS');
  $('#layer-js').setAttribute('aria-pressed', S.hasJs);
  $('#layer-js').textContent = S.hasJs ? 'JS' : (isEn ? 'No JS' : 'Tanpa JS');

  // Sinkronisasi Canva Left Rail & Contextual Drawer
  const mainEl = $('main');
  if (mainEl) {
    mainEl.classList.toggle('drawer-collapsed', !S.drawerOpen);
  }

  document.querySelectorAll('.rail-item[data-rail]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rail === S.railTab);
  });

  const drawerTitleMap = {
    elem: { icon: '📦', title: S.htmlMode === 'div' ? (isEn ? 'Classic <div> Elements' : 'Elemen <div> Biasa') : (isEn ? 'Semantic HTML5 Elements' : 'Elemen Semantik HTML5') },
    tpl: { icon: '📐', title: isEn ? 'Layout Templates' : 'Templat Susun Atur' },
    ins: { icon: '⚙️', title: isEn ? 'Element Settings' : 'Tetapan Elemen' },
    layers: { icon: '📑', title: isEn ? 'Layers Management' : 'Pengurusan Lapisan' },
    css: { icon: '🎨', title: isEn ? 'Styles & Canvas Studio' : 'Studio CSS & Kanvas' },
    ai: { icon: '💡', title: isEn ? 'Smart AI Tutor' : 'Tutor AI Pintar' }
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

  if (typeof applyLanguage === 'function') applyLanguage();
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

  const isEn = S.lang === 'en';
  const pageKeys = Object.keys(S.pages);
  const rootKey = pageKeys.includes('index.html') ? 'index.html' : pageKeys[0];
  const otherKeys = pageKeys.filter(k => k !== rootKey);

  // Auto-detect navigation links from canvas blocks (nav, button, link)
  pageKeys.forEach(k => {
    const p = S.pages[k];
    if (!p) return;
    p.links = p.links || [];
    (p.blocks || []).forEach(b => {
      if (b.type === 'button' || b.type === 'link') {
        const href = String(b.href || '').trim();
        if (href && pageKeys.includes(href) && href !== k && !p.links.includes(href)) {
          p.links.push(href);
        }
      } else if (b.type === 'nav') {
        const items = String(b.t || '').split(/[,\s|]+/);
        items.forEach(it => {
          const trimmed = it.trim().toLowerCase();
          const matched = pageKeys.find(pk => pk.replace('.html', '').toLowerCase() === trimmed || (S.pages[pk].name || '').toLowerCase() === trimmed);
          if (matched && matched !== k && !p.links.includes(matched)) {
            p.links.push(matched);
          }
        });
      }
    });
  });

  // 1. Calculate navigation architecture statistics
  let totalLinks = 0;
  pageKeys.forEach(k => {
    totalLinks += (S.pages[k].links || []).length;
  });

  // 2. Build Interactive SVG Sitemap Flowchart
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

  // Draw Root Node
  const isRootCur = rootKey === S.curPage;
  svgNodes.push(`
    <g class="sitemap-node${isRootCur ? ' active' : ''}" data-page="${rootKey}" style="cursor:pointer" title="${isEn ? 'Click to switch page · Double click to open canvas' : 'Klik untuk tukar halaman · Dwi-klik untuk buka di kanvas'}">
      <rect x="${rootX}" y="${rootY}" width="${rootW}" height="${rootH}" rx="10"
            fill="#203a5b" stroke="#c4d7ed" stroke-width="${isRootCur ? '2.5' : '1.5'}"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"/>
      <text x="${rootX + 16}" y="${rootY + 28}" fill="#ffffff" font-size="13" font-family="'JetBrains Mono', monospace" font-weight="700">🏠 ${esc(S.pages[rootKey].name)}</text>
      <text x="${rootX + 16}" y="${rootY + 48}" fill="#c4d7ed" font-size="11" font-family="'Inter', sans-serif">🧭 ${isEn ? 'Root Navigation Hub' : 'Pusat Navigasi Utama'}</text>
      <text x="${rootX + 16}" y="${rootY + 66}" fill="#c4d7ed" font-size="10" font-family="'JetBrains Mono', monospace">${(S.pages[rootKey].links || []).length} ${isEn ? 'outgoing navigation links' : 'pautan navigasi keluar'}</text>
      ${isRootCur ? `<rect x="${rootX + rootW - 55}" y="${rootY + 12}" width="42" height="18" rx="9" fill="#c4d7ed" stroke="#c4d7ed"/><text x="${rootX + rootW - 34}" y="${rootY + 24}" fill="#203a5b" font-size="9.5" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="700">${isEn ? 'ACTIVE' : 'AKTIF'}</text>` : ''}
    </g>
  `);

  // Draw target nodes and navigation flow connectors
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
      const hasReturn = (p.links || []).includes(rootKey);
      svgNodes.push(`
        <g class="sitemap-node${isCur ? ' active' : ''}" data-page="${itemKey}" style="cursor:pointer" title="${isEn ? 'Click to switch page · Double click to open canvas' : 'Klik untuk tukar halaman · Dwi-klik untuk buka di kanvas'}">
          <rect x="${targetX}" y="${targetY}" width="${targetW}" height="${itemH}" rx="8"
                fill="#203a5b" stroke="#c4d7ed" stroke-width="${isCur ? '2' : '1'}"
                filter="drop-shadow(0 3px 10px rgba(0,0,0,0.4))"/>
          <text x="${targetX + 14}" y="${targetY + 26}" fill="#ffffff" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="600">📄 ${esc(p.name)}</text>
          <text x="${targetX + 14}" y="${targetY + 46}" fill="#c4d7ed" font-size="10.5" font-family="'Inter', sans-serif">🧭 ${isEn ? (hasReturn ? 'Connected to Home' : 'No return link') : (hasReturn ? 'Bersambung ke Utama' : 'Tiada pautan balik')}</text>
          ${isCur ? `<rect x="${targetX + targetW - 55}" y="${targetY + 12}" width="42" height="18" rx="9" fill="#c4d7ed" stroke="#c4d7ed"/><text x="${targetX + targetW - 34}" y="${targetY + 24}" fill="#203a5b" font-size="9.5" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="700">${isEn ? 'ACTIVE' : 'AKTIF'}</text>` : ''}
        </g>
      `);
    } else {
      svgNodes.push(`
        <g class="sitemap-node ext-node" style="cursor:default">
          <rect x="${targetX}" y="${targetY}" width="${targetW}" height="${itemH}" rx="8"
                fill="#203a5b" stroke="#c4d7ed" stroke-width="1.2" stroke-dasharray="3 3"/>
          <text x="${targetX + 14}" y="${targetY + 26}" fill="#ffffff" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="600">🔗 ${esc(item.title)}</text>
          <text x="${targetX + 14}" y="${targetY + 46}" fill="#c4d7ed" font-size="10" font-family="'JetBrains Mono', monospace">${esc(item.url || (isEn ? 'External Link' : 'Pautan Luar'))}</text>
        </g>
      `);
    }
  });

  // Cross-links between secondary pages
  for (let i = 0; i < rightItems.length; i++) {
    for (let j = 0; j < rightItems.length; j++) {
      if (i === j) continue;
      const srcItem = rightItems[i];
      const dstItem = rightItems[j];
      const srcKey = typeof srcItem === 'object' ? srcItem.id : srcItem;
      const dstKey = typeof dstItem === 'object' ? dstItem.id : dstItem;
      const srcPage = S.pages[srcKey];
      if (srcPage && (srcPage.links || []).includes(dstKey)) {
        const y1 = 20 + i * (itemH + gapY) + itemH / 2;
        const y2 = 20 + j * (itemH + gapY) + itemH / 2;
        const curveX = targetX + targetW + 28 + Math.abs(i - j) * 12;
        svgConnectors.push(`
          <path d="M ${targetX + targetW} ${y1} C ${curveX} ${y1}, ${curveX} ${y2}, ${targetX + targetW + 4} ${y2}"
                fill="none" stroke="#60a5fa" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#arrow-cyan)"/>
        `);
      }
    }
  }

  const flowchartHtml = `
    <div class="nodes-flowchart-card">
      <div class="flowchart-head">
        <div class="flowchart-title-wrap">
          <span class="flowchart-ic">🧭</span>
          <div>
            <b class="flowchart-title">${isEn ? 'Website Navigation Flowchart (Visual Sitemap & Navigation Mesh)' : 'Carta Aliran Navigasi Laman (Peta Tapak Visual & Jalinan Navigasi)'}</b>
            <span class="flowchart-sub">${isEn ? 'Shows visitor flow across pages via navigation bars <nav> and action buttons <a>. Click any page card or "Open on Canvas" to edit it directly!' : 'Menunjukkan aliran pelawat merentasi halaman melalui bar navigasi <nav> dan butang <a>. Klik mana-mana kad atau "Buka pada Kanvas" untuk terus menyuntingnya!'}</span>
          </div>
        </div>
        <div class="flowchart-legend">
          <span class="legend-item"><span class="legend-line line-primary"></span> ${isEn ? '<nav> Navigation Path' : 'Laluan Navigasi <nav>'}</span>
          <span class="legend-item"><span class="legend-line line-primary"></span> ${isEn ? 'Return Link to Home' : 'Pautan Balik ke Utama'}</span>
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

  // 3. Build page navigation management grid
  const cardsHtml = pageKeys.map(k => {
    const p = S.pages[k];
    const isCur = k === S.curPage;
    const links = p.links || [];

    // Scan navigation components in page
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
              <span class="node-meta">${p.blocks.length} ${isEn ? 'elements on canvas' : 'elemen pada kanvas'}</span>
            </div>
          </div>
          <button type="button" class="node-open-btn${isCur ? ' is-active' : ''}" data-page="${k}" title="${isEn ? 'Open and edit this page on canvas' : 'Buka dan sunting halaman ini di kanvas'}">
            ${isCur ? (isEn ? '● Currently Editing' : '● Sedang Disunting') : (isEn ? '👁️ Open on Canvas' : '👁️ Buka di Kanvas')}
          </button>
        </div>

        <div class="node-nav-components">
          <div class="nav-comp-title">🧭 ${isEn ? 'Detected Navigation Components:' : 'Komponen Navigasi Dikesan:'}</div>
          <div class="nav-comp-list">
            ${navBlock ? `<div class="nav-comp-item"><span class="badge-tag">&lt;nav&gt;</span> <span class="nav-comp-txt">${esc(navBlock.t || (isEn ? 'Site Menu' : 'Menu Laman'))}</span></div>` : `<div class="nav-comp-item none"><span class="badge-tag dim">&lt;nav&gt;</span> <span class="dim">${isEn ? 'No nav menu bar' : 'Tiada bar menu nav'}</span></div>`}
            ${buttonBlocks.length ? buttonBlocks.map(btn => `<div class="nav-comp-item"><span class="badge-tag btn">&lt;a.btn&gt;</span> <span class="nav-comp-txt">${esc(btn.t || (isEn ? 'Action Button' : 'Butang Tindakan'))}</span></div>`).join('') : ''}
            ${footerBlock ? `<div class="nav-comp-item"><span class="badge-tag foot">&lt;footer&gt;</span> <span class="nav-comp-txt">${esc(footerBlock.t || (isEn ? 'Footer Links' : 'Pautan Pengaki'))}</span></div>` : ''}
          </div>
        </div>

        <div class="node-links">
          <div class="node-links-head">
            <b>${isEn ? 'Outgoing Links' : 'Pautan Keluar'} (${links.length}):</b>
            <span class="node-links-badge">${links.length ? (isEn ? 'Active' : 'Aktif') : (isEn ? 'Isolated' : 'Terasing')}</span>
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
                  <button type="button" class="node-link-del" data-del-link="${k}:${idx}" title="${isEn ? 'Disconnect this navigation link' : 'Putuskan sambungan pautan ini'}">✕</button>
                </div>
              `;
            }).join('') : `<div class="node-empty-links">${isEn ? '⚠️ This page is not connected to any other page yet. Please add a link below.' : '⚠️ Halaman ini belum bersambung ke mana-mana halaman lain. Sila tambah pautan di bawah.'}</div>`}
          </div>

          <div class="node-add-link-box">
            <label class="add-link-lbl">${isEn ? 'Connect to:' : 'Sambung ke:'}</label>
            <div class="node-add-link-row">
              <select id="sel-link-${k.replace(/\./g, '_')}" class="node-select">${targetOpts}</select>
              <button type="button" class="btn-node-add" data-add-link="${k}">${isEn ? '+ Connect' : '+ Sambung'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 4. External links card
  const extCardHtml = `
    <div class="node-card ext-card">
      <div class="node-head">
        <div class="node-title-group">
          <span class="node-icon">🌐</span>
          <div>
            <b class="node-name" style="color:var(--am)">${isEn ? 'External Web Links' : 'Pautan Web Luar'}</b>
            <span class="node-meta">${S.extLinks.length} ${isEn ? 'external third-party links' : 'pautan pihak ketiga luar'}</span>
          </div>
        </div>
        <button type="button" class="btn-node-add ext-add-btn" id="btn-add-ext">${isEn ? '+ Add External' : '+ Tambah Luar'}</button>
      </div>
      <div class="node-desc">${isEn ? 'External destinations such as official WhatsApp, Google Maps, or social media links.' : 'Destinasi luar seperti WhatsApp rasmi, Google Maps, atau pautan media sosial.'}</div>
      <div class="node-links-list">
        ${S.extLinks.map((ext, i) => `
          <div class="node-link-item ext">
            <span class="node-link-dest">
              <b>${esc(ext.title)}</b><br>
              <small style="color:var(--mute)">${esc(ext.url)}</small>
            </span>
            <button type="button" class="node-link-del" data-del-ext="${i}" title="${isEn ? 'Delete external link' : 'Padam pautan luar'}">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Assemble full Navigation Map / Sitemap view
  wrap.innerHTML = `
    <div class="nodes-top-bar">
      <div class="nodes-title-main">
        <span>🗺️ ${isEn ? 'Website Navigation Map (Sitemap Architecture)' : 'Peta Navigasi Laman (Seni Bina Sitemap)'}</span>
        <div class="nodes-stat-pills">
          <span class="stat-pill">📄 ${pageKeys.length} ${isEn ? 'Pages' : 'Halaman'}</span>
          <span class="stat-pill">🧭 ${totalLinks} ${isEn ? 'Navigation Links' : 'Pautan Navigasi'}</span>
          <span class="stat-pill active">⚡ ${isEn ? 'Active Navigation Flow' : 'Aliran Navigasi Aktif'}</span>
        </div>
      </div>
    </div>
    ${flowchartHtml}
    <div class="nodes-sub-title">
      <span>🗂️ ${isEn ? 'Manage Navigation Links by Page File:' : 'Urus Pautan Navigasi Mengikut Fail Halaman:'}</span>
    </div>
    <div class="nodes-grid" id="nodes-grid">
      ${cardsHtml}
      ${extCardHtml}
    </div>
  `;
}

function runAiAudit() {
  const isEn = S.lang === 'en';
  const types = S.blocks.map(b => b.type);
  const hasHead = types.includes('header');
  const hasNav = types.includes('nav');
  const hasHero = types.includes('hero') || types.includes('slider');
  const hasContent = types.includes('section') || types.includes('card') || types.includes('form');
  const hasFoot = types.includes('footer');

  const report = [];
  if (isEn) {
    if (!hasHead) report.push('⚠️ No <b>&lt;header&gt;</b> yet. Following webpage anatomy, start with the page header on the very top row.');
    else if (!hasNav) report.push('💡 You have a Header, try adding a <b>&lt;nav&gt;</b> for menu navigation links.');
    if (!hasHero) report.push('💡 Add a <b>Hero</b> or <b>Slider</b> beneath the header as the primary visitor highlight.');
    if (!hasContent) report.push('💡 Main body is currently empty. Add several <b>&lt;section&gt;</b>, <b>Card (&lt;article&gt;)</b>, or <b>Form (&lt;form&gt;)</b> blocks.');
    if (!hasFoot) report.push('⚠️ No <b>&lt;footer&gt;</b> at the bottom yet for copyright and footer links.');
    if (hasHead && hasHero && hasContent && hasFoot) report.push('🎉 <b>Excellent!</b> Your webpage anatomical structure is complete (Header ➡ Hero ➡ Body ➡ Footer).');

    if (S.htmlMode === 'div') {
      report.push('⚠️ <b>Plain HTML Mode Active:</b> Your site currently uses classic <code>&lt;div&gt;</code> tags (Div Soup). For full W3C standard compliance and SEO, click <b>🏷️ Semantic HTML5</b>.');
    } else {
      report.push('🏷️ <b>Semantic HTML5 Compliant:</b> Your code complies with official W3C semantic standards (&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;section&gt;, &lt;form&gt;, &lt;footer&gt;).');
    }
  } else {
    if (!hasHead) report.push('⚠️ Belum ada <b>&lt;header&gt;</b>. Mengikut anatomi laman web, mulakan dengan Kepala Halaman di baris paling atas.');
    else if (!hasNav) report.push('💡 Anda sudah mempunyai Header, cuba tambah <b>&lt;nav&gt;</b> untuk pautan menu navigasi.');
    if (!hasHero) report.push('💡 Tambahkan blok <b>Hero</b> atau <b>Slider</b> di bawah header sebagai tarikan utama pelawat.');
    if (!hasContent) report.push('💡 Bahagian kandungan masih kosong. Tambahkan blok <b>&lt;section&gt;</b>, <b>Kad (&lt;article&gt;)</b>, atau <b>Borang (&lt;form&gt;)</b>.');
    if (!hasFoot) report.push('⚠️ Belum ada <b>&lt;footer&gt;</b> di bahagian paling bawah untuk maklumat hak cipta.');
    if (hasHead && hasHero && hasContent && hasFoot) report.push('🎉 <b>Syabas!</b> Struktur anatomi halaman web anda sudah lengkap (Header ➡ Hero ➡ Kandungan ➡ Footer).');

    if (S.htmlMode === 'div') {
      report.push('⚠️ <b>Mod HTML Biasa Aktif:</b> Laman anda sedang menggunakan tag klasik <code>&lt;div&gt;</code> (Div Soup). Untuk piawaian W3C dan SEO terbaik, pilih <b>🏷️ Semantik HTML5</b>.');
    } else {
      report.push('🏷️ <b>Patuh Piawaian HTML5 Semantik:</b> Kod anda mematuhi piawaian rasmi W3C (&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;section&gt;, &lt;form&gt;, &lt;footer&gt;).');
    }
  }

  const auditHtml = report.join('<br><br>');
  if ($('#ai-audit-text')) $('#ai-audit-text').innerHTML = auditHtml;
  if ($('#drawer-ai-audit-text')) $('#drawer-ai-audit-text').innerHTML = auditHtml;
}

// Build element palette grouped by anatomical structure (Top, Content, Links & Components, Media, Bottom)
const PAL_GROUPS = [
  {
    title: '🔝 Bahagian atas',
    enTitle: '🔝 Top Section',
    keys: ['header', 'nav', 'logo']
  },
  {
    title: '🏛️ Kandungan',
    enTitle: '🏛️ Content',
    keys: ['hero', 'section', 'card', 'aside']
  },
  {
    title: '🧱 Pautan & komponen',
    enTitle: '🧱 Links & Components',
    keys: ['text', 'link', 'button', 'dropdown', 'form']
  },
  {
    title: '🖼️ Media',
    enTitle: '🖼️ Media',
    keys: ['image', 'slider']
  },
  {
    title: '🔻 Bahagian bawah',
    enTitle: '🔻 Bottom Section',
    keys: ['footer']
  }
];

function renderPalette() {
  const palEl = $('#pal');
  if (!palEl) return;
  const isEn = S.lang === 'en';
  palEl.innerHTML = PAL_GROUPS.map(g => `
    <div class="pal-group">
      <div class="pal-group-head">
        <span class="pal-group-title">${isEn ? g.enTitle : g.title}</span>
        <span class="pal-group-count">${g.keys.length}</span>
      </div>
      <div class="pal-grid">
        ${g.keys.map(k => {
          const item = TY[k] || { n: k, en: k, tag: 'div' };
          const label = isEn ? (item.en || item.n) : item.n;
          return `
            <button type="button" draggable="true" data-add="${k}" class="pal-btn" title="${isEn ? `Drag or click to add ${label}` : `Seret atau klik untuk tambah ${label}`} (&lt;${item.tag}&gt;)">
              <span class="pal-ic-wrap">${icon(k, 'pal-ic', 14)}</span>
              <span class="pal-txt-wrap">
                <span class="pal-title">${label}</span>
                <small class="pal-sub">&lt;${item.tag}&gt;</small>
              </span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}
renderPalette();

/**
 * Generates thumbnail preview (SVG) for template layout.
 * @param {Array} t Template data from TP
 * @returns {string} SVG string
 */
const thumb = t => {
  const b = t[1];
  const big = b.reduce((m, x, i) => (x[3] * x[4] > b[m][3] * b[m][4] ? i : m), 0);
  return `<svg viewBox="0 0 120 100" width="100%" aria-hidden="true"><rect x=".5" y=".5" width="119" height="99" rx="4" fill="none" stroke="#fff" opacity=".7"/>${[8, 14, 20].map(x => `<circle cx="${x}" cy="6" r="1.8" fill="#fff"/>`).join('')}${b.map((a, i) => `<rect x="${(a[1] - 1) * 9.2 + 4}" y="${(a[2] - 1) * 6.6 + 14}" width="${a[3] * 9.2 - 2}" height="${a[4] * 6.6 - 2}" fill="${i === big ? '#00d4ff' : '#fff'}" opacity="${i === big ? '.85' : '.3'}"/>`).join('')}</svg>`;
};

function renderTemplates() {
  const tplEl = $('#tpl');
  if (!tplEl) return;
  const isEn = S.lang === 'en';
  tplEl.innerHTML = TP.map((t, i) => {
    const title = isEn ? t[0] : (t[2] || t[0]);
    return `<button type="button" data-tpl="${i}" title="${esc(title)}"><div class="tpl-thumb">${thumb(t)}</div><span class="tpl-title">${esc(title)}</span></button>`;
  }).join('');
}
renderTemplates();
$('#dt').textContent = (S.lang === 'en' ? 'Date: ' : 'Tarikh: ') + new Date().toLocaleDateString('en-US');

function applyLanguage() {
  const isEn = S.lang === 'en';
  document.documentElement.lang = isEn ? 'en' : 'ms';
  const langBtn = $('#btn-lang-toggle');
  if (langBtn) {
    langBtn.innerHTML = `<span>🌐 ${isEn ? 'EN' : 'BM'}</span>`;
    langBtn.title = isEn ? 'Switch Language to Bahasa Melayu (BM)' : 'Tukar Bahasa ke Bahasa Inggeris (EN)';
  }
  const dlLbl = $('#btn-dl-lbl');
  if (dlLbl) dlLbl.textContent = isEn ? 'Download ZIP' : 'Muat turun ZIP';
  const dlBtn = $('#btn-dl-all');
  if (dlBtn) dlBtn.title = isEn ? 'Download all project files in .zip archive (index.html, about.html, contact.html, style.css, script.js)' : 'Muat turun semua fail projek dalam arkib .zip (index.html, about.html, contact.html, style.css, script.js)';

  // Canvas Tools & History tooltips
  const vTool = document.querySelector('[data-tool="v"]');
  if (vTool) vTool.title = isEn ? 'Select and resize elements (V)' : 'Pilih dan ubah saiz elemen (V)';
  const rTool = document.querySelector('[data-tool="r"]');
  if (rTool) rTool.title = isEn ? 'Draw new box on canvas (R)' : 'Lukis kotak baharu pada kanvas (R)';
  const undoBtn = $('#undo');
  if (undoBtn) undoBtn.title = isEn ? 'Undo (Ctrl+Z)' : 'Buat asal (Ctrl+Z)';
  const redoBtn = $('#redo');
  if (redoBtn) redoBtn.title = isEn ? 'Redo (Ctrl+Shift+Z)' : 'Buat semula (Ctrl+Shift+Z)';

  // Top mode buttons
  const modeMap = {
    c: isEn ? 'Code' : 'Kod',
    s: 'Split',
    plan: isEn ? 'Design' : 'Reka bentuk',
    prev: isEn ? 'Preview' : 'Pratonton',
    nodes: isEn ? 'Flow' : 'Aliran'
  };
  const modeTitles = {
    c: isEn ? 'Open code editor' : 'Buka editor kod',
    s: isEn ? 'Show canvas and code side-by-side' : 'Papar kanvas dan kod bersebelahan',
    plan: isEn ? 'Design webpage on grid canvas' : 'Reka laman pada kanvas grid',
    prev: isEn ? 'View live page preview' : 'Lihat pratonton laman',
    nodes: isEn ? 'View page flow and connections (Sitemap)' : 'Lihat aliran halaman dan pautan'
  };
  document.querySelectorAll('#mode button').forEach(btn => {
    const key = btn.dataset.m === 'c' ? 'c' : btn.dataset.m === 's' ? 's' : btn.dataset.dwView;
    if (key && modeMap[key]) {
      btn.textContent = modeMap[key];
      btn.title = modeTitles[key] || '';
    }
  });

  // Viewport buttons
  const vpMap = {
    desktop: isEn ? 'Fit' : 'Muat',
    tablet: 'Tablet',
    mobile: isEn ? 'Mobile' : 'Telefon'
  };
  document.querySelectorAll('#live-viewport-tools .vp-btn[data-vp]').forEach(btn => {
    const vp = btn.dataset.vp;
    if (vp && vpMap[vp]) btn.textContent = vpMap[vp];
  });
  const runJsBtn = $('#run-preview-js');
  if (runJsBtn) {
    runJsBtn.textContent = isEn ? 'Run JS' : 'Jalankan JS';
    runJsBtn.title = isEn ? 'Toggle preview JavaScript in isolated sandbox' : 'JavaScript pratonton dimatikan secara lalai';
  }

  // Rail labels & tooltips
  const railMap = {
    elem: isEn ? 'Elements' : 'Elemen',
    tpl: isEn ? 'Templates' : 'Templat',
    ins: isEn ? 'Settings' : 'Tetapan',
    layers: isEn ? 'Layers' : 'Lapisan',
    css: isEn ? 'Styles' : 'Gaya',
    ai: isEn ? 'AI Tutor' : 'Tutor AI'
  };
  const railTitles = {
    elem: isEn ? 'Elements & components (Press [)' : 'Elemen dan komponen (Tekan [)',
    tpl: isEn ? 'Ready-to-use templates' : 'Templat siap guna',
    ins: isEn ? 'Element settings (active on select)' : 'Tetapan elemen (terbuka apabila elemen dipilih)',
    layers: isEn ? 'Element layer hierarchy' : 'Susunan lapisan elemen',
    css: isEn ? 'Styles and device size' : 'Gaya dan saiz peranti',
    ai: isEn ? 'AI Tutor guidance' : 'Panduan tutor AI'
  };
  document.querySelectorAll('.rail-item[data-rail]').forEach(btn => {
    const rKey = btn.dataset.rail;
    const lbl = btn.querySelector('.rail-lbl');
    if (lbl && railMap[rKey]) lbl.textContent = railMap[rKey];
    if (railTitles[rKey]) btn.title = railTitles[rKey];
  });

  // Drawer Title & icons
  const drawerTitleMap = {
    elem: { icon: '📦', title: S.htmlMode === 'div' ? (isEn ? 'Classic <div> Elements' : 'Elemen <div> Biasa') : (isEn ? 'Semantic HTML5 Elements' : 'Elemen Semantik HTML5') },
    tpl: { icon: '📐', title: isEn ? 'Layout Templates' : 'Templat Susun Atur' },
    ins: { icon: '⚙️', title: isEn ? 'Element Settings' : 'Tetapan Elemen' },
    layers: { icon: '📑', title: isEn ? 'Layers Management' : 'Pengurusan Lapisan' },
    css: { icon: '🎨', title: isEn ? 'Styles & Canvas Studio' : 'Studio CSS & Kanvas' },
    ai: { icon: '💡', title: isEn ? 'Smart AI Tutor' : 'Tutor AI Pintar' }
  };
  const curDrawer = drawerTitleMap[S.railTab] || drawerTitleMap.elem;
  const dIcon = $('#drawer-icon');
  const dTitle = $('#drawer-title');
  if (dIcon) dIcon.textContent = curDrawer.icon;
  if (dTitle) dTitle.textContent = curDrawer.title;

  const setTxt = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
  const setHtml = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  // Drawer Header buttons
  const drwClose = $('#drawer-close-btn');
  if (drwClose) drwClose.title = isEn ? 'Hide Drawer (Press [)' : 'Sembunyikan Panel (Tekan [)';
  const sideOpen = $('#side-open-btn');
  if (sideOpen) sideOpen.title = isEn ? 'Open Drawer Panel (Press [)' : 'Buka Panel Tepi (Tekan [)';

  // Drawer HTML Tag Mode card
  setTxt('.side-html-mode-title', isEn ? 'Tag Mode:' : 'Jenis tag:');
  setTxt('#side-html-mode-sub', S.htmlMode === 'div' ? (isEn ? 'Classic <div>' : 'Div biasa') : (isEn ? 'Semantic HTML5' : 'HTML5 semantik'));
  const btnSem = document.querySelector('.side-html-mode-card [data-html-mode="semantic"]');
  if (btnSem) {
    btnSem.textContent = isEn ? 'Semantic' : 'Semantik';
    btnSem.title = isEn ? 'W3C semantic tags that describe the structure of the page.' : 'Tag HTML5 yang menerangkan fungsi bahagian halaman.';
  }
  const btnDiv = document.querySelector('.side-html-mode-card [data-html-mode="div"]');
  if (btnDiv) {
    btnDiv.textContent = isEn ? 'Classic <div>' : 'Biasa <div>';
    btnDiv.title = isEn ? 'Use classic <div> tags for all sections.' : 'Gunakan tag <div> biasa untuk semua bahagian.';
  }
  setTxt('#drawer-panel-elem .hint', isEn ? 'Click or drag elements onto the canvas.' : 'Klik atau seret elemen ke kanvas.');
  setTxt('#drawer-panel-tpl .hint', isEn ? 'Choose a ready-to-use page layout.' : 'Pilih susun atur halaman siap guna.');

  // CSS drawer labels
  setHtml('#css-sec-resp-title', `<img src="assets/icons/view-mobile.png" class="img-ic-sm" alt=""> ${isEn ? 'Responsive Preview' : 'Pratonton Responsif'}`);
  setTxt('#css-resp-lbl', isEn ? 'Generate Responsive Code (@media)' : 'Jana Kod Responsif (@media)');
  setTxt('#css-resp-sub', isEn ? 'Inject media query rules into CSS output' : 'Suntik peraturan media query ke dalam CSS');
  const toggleRespBtn = $('#btn-toggle-resp-css');
  if (toggleRespBtn) toggleRespBtn.title = isEn ? 'Toggle responsive CSS code (@media)' : 'Hidup/matikan kod CSS responsif (@media)';

  setHtml('#css-sec-grid-title', `<img src="assets/icons/tool-dimension.png" class="img-ic-sm" alt=""> ${isEn ? 'CSS Grid Spacing & Rows' : 'Jarak & Saiz Grid CSS'}`);
  setTxt('#css-gap-lbl', isEn ? 'Grid Gap (gap):' : 'Jarak Grid (gap):');
  setTxt('#css-rowh-lbl', isEn ? 'Row Height (grid-auto-rows):' : 'Tinggi Baris (grid-auto-rows):');

  setHtml('#css-sec-token-title', `<img src="assets/icons/tool-theme.png" class="img-ic-sm" alt=""> ${isEn ? 'Global Theme (:root Tokens)' : 'Tema Sejagat (Token :root)'}`);
  setTxt('#tok-lbl-pri', isEn ? 'Primary Accent:' : 'Warna Utama:');
  setTxt('#tok-lbl-bg', isEn ? 'Canvas Background:' : 'Latar Belakang:');
  setTxt('#tok-lbl-txt', isEn ? 'Primary Text:' : 'Teks Utama:');

  setHtml('#css-sec-preset-title', `<img src="assets/icons/tool-theme.png" class="img-ic-sm" alt=""> ${isEn ? 'Canvas Theme Presets' : 'Tema Pantas Kanvas'}`);
  const lightPreset = document.querySelector('[data-theme-preset="light"]');
  if (lightPreset) lightPreset.innerHTML = `<img src="assets/icons/theme-light.png" class="img-ic-sm" alt=""> ${isEn ? 'Clean Light' : 'Cerah Bersih'}`;
  const darkPreset = document.querySelector('[data-theme-preset="dark"]');
  if (darkPreset) darkPreset.innerHTML = `<img src="assets/icons/theme-dark.png" class="img-ic-sm" alt=""> ${isEn ? 'Modern Dark' : 'Gelap Moden'}`;
  const mintPreset = document.querySelector('[data-theme-preset="mint"]');
  if (mintPreset) mintPreset.innerHTML = `<img src="assets/icons/theme-mint.png" class="img-ic-sm" alt=""> ${isEn ? 'Fresh Mint' : 'Hijau Segar'}`;

  // Status Bar labels
  setTxt('#dw-author-lbl', isEn ? 'Author:' : 'Pereka:');
  if ($('#nm')) $('#nm').placeholder = isEn ? 'Your name' : 'Nama anda';
  setTxt('#dw-sync-pill', isEn ? '⚡ Live Sync' : '⚡ Segerak Langsung');
  const syncPill = $('#dw-sync-pill');
  if (syncPill) syncPill.title = isEn ? 'Live bidirectional sync between code and visual design' : 'Penyegerakan langsung dua hala antara kod dan reka bentuk';
  setTxt('#btn-apply-lbl', isEn ? 'Apply' : 'Terapkan');
  setTxt('#btn-revert-lbl', isEn ? 'Revert' : 'Pulihkan');
  setTxt('#btn-copy-lbl', isEn ? 'Copy' : 'Salin');
  const applyBtn = $('#btn-apply-code');
  if (applyBtn) applyBtn.title = isEn ? 'Apply code changes to canvas (Ctrl+S)' : 'Terapkan perubahan kod ke kanvas (Ctrl+S)';
  const revertBtn = $('#btn-revert-code');
  if (revertBtn) revertBtn.title = isEn ? 'Revert to canvas generated code' : 'Pulihkan kod asal daripada rekaan kanvas';
  const copyBtn = $('#copy');
  if (copyBtn) copyBtn.title = isEn ? 'Copy code in this tab' : 'Salin kod dalam tab ini';

  setTxt('#dt', (isEn ? 'Date: ' : 'Tarikh: ') + new Date().toLocaleDateString(isEn ? 'en-US' : 'ms-MY'));

  // Code editor sub-bar
  const codeModeDiv = document.querySelector('#seg-html-mode [data-html-mode="div"]');
  if (codeModeDiv) codeModeDiv.textContent = isEn ? '📦 Classic <div>' : '📦 Biasa <div>';
  const codeModeSem = document.querySelector('#seg-html-mode [data-html-mode="semantic"]');
  if (codeModeSem) codeModeSem.textContent = isEn ? '🏷️ Semantic HTML5' : '🏷️ Semantik HTML5';
  setTxt('.sub-label', isEn ? 'CSS Method:' : 'Kaedah CSS:');
  setTxt('#code-error-title', isEn ? 'Syntax Error Detected' : 'Ralat Sintaks Dikesan');
  setTxt('#btn-goto-error', isEn ? 'Go to Line' : 'Pergi ke Baris');

  // Code mode tabs
  const viewBtn = document.querySelector('[data-cmode="view"]');
  const editBtn = document.querySelector('[data-cmode="edit"]');
  if (viewBtn) viewBtn.textContent = isEn ? 'View' : 'Papar';
  if (editBtn) editBtn.textContent = isEn ? 'Edit · Auto' : 'Sunting · Auto';

  // AI Tutor FAQs in both Drawer and Modal
  setTxt('#drawer-ai-audit-head', isEn ? '🔍 Live Structure Audit' : '🔍 Audit Struktur Semasa');
  setTxt('#drawer-ai-faq-head', isEn ? 'Student FAQs:' : 'Soalan Lazim Pelajar:');
  setHtml('#ai-modal-head-title', `<img src="assets/icons/ai-guru.png" class="img-ic-sm" alt="AI"> ${isEn ? 'Smart AI Tutor' : 'Tutor AI Pintar'}`);
  setTxt('#ai-modal-audit-head', isEn ? '🔍 Current Layout Audit' : '🔍 Audit Struktur Semasa');
  setTxt('#ai-faq-head', isEn ? 'Frequently Asked Questions:' : 'Soalan Lazim Pelajar:');

  const faqLabels = {
    order: isEn ? '1. What should I structure first?' : '1. Apakah yang perlu saya susun dahulu?',
    nav: isEn ? '2. Why use <nav> instead of <div>?' : '2. Mengapa guna <nav> bukannya <div>?',
    hero: isEn ? '3. How do I put text next to an image in Hero?' : '3. Bagaimana letak teks di sebelah gambar dalam Hero?',
    css: isEn ? '4. When should I use External vs Internal CSS?' : '4. Bila perlu guna External vs Internal CSS?',
    box: isEn ? '5. What is the difference between Padding and Margin?' : '5. Apakah beza antara Padding dan Margin?',
    semantic: isEn ? '6. Why is Semantic HTML5 preferred over <div>?' : '6. Mengapa HTML5 Semantik lebih baik daripada <div>?',
    links: isEn ? '7. How do I connect pages in the Sitemap?' : '7. Bagaimana menghubungkan halaman dalam Peta Tapak?',
    form: isEn ? '8. How does the <form> element work?' : '8. Bagaimana borang <form> berfungsi?'
  };
  document.querySelectorAll('[data-q]').forEach(btn => {
    const qk = btn.dataset.q;
    if (faqLabels[qk]) btn.textContent = faqLabels[qk];
  });

  // Sitemap & Nodes Flow
  setTxt('.nodes-title span', isEn ? 'Page Sitemap & Connection Flow' : 'Peta Tapak & Aliran Sambungan Halaman');
  setTxt('#btn-add-ext', isEn ? '+ Add External Link' : '+ Tambah Pautan Luar');

  // Footer
  setHtml('.app-footer-copy', isEn ? '© Copyright Reserved • Designed by <b>Muhammad Syafiq Haron</b> for Web Design Class' : '© Hak Cipta Terpelihara • Direka oleh <b>Muhammad Syafiq Haron</b> untuk Kelas Rekaan Web');

  renderPalette();
  renderTemplates();
  renderTabsBar();
}

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

// Toggle Side Panel Drawer
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

// Document Click Handler
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  let x;
  if (x = q('#btn-lang-toggle')) {
    S.lang = S.lang === 'en' ? 'ms' : 'en';
    if (typeof syncLanguageDefaults === 'function') syncLanguageDefaults(S.lang);
    render();
    toast(S.lang === 'en' ? '🌐 Interface language switched to English (EN)' : '🌐 Bahasa antara muka ditukar ke Bahasa Melayu (BM)');
  } else if (x = q('#run-preview-js')) {
    S.previewScripts = !S.previewScripts;
    if (S.previewScripts) S.hasJs = true;
    render();
    toast(S.lang === 'en'
      ? (S.previewScripts ? 'Preview JavaScript enabled in isolated sandbox.' : 'Preview JavaScript disabled.')
      : (S.previewScripts ? 'JavaScript pratonton dihidupkan dalam ruang terasing.' : 'JavaScript pratonton dimatikan.'));
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
    if (typeof window !== 'undefined' && window.innerWidth <= 768) S.drawerOpen = false;
    if (hasCodePreviewOverride()) insertCodeSourceElement(x.dataset.add);
    else add(x.dataset.add);
  } else if (x = q('[data-tpl]')) {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) S.drawerOpen = false;
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
  } else if (x = q('[data-layer-sort]')) {
    S.layerSortMode = x.dataset.layerSort;
    renderLayersPanel();
    toast(S.layerSortMode === 'flow'
      ? (S.lang === 'en' ? 'Layers Mode: 📄 Page Flow (Header ➡ Footer)' : 'Susunan Lapisan: 📄 Aliran Laman (Pengepala ➡ Pengaki)')
      : (S.lang === 'en' ? 'Layers Mode: 📑 Z-Index Stack (Front ➡ Back)' : 'Susunan Lapisan: 📑 Tindihan Z-Index (Hadapan ➡ Belakang)'));
  }
  else if (x = q('#tl,#side-close-btn,#side-open-btn')) tp('tl');
  else if (x = q('#ti')) tp('ti');
  else if (x = q('#layer-html')) toast(S.lang === 'en' ? 'HTML is the fundamental skeleton of the webpage, always active.' : 'HTML ialah rangka asas halaman web dan sentiasa aktif.');
  else if (x = q('#layer-css')) {
    S.hasCss = !S.hasCss;
    render();
    toast(S.lang === 'en' ? (S.hasCss ? 'CSS Enabled (+ CSS)' : 'CSS Disabled (Raw HTML)') : (S.hasCss ? 'CSS Dihidupkan (+ CSS)' : 'CSS Dimatikan (Tanpa CSS)'));
  } else if (x = q('#layer-js')) {
    S.hasJs = !S.hasJs;
    render();
    toast(S.lang === 'en' ? (S.hasJs ? 'JS Enabled (+ JS)' : 'JS Disabled (No JS)') : (S.hasJs ? 'JS Dihidupkan (+ JS)' : 'JS Dimatikan (Tanpa JS)'));
  } else if (x = q('#ai-btn')) {
    $('#ai-modal').hidden = false;
    runAiAudit();
  } else if (x = q('#ai-close-btn')) {
    $('#ai-modal').hidden = true;
  } else if (x = q('[data-q]')) {
    const isEn = S.lang === 'en';
    const dict = isEn ? (typeof AI_KNOWLEDGE_EN !== 'undefined' ? AI_KNOWLEDGE_EN : AI_KNOWLEDGE) : (typeof AI_KNOWLEDGE_BM !== 'undefined' ? AI_KNOWLEDGE_BM : AI_KNOWLEDGE);
    const htmlAns = dict[x.dataset.q] || '';
    const answerContent = htmlAns ? `
      <div style="background:rgba(0,212,255,0.06);border:1.5px solid var(--cy);border-radius:8px;padding:12px;line-height:1.55">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid rgba(0,212,255,0.25)">
          <span style="font-weight:700;font-size:12px;color:var(--cy);display:flex;align-items:center;gap:6px">
            🤖 ${isEn ? 'AI Tutor Answer' : 'Jawapan Guru AI'}
          </span>
          <button type="button" class="ai-ans-dismiss" style="background:none;border:none;color:var(--mute);cursor:pointer;font-size:14px;padding:0 4px" title="${isEn ? 'Close Answer' : 'Tutup Jawapan'}">✕</button>
        </div>
        <div style="font-size:12px;line-height:1.6;color:var(--ink)">${htmlAns}</div>
      </div>
    ` : '';
    const ansBox = $('#ai-ans');
    if (ansBox) {
      ansBox.innerHTML = answerContent;
      if (answerContent) ansBox.classList.add('show');
      else ansBox.classList.remove('show');
    }
    const drawerAns = $('#drawer-ai-ans');
    if (drawerAns) {
      drawerAns.innerHTML = answerContent;
      drawerAns.hidden = !answerContent;
    }
    document.querySelectorAll('[data-q]').forEach(btn => btn.classList.toggle('active', btn.dataset.q === x.dataset.q));
  } else if (x = q('.ai-ans-dismiss')) {
    const ansBox = $('#ai-ans');
    if (ansBox) { ansBox.innerHTML = ''; ansBox.classList.remove('show'); }
    const drawerAns = $('#drawer-ai-ans');
    if (drawerAns) { drawerAns.innerHTML = ''; drawerAns.hidden = true; }
    document.querySelectorAll('[data-q]').forEach(btn => btn.classList.remove('active'));
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
      const isEn = S.lang === 'en';
      const shouldOpenCanvas = x.matches('.node-open-btn, .node-open-btn *') || x.closest('.node-open-btn');
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      S.curPage = pg;
      syncCurPage();
      S.sel = null;
      if (shouldOpenCanvas) {
        S.view = 'plan';
        S.mode = 'v';
      }
      render();
      toast(shouldOpenCanvas
        ? (isEn ? `Opening ${S.pages[pg].name} on canvas` : `Membuka ${S.pages[pg].name} di kanvas`)
        : (isEn ? `Switched to page: ${S.pages[pg].name}` : `Tukar ke halaman: ${S.pages[pg].name}`));
    }
  } else if (x = q('#btn-add-page')) {
    const isEn = S.lang === 'en';
    appPrompt(
      isEn ? 'Enter new page filename (e.g. services.html or gallery.html):' : 'Masukkan nama fail halaman baru (cth: services.html atau galeri.html):',
      'services.html',
      isEn ? 'Add New Page' : 'Tambah Halaman Baru',
      '📄',
      isEn ? 'filename.html' : 'nama-fail.html'
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
            { id: '2', type: 'footer', c: 1, r: 12, w: 12, h: 1, t: isEn ? '© 2026 All rights reserved' : 'Hak cipta 2026', f: 0 }
          ],
          links: ['index.html']
        };
        S.curPage = safeId;
        syncCurPage();
        render();
        toast(isEn ? `New page "${safeId}" added!` : `Halaman baru "${safeId}" berjaya ditambah!`);
      } else {
        appAlert(isEn ? 'Invalid name or page already exists! Please use a different name.' : 'Nama tidak sah atau halaman sudah wujud! Sila gunakan nama lain.', isEn ? 'Page Error' : 'Ralat Halaman', '⚠️');
      }
    });
  } else if (x = q('[data-add-link]')) {
    const isEn = S.lang === 'en';
    const fromP = x.dataset.addLink;
    const selEl = $('#sel-link-' + fromP.replace(/\./g, '_'));
    if (selEl && S.pages[fromP]) {
      const target = selEl.value;
      S.pages[fromP].links = S.pages[fromP].links || [];
      if (!S.pages[fromP].links.includes(target)) {
        S.pages[fromP].links.push(target);
        render();
        toast(isEn ? 'Link successfully connected!' : 'Pautan berjaya disambungkan!');
      } else toast(isEn ? 'Link to this destination already exists.' : 'Pautan ke destinasi ini sudah wujud.');
    }
  } else if (x = q('[data-del-link]')) {
    const isEn = S.lang === 'en';
    const [fromP, idx] = x.dataset.delLink.split(':');
    if (S.pages[fromP] && S.pages[fromP].links) {
      S.pages[fromP].links.splice(+idx, 1);
      render();
      toast(isEn ? 'Link disconnected.' : 'Pautan diputuskan.');
    }
  } else if (x = q('#btn-add-ext')) {
    const isEn = S.lang === 'en';
    appPrompt(
      isEn ? 'Enter external link title (e.g., Social Media / WhatsApp):' : 'Masukkan nama pautan luar (cth: Instagram Kami / Facebook):',
      isEn ? 'Social Media' : 'Media Sosial',
      isEn ? 'Add External Link' : 'Tambah Pautan Luar',
      '🌐',
      isEn ? 'e.g. Social Media' : 'cth: Instagram Kami'
    ).then(t => {
      if (!t || !t.trim()) return;
      appPrompt(
        isEn ? 'Enter full web URL address:' : 'Masukkan alamat URL web penuh:',
        'https://',
        isEn ? 'External Link URL' : 'Alamat URL Pautan Luar',
        '🔗',
        'https://...'
      ).then(u => {
        if (!u || !u.trim()) return;
        S.extLinks.push({ id: 'ext-' + Date.now(), title: t.trim(), url: u.trim() });
        render();
        toast(isEn ? 'External link added!' : 'Pautan luar berjaya ditambah!');
      });
    });
  } else if (x = q('[data-del-ext]')) {
    const isEn = S.lang === 'en';
    S.extLinks.splice(+x.dataset.delExt, 1);
    render();
    toast(isEn ? 'External link deleted.' : 'Pautan luar dipadam.');
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
    const isEn = S.lang === 'en';
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
      toast(isEn
        ? (S.view === 'prev' ? 'Preview mode active' : S.view === 'nodes' ? 'Page Flow active' : 'Returned to previous view')
        : (S.view === 'prev' ? 'Pratonton aktif' : S.view === 'nodes' ? 'Aliran halaman aktif' : 'Kembali ke paparan asal'));
    } else if (v === 'plan') {
      workspaceReturnState = null;
      S.mode = 'v';
      S.view = 'plan';
      toast(isEn ? 'Design mode active' : 'Reka bentuk aktif');
    }
    render();
  } else if (x = q('[data-m]')) {
    workspaceReturnState = null;
    S.mode = x.dataset.m;
    S.view = 'plan';
    const isEn = S.lang === 'en';
    if (S.mode === 's') {
      toast(isEn ? 'Split view: canvas and code side-by-side' : 'Paparan Split: kanvas dan kod bersebelahan');
    } else if (S.mode === 'c') {
      toast(isEn ? 'Code editor opened' : 'Editor kod dibuka');
    } else if (S.mode === 'v') {
      toast(isEn ? 'Design canvas opened' : 'Kanvas reka bentuk dibuka');
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
        const tName = S.lang === 'en' ? (TY[b.type]?.en || TY[b.type]?.n || b.type) : (TY[b.type]?.n || b.type);
        toast(`Selected <${TY[b.type]?.tag || 'div'}> (${tName})`);
      }
    }
  } else if (x = q('[data-v]')) {
    S.view = x.dataset.v;
    render();
  } else if (x = q('[data-t]')) {
    const nextTab = x.dataset.t;
    const isEn = S.lang === 'en';
    if (nextTab === 'css') {
      const cssWasOff = !S.hasCss || !['ext', 'all'].includes(S.sty);
      S.hasCss = true;
      if (hasCodeHtmlOverride()) convertSourceCssMode('ext');
      else if (!Object.prototype.hasOwnProperty.call(pageCodeEdits(), 'css')) pageCodeEdits().css = '';
      S.sty = 'ext';
      S.sideTab = 'css';
      if (cssWasOff) toast(isEn ? 'style.css opened; CSS enabled in External mode.' : 'style.css dibuka; CSS dihidupkan dalam mod External.');
      else toast(isEn ? 'style.css opened.' : 'style.css dibuka.');
    } else if (nextTab === 'html') {
      S.sideTab = 'html';
    }
    S.tab = nextTab;
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
    const isEn = S.lang === 'en';
    const vpNames = isEn
      ? { mobile: 'Mobile (375 px)', tablet: 'Tablet (768 px)', desktop: 'Fit to available space' }
      : { mobile: 'Telefon (375 px)', tablet: 'Tablet (768 px)', desktop: 'Muat ikut ruang tersedia' };
    toast(`${isEn ? 'Preview' : 'Pratonton'}: ${vpNames[S.viewport]}`);
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
    if (sourceConverted) toast(S.lang === 'en' ? `Custom code styles converted to ${x.textContent} mode. Check HTML and CSS tabs.` : `Gaya kod bebas ditukar ke mod ${x.textContent}. Semak tab HTML dan CSS.`);
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
    $('#btn-toggle-hl').title = S.lang === 'en'
      ? (S.cssHighlight ? 'Code highlight enabled · click to disable' : 'Code highlight disabled · click to enable')
      : (S.cssHighlight ? 'Serlahan kod dihidupkan · klik untuk matikan' : 'Serlahan kod dimatikan · klik untuk hidupkan');
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
    const isEn = S.lang === 'en';
    b.dropdowns = b.dropdowns || {};
    snap();
    if (act === 'add') {
      let defSubs = isEn ? ['Official WhatsApp', 'Send Email', 'Location Map'] : ['WhatsApp Rasmi', 'Hantar Emel', 'Peta Lokasi'];
      if (/produk|servis|pilihan|service|product/i.test(curTitle)) defSubs = isEn ? ['Basic Plan', 'Premium Plan', 'Custom Plan'] : ['Pakej Asas', 'Pakej Premium', 'Pakej Khas'];
      else if (/tentang|about/i.test(curTitle)) defSubs = isEn ? ['About Us', 'Our Team', 'Vision & Mission'] : ['Latar Belakang', 'Pasukan Kami', 'Visi & Misi'];
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
    const isEn = S.lang === 'en';
    snap();
    if (act === 'fill') {
      const fillCycle = [0, 1, 2, 3, 4, 5, 'none'];
      const curIdx = fillCycle.indexOf(b.f);
      const nextIdx = (curIdx + 1) % fillCycle.length;
      b.f = fillCycle[nextIdx];
      const names = isEn
        ? ['White', 'Soft Blue', 'Gold Yellow', 'Dark Slate', 'Coral Orange', 'Mint Green', 'Transparent (None)']
        : ['Putih', 'Biru Lembut', 'Kuning Emas', 'Kelabu Gelap', 'Oren Coral', 'Hijau Mint', 'Lutsinar (None)'];
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
      toast(isEn ? `Font weight: ${b.fw >= 700 ? 'Bold' : 'Regular'}` : `Ketebalan teks: ${b.fw >= 700 ? 'Tebal' : 'Biasa'}`);
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
      const alignNames = isEn
        ? { left: 'Left', center: 'Center', right: 'Right' }
        : { left: 'Rata Kiri', center: 'Rata Tengah', right: 'Rata Kanan' };
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
      const names = isEn
        ? { none: 'None', sm: 'Soft', md: 'Medium', lg: 'Strong' }
        : { none: 'Tiada', sm: 'Lembut', md: 'Timbul', lg: 'Jelas' };
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
      b.items = b.items && b.items.length ? b.items : (isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
      toast(isEn ? 'Link converted to dropdown menu' : 'Pautan ditukar kepada menu dropdown');
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
    // Do not rebuild #src here; double-click needs to remain on the same DOM element.
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

// Keyboard Shortcuts
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

// Canva Bar Events (Google Fonts & Font Size Input)
const canvaBarEl = $('#canva-bar');
if (canvaBarEl) {
  canvaBarEl.addEventListener('change', e => {
    const b = get(S.sel);
    if (!b) return;
    if (e.target.id === 'canva-tag-sel') {
      snap();
      const isEn = S.lang === 'en';
      b.type = e.target.value;
      if (b.type === 'nav' && !b.t.includes(',')) {
        b.t = b.t.trim().split(/\s+/).join(', ');
      }
      if (b.type === 'button' && !b.href) {
        b.href = 'index.html';
      }
      if (b.type === 'link' && !b.href) b.href = '#';
      if (b.type === 'dropdown' && !b.items) b.items = isEn ? ['Option 1', 'Option 2', 'Option 3'] : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
      if (S.pages[S.curPage]) S.pages[S.curPage].blocks = S.blocks;
      render();
      toast(`Element converted to <${TY[b.type].tag}> (${isEn ? (TY[b.type].en || TY[b.type].n) : TY[b.type].n})`);
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
      toast(S.lang === 'en' ? `Font weight: ${e.target.selectedOptions[0].textContent}` : `Ketebalan teks: ${e.target.selectedOptions[0].textContent}`);
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

// App Boot & Initialization
load();
$('#nm').value = S.name;
render();


// 2D HSV color picker field utilities
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
  const isEn = S.lang === 'en';
  return `<div class="cpop-selector-wrap">
    <div class="cpop-sv-field" id="cpop-sv-field" role="slider" tabindex="0" aria-label="${isEn ? 'Select tone and brightness' : 'Pilih tona dan kecerahan'}" aria-valuetext="${hex}" style="--picker-hue:hsl(${Math.round(hsv.h)} 100% 50%)">
      <span class="cpop-selector-marker" style="left:${hsv.s * 100}%;top:${(1 - hsv.v) * 100}%"></span>
    </div>
    <label class="cpop-hue-control"><span>${isEn ? 'Color spectrum' : 'Spektrum warna'}</span><input type="range" id="cpop-hue-range" min="0" max="359" value="${Math.round(hsv.h)}" aria-label="${isEn ? 'Color spectrum' : 'Spektrum warna'}"></label>
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

// Smart Canva Color Popover Palette Management
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
  const isEn = S.lang === 'en';
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
  const labels = isEn
    ? { '#203a5b':'Navy', '#c4d7ed':'Soft blue', '#ffffff':'White', '#111827':'Charcoal', '#cfe0ff':'Light blue', '#ffd166':'Yellow', '#2b2f3a':'Dark charcoal', '#ff7a59':'Coral', '#b8f2c9':'Mint green', '#0b3d91':'Blue', '#06255c':'Dark navy', '#1e293b':'Slate', '#f1f5f9':'Light gray', '#fef08a':'Soft yellow', '#fecdd3':'Pink', '#ddd6fe':'Soft purple', '#e0e7ff':'Soft indigo' }
    : { '#203a5b':'Navy', '#c4d7ed':'Biru lembut', '#ffffff':'Putih', '#111827':'Arang', '#cfe0ff':'Biru muda', '#ffd166':'Kuning', '#2b2f3a':'Arang gelap', '#ff7a59':'Jingga', '#b8f2c9':'Hijau lembut', '#0b3d91':'Biru', '#06255c':'Navy gelap', '#1e293b':'Slate', '#f1f5f9':'Kelabu cerah', '#fef08a':'Kuning lembut', '#fecdd3':'Merah jambu', '#ddd6fe':'Ungu lembut', '#e0e7ff':'Indigo lembut' };
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
  const gradientColors = gradients.map((gradient, index) => `<button type="button" class="cpop-gradient-swatch${isGradient && currentCss === gradient ? ' active' : ''}" data-set-gradient="${qa(gradient)}" data-color-name="gradient ${index + 1}" style="background:${gradient}" aria-label="${isEn ? 'Gradient' : 'Gradien'} ${index + 1}" title="${isEn ? 'Gradient' : 'Gradien'} ${index + 1}"></button>`).join('');
  const customInputId = isText ? 'cpop-custom-input' : 'cpop-custom-fill-input';
  const customInputValue = /^#[\da-f]{6}$/i.test(curHex) ? curHex : '#ffffff';
  const closeButton = '<button type="button" class="color-popover-close" id="cpop-close" title="Close" aria-label="Close">✕</button>';

  pop.innerHTML = `
    <div class="color-popover-head"><b>${isEn ? 'Colors' : 'Warna'}</b>${closeButton}</div>
    <label class="cpop-search"><span aria-hidden="true">⌕</span><input type="search" id="cpop-search" placeholder="${isEn ? 'Search color or HEX code' : 'Cari warna atau kod HEX'}" autocomplete="off"></label>
    ${!isText ? `<div class="cpop-mode-tabs" role="tablist" aria-label="${isEn ? 'Color type' : 'Jenis warna'}"><button type="button" role="tab" data-cpop-mode="solid" aria-selected="${!isGradient}" class="${!isGradient ? 'active' : ''}">${isEn ? 'Solid color' : 'Warna padu'}</button><button type="button" role="tab" data-cpop-mode="gradient" aria-selected="${isGradient}" class="${isGradient ? 'active' : ''}">${isEn ? 'Gradient' : 'Gradien'}</button></div>` : ''}
    <div class="cpop-solid-panel" id="cpop-solid-panel"${isGradient ? ' hidden' : ''}>
      <div class="cpop-current-row">
        <span class="cpop-current-swatch${!isText && b.f === 'none' ? ' is-none' : ''}" style="${isText || b.f !== 'none' ? `--current-color:${curHex};background:${curHex}` : ''}" title="${curHex}"></span>
        <label class="cpop-hex-field"><small>${isEn ? 'HEX Code' : 'Kod HEX'}</small><input type="text" id="cpop-hex-input" value="${customInputValue}" maxlength="7" spellcheck="false" autocomplete="off"></label>
        <label class="cpop-picker-control" title="${isEn ? 'Color picker' : 'Pemilih warna'}"><input type="color" id="${customInputId}" value="${customInputValue}"><span>▧</span></label>
        <button type="button" class="cpop-eyedropper" data-cpop-eyedropper title="${isEn ? 'Pick color from screen' : 'Ambil warna dari skrin'}" aria-label="${isEn ? 'Pick color from screen' : 'Ambil warna dari skrin'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.2 6.1 3.7 3.7M5 19l4.8-1.2L19 8.6a2.1 2.1 0 0 0-3-3L6.8 14.8 5 19Z"/><path d="m4 20 3.3-.8"/></svg></button>
      </div>
      ${colorSelectorMarkup(customInputValue)}
      <section class="cpop-section"><div class="cpop-section-title">${isEn ? 'Document colors' : 'Warna dalam rekaan'}</div><div class="cpop-design-colors">${names || `<span class="cpop-empty">${isEn ? 'Selected colors will appear here' : 'Warna pilihan akan muncul di sini'}</span>`}</div></section>
      <section class="cpop-section"><div class="cpop-section-title">${isEn ? 'Theme colors' : 'Warna tema'}</div><div class="cpop-theme-row">${themes}${!isText ? `<button type="button" class="cpop-swatch is-none" data-set-fill="none" data-color-name="${isEn ? 'transparent' : 'lutsinar'}" aria-label="${isEn ? 'No color' : 'Tiada warna'}" title="${isEn ? 'No color' : 'Tiada warna'}"></button>` : ''}</div></section>
      <section class="cpop-section cpop-base-section"><div class="cpop-section-title">${isEn ? 'Default palette' : 'Warna pilihan'}</div><div class="color-popover-grid">${baseColors}</div></section>
    </div>
    ${!isText ? `<div class="cpop-gradient-panel"${isGradient ? '' : ' hidden'}><section class="cpop-section"><div class="cpop-section-title">${isEn ? 'Theme gradients' : 'Gradien tema'}</div><div class="cpop-gradient-grid">${gradientColors}</div></section><p class="cpop-gradient-hint">${isEn ? 'Pick a gradient to apply to the element background.' : 'Pilih gradien untuk guna pada latar elemen.'}</p></div>` : ''}
  `;
  pop.hidden = false;
  syncColorSelector(customInputValue);
}

function setColorPopoverMode(mode) {
  const solid = $('.cpop-solid-panel');
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
  if (preview) { preview.classList.add('is-none'); preview.style.background = ''; preview.title = S.lang === 'en' ? 'No color' : 'Tiada warna'; }
  document.querySelectorAll('[data-set-fill]').forEach(swatch => swatch.classList.toggle('active', swatch.dataset.setFill === 'none'));
}

// Close popover when clicking outside
document.addEventListener('pointerdown', e => {
  const pop = $('#color-popover');
  if (pop && !pop.hidden) {
    if (!pop.contains(e.target) && !e.target.closest('#canva-fill-btn') && !e.target.closest('#canva-col-btn')) {
      pop.hidden = true;
      curPopType = null;
    }
  }
});

// Dynamic custom color input: HEX and color picker stay in sync
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
// BUILT-IN APP DIALOG SYSTEM
// Replaces window.alert, window.confirm, window.prompt
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
  const isEn = S.lang === 'en';
  return new Promise(resolve => {
    showAppDialog({
      type: 'alert',
      title,
      msg,
      icon,
      confirmText: isEn ? 'Got It' : 'Faham',
      onResolve: () => resolve(true)
    });
  });
}

function appConfirm(msg, title = 'Confirmation', icon = '❓', isDanger = false, confirmText = 'Yes, Continue') {
  const isEn = S.lang === 'en';
  return new Promise(resolve => {
    showAppDialog({
      type: 'confirm',
      title,
      msg,
      icon,
      isDanger,
      confirmText,
      cancelText: isEn ? 'Cancel' : 'Batal',
      onResolve: val => resolve(val)
    });
  });
}

function appPrompt(msg, defaultValue = '', title = 'Enter Information', icon = '✏️', placeholder = '') {
  const isEn = S.lang === 'en';
  return new Promise(resolve => {
    showAppDialog({
      type: 'prompt',
      title,
      msg,
      icon,
      defaultValue,
      placeholder,
      confirmText: isEn ? 'Save' : 'Simpan',
      cancelText: isEn ? 'Cancel' : 'Batal',
      onResolve: val => resolve(val)
    });
  });
}

// Globally override browser dialog calls
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


// Live Code Editor Handlers
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
    // Tab & Shift+Tab indentation support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeTextarea.selectionStart;
      const end = codeTextarea.selectionEnd;
      const val = codeTextarea.value;

      if (e.shiftKey) {
        // Outdent (remove 2 spaces)
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        if (val.substring(lineStart, lineStart + 2) === '  ') {
          codeTextarea.value = val.substring(0, lineStart) + val.substring(lineStart + 2);
          codeTextarea.selectionStart = Math.max(lineStart, start - 2);
          codeTextarea.selectionEnd = Math.max(lineStart, end - 2);
          onEditorInput(true);
        }
      } else {
        // Indent (add 2 spaces)
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

// Double-click code line in View mode to jump directly into editing that line
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

  // Restore saved ratio for horizontal (desktop) and vertical (mobile)
  const savedRatio = parseFloat(localStorage.getItem('dw_split_ratio') || '50');
  if (savedRatio >= 20 && savedRatio <= 80) {
    stage.style.setProperty('--split-left', `${savedRatio}%`);
  } else {
    stage.style.setProperty('--split-left', '50%');
  }

  const savedTopRatio = parseFloat(localStorage.getItem('dw_split_top_ratio') || '50');
  if (savedTopRatio >= 20 && savedTopRatio <= 80) {
    stage.style.setProperty('--split-top', `${savedTopRatio}%`);
  } else {
    stage.style.setProperty('--split-top', '50%');
  }

  let isDragging = false;
  let isVertical = false;
  let startX = 0;
  let startY = 0;
  let startLeftWidth = 0;
  let startTopHeight = 0;
  let stageWidth = 0;
  let stageHeight = 0;

  gutter.addEventListener('pointerdown', e => {
    if (!stage.classList.contains('s')) return;
    isDragging = true;
    isVertical = window.innerWidth <= 768;
    gutter.classList.add('is-dragging');
    document.body.classList.add('is-resizing');
    if (isVertical) {
      document.body.classList.add('is-resizing-v');
    }
    try { gutter.setPointerCapture(e.pointerId); } catch (_) {}

    const stageRect = stage.getBoundingClientRect();
    const visRect = vis.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeftWidth = visRect.width;
    startTopHeight = visRect.height;
    stageWidth = stageRect.width;
    stageHeight = stageRect.height;
    e.preventDefault();
  });

  gutter.addEventListener('pointermove', e => {
    if (!isDragging) return;
    if (isVertical) {
      const dy = e.clientY - startY;
      const newHeight = startTopHeight + dy;
      const minTop = 150;
      const maxTop = Math.max(minTop + 40, stageHeight - 130);
      const clamped = Math.max(minTop, Math.min(maxTop, newHeight));
      const pct = ((clamped / stageHeight) * 100).toFixed(2);
      stage.style.setProperty('--split-top', `${pct}%`);
      localStorage.setItem('dw_split_top_ratio', pct);
    } else {
      const dx = e.clientX - startX;
      const newLeftWidth = startLeftWidth + dx;
      const minLeft = 260;
      const maxLeft = Math.max(minLeft + 40, stageWidth - 280);
      const clamped = Math.max(minLeft, Math.min(maxLeft, newLeftWidth));
      const pct = ((clamped / stageWidth) * 100).toFixed(2);
      stage.style.setProperty('--split-left', `${pct}%`);
      localStorage.setItem('dw_split_ratio', pct);
    }
  });

  const stopDrag = e => {
    if (!isDragging) return;
    isDragging = false;
    gutter.classList.remove('is-dragging');
    document.body.classList.remove('is-resizing');
    document.body.classList.remove('is-resizing-v');
    try { gutter.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  gutter.addEventListener('pointerup', stopDrag);
  gutter.addEventListener('pointercancel', stopDrag);

  gutter.addEventListener('dblclick', () => {
    if (window.innerWidth <= 768) {
      stage.style.setProperty('--split-top', '50%');
      localStorage.setItem('dw_split_top_ratio', '50');
      toast(S.lang === 'en' ? 'Mobile split view reset to 50:50' : 'Paparan split mobile ditetapkan semula ke 50:50');
    } else {
      stage.style.setProperty('--split-left', '50%');
      localStorage.setItem('dw_split_ratio', '50');
      toast(S.lang === 'en' ? 'Split view reset to 50:50 balance' : 'Paparan split ditetapkan semula ke 50:50');
    }
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
