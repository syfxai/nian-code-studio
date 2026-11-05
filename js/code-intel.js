/**
 * NIAN CODE STUDIO - Adobe Dreamweaver Code Intelligence & Predictive Autocomplete Engine (code-intel.js)
 * Provides real-time HTML5/CSS3/JS code anticipation, Emmet-style abbreviation expansion,
 * automatic closing tag detection, attribute suggestions, and Dreamweaver Quick Tag Insertion.
 */

const VOID_HTML_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const DW_HTML_SNIPPETS = [
  {
    trigger: '!html5',
    aliases: ['!', 'html:5', 'doctype'],
    label: '! (HTML5 Boilerplate)',
    tag: 'html',
    category: 'Emmet',
    snippet: '<!DOCTYPE html>\n<html>\n<head><title> $0Your Page Title</title></head>\n\n<body>\n \n  \n</body>\n</html>',
    descEn: 'Complete basic HTML document structure',
    descMs: 'Struktur asas dokumen HTML'
  },
  {
    trigger: 'header',
    label: '<header class="header">',
    tag: 'header',
    category: 'Semantic',
    snippet: '<header class="header">\n  <h1>$0Website Header</h1>\n</header>',
    descEn: 'Top page banner / site branding header',
    descMs: 'Kepala halaman / sepanduk penjenamaan atas'
  },
  {
    trigger: 'nav',
    aliases: ['navbar', 'nav>a*3'],
    label: '<nav class="nav">',
    tag: 'nav',
    category: 'Semantic',
    snippet: '<nav class="nav">\n  <a href="index.html">$0Home</a>\n  <a href="about.html">About</a>\n  <a href="contact.html">Contact</a>\n</nav>',
    descEn: 'W3C navigation bar with page links',
    descMs: 'Bar navigasi W3C bersama pautan halaman'
  },
  {
    trigger: 'main',
    label: '<main class="grid">',
    tag: 'main',
    category: 'Semantic',
    snippet: '<main class="grid">\n  $0\n</main>',
    descEn: 'Primary main content grid container',
    descMs: 'Bekas grid kandungan utama halaman'
  },
  {
    trigger: 'hero',
    aliases: ['section.hero'],
    label: '<section class="hero">',
    tag: 'section',
    category: 'Layout',
    snippet: '<section class="hero">\n  <h1>$0Welcome to Our Website</h1>\n  <p>Discover modern semantic web design with CSS Grid.</p>\n  <a href="about.html" class="btn-cta">Explore More</a>\n</section>',
    descEn: 'Hero spotlight banner with heading, text & CTA',
    descMs: 'Sepanduk utama Hero dengan tajuk, teks & butang'
  },
  {
    trigger: 'section',
    label: '<section class="section">',
    tag: 'section',
    category: 'Semantic',
    snippet: '<section class="section">\n  <h2>$0Section Heading</h2>\n  <p>Write your section content here.</p>\n</section>',
    descEn: 'Thematic content section with heading',
    descMs: 'Bahagian kandungan bertema dengan tajuk'
  },
  {
    trigger: 'article',
    aliases: ['card', 'article.card'],
    label: '<article class="card">',
    tag: 'article',
    category: 'Semantic',
    snippet: '<article class="card">\n  <h3>$0Card Title</h3>\n  <p>Brief card description and key details.</p>\n</article>',
    descEn: 'Self-contained article or feature card',
    descMs: 'Kad kandungan atau artikel kendiri'
  },
  {
    trigger: 'aside',
    label: '<aside class="aside">',
    tag: 'aside',
    category: 'Semantic',
    snippet: '<aside class="aside">\n  <h3>$0Sidebar Info</h3>\n  <p>Supplementary notes or quick links.</p>\n</aside>',
    descEn: 'Sidebar or supplementary callout panel',
    descMs: 'Panel sisi atau maklumat tambahan'
  },
  {
    trigger: 'form',
    label: '<form class="form">',
    tag: 'form',
    category: 'Form',
    snippet: '<form class="form" action="#" method="post">\n  <label for="name">Full Name</label>\n  <input type="text" id="name" name="name" placeholder="$0Enter your name" required>\n  <label for="email">Email Address</label>\n  <input type="email" id="email" name="email" placeholder="you@example.com" required>\n  <button type="submit" class="btn-cta">Send Message</button>\n</form>',
    descEn: 'Accessible contact form with labels & inputs',
    descMs: 'Borang hubungan mesra akses dengan label & input'
  },
  {
    trigger: 'footer',
    label: '<footer class="footer">',
    tag: 'footer',
    category: 'Semantic',
    snippet: '<footer class="footer">\n  <p>© 2026 $0All rights reserved.</p>\n</footer>',
    descEn: 'Bottom page footer for copyright & links',
    descMs: 'Pengaki halaman untuk hak cipta & pautan'
  },
  {
    trigger: 'figure',
    aliases: ['image'],
    label: '<figure class="image">',
    tag: 'figure',
    category: 'Media',
    snippet: '<figure class="image">\n  <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80" alt="$0Workspace">\n  <figcaption>Image caption</figcaption>\n</figure>',
    descEn: 'Semantic figure container with image & caption',
    descMs: 'Bekas imej semantik bersama kapsyen'
  },
  {
    trigger: 'img',
    label: '<img src="..." alt="...">',
    tag: 'img',
    category: 'Media',
    snippet: '<img src="$0https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80" alt="Description" loading="lazy">',
    descEn: 'Responsive image element with alt attribute',
    descMs: 'Elemen imej responsif dengan atribut alt'
  },
  {
    trigger: 'button',
    aliases: ['btn'],
    label: '<button type="button">',
    tag: 'button',
    category: 'Interactive',
    snippet: '<button type="button" class="btn-cta">$0Click Me</button>',
    descEn: 'Interactive action button',
    descMs: 'Butang tindakan interaktif'
  },
  {
    trigger: 'a',
    aliases: ['link'],
    label: '<a href="...">',
    tag: 'a',
    category: 'Interactive',
    snippet: '<a href="$0index.html" class="btn-cta">Learn More</a>',
    descEn: 'Hyperlink to another page or URL',
    descMs: 'Pautan hiper ke halaman atau URL lain'
  },
  {
    trigger: 'ul',
    aliases: ['ul>li*3'],
    label: '<ul><li>...</li></ul>',
    tag: 'ul',
    category: 'List',
    snippet: '<ul>\n  <li>$0First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>',
    descEn: 'Unordered bulleted list with 3 items',
    descMs: 'Senarai berbulet dengan 3 item'
  },
  {
    trigger: 'details',
    aliases: ['dropdown'],
    label: '<details class="nav-dropdown">',
    tag: 'details',
    category: 'Interactive',
    snippet: '<details class="nav-dropdown">\n  <summary>$0More Options ▾</summary>\n  <div class="dropdown-content">\n    <a href="about.html">Option 1</a>\n    <a href="contact.html">Option 2</a>\n  </div>\n</details>',
    descEn: 'Native HTML5 expandable accordion / dropdown',
    descMs: 'Menu dropdown / akordion asli HTML5'
  },
  {
    trigger: 'div',
    label: '<div class="box">',
    tag: 'div',
    category: 'Container',
    snippet: '<div class="box">\n  $0\n</div>',
    descEn: 'Generic layout division container',
    descMs: 'Bekas pembahagi susun atur umum'
  },
  {
    trigger: 'h1',
    label: '<h1>Heading 1</h1>',
    tag: 'h1',
    category: 'Typography',
    snippet: '<h1>$0Main Page Title</h1>',
    descEn: 'Top-level page heading (SEO primary title)',
    descMs: 'Tajuk utama halaman (aras 1)'
  },
  {
    trigger: 'h2',
    label: '<h2>Heading 2</h2>',
    tag: 'h2',
    category: 'Typography',
    snippet: '<h2>$0Section Heading</h2>',
    descEn: 'Section heading (level 2)',
    descMs: 'Tajuk bahagian (aras 2)'
  },
  {
    trigger: 'p',
    label: '<p>Paragraph</p>',
    tag: 'p',
    category: 'Typography',
    snippet: '<p>$0Write your paragraph text here.</p>',
    descEn: 'Body text paragraph element',
    descMs: 'Perenggan teks kandungan'
  },
  {
    trigger: 'input',
    label: '<input type="text">',
    tag: 'input',
    category: 'Form',
    snippet: '<input type="$0text" placeholder="Enter value">',
    descEn: 'Form text input field',
    descMs: 'Medan input teks borang'
  }
];

const DW_HTML_ATTRIBUTES = [
  { trigger: 'class', label: 'class="..."', snippet: 'class="$0"', descEn: 'CSS class selector name(s)', descMs: 'Nama kelas pemilih CSS' },
  { trigger: 'id', label: 'id="..."', snippet: 'id="$0"', descEn: 'Unique element identifier', descMs: 'ID unik elemen' },
  { trigger: 'href', label: 'href="index.html"', snippet: 'href="$0index.html"', descEn: 'Target page or URL link', descMs: 'Destinasi pautan halaman atau URL' },
  { trigger: 'src', label: 'src="https://..."', snippet: 'src="$0"', descEn: 'Image or media source URL', descMs: 'Sumber URL imej atau media' },
  { trigger: 'alt', label: 'alt="Description"', snippet: 'alt="$0Image description"', descEn: 'Accessible image description', descMs: 'Teks alternatif penerangan imej' },
  { trigger: 'style', label: 'style="..."', snippet: 'style="$0"', descEn: 'Inline CSS declarations', descMs: 'Gaya CSS sebaris (inline)' },
  { trigger: 'type', label: 'type="button"', snippet: 'type="$0button"', descEn: 'Button or input control type', descMs: 'Jenis kawalan butang atau input' },
  { trigger: 'placeholder', label: 'placeholder="..."', snippet: 'placeholder="$0Enter text..."', descEn: 'Input hint text', descMs: 'Teks pembayang medan input' },
  { trigger: 'target', label: 'target="_blank"', snippet: 'target="_blank" rel="noopener"', descEn: 'Open link in new tab safely', descMs: 'Buka pautan dalam tab baharu' }
];

const DW_CSS_SNIPPETS = [
  {
    trigger: 'display: grid',
    aliases: ['grid', 'd:g', 'grid12'],
    label: 'display: grid (12-Column Grid)',
    category: 'CSS Grid',
    snippet: 'display: grid;\n  grid-template-columns: repeat(12, 1fr);\n  gap: $016px;',
    descEn: '12-column responsive CSS Grid container',
    descMs: 'Bekas Grid CSS 12-lajur'
  },
  {
    trigger: 'grid-column',
    aliases: ['gc', 'span'],
    label: 'grid-column: 1 / span 12;',
    category: 'CSS Grid',
    snippet: 'grid-column: $01 / span 12;',
    descEn: 'Set start column and column span width',
    descMs: 'Tetapkan lajur mula dan lebar rentangan (span)'
  },
  {
    trigger: 'grid-row',
    aliases: ['gr'],
    label: 'grid-row: 1 / span 2;',
    category: 'CSS Grid',
    snippet: 'grid-row: $01 / span 2;',
    descEn: 'Set start row and vertical row span',
    descMs: 'Tetapkan baris mula dan rentangan menegak'
  },
  {
    trigger: 'display: flex',
    aliases: ['flex', 'd:f'],
    label: 'display: flex (Centered Row)',
    category: 'Flexbox',
    snippet: 'display: flex;\n  align-items: center;\n  justify-content: $0space-between;\n  gap: 12px;',
    descEn: 'Flexbox horizontal alignment layout',
    descMs: 'Susun atur baris fleksibel (Flexbox)'
  },
  {
    trigger: 'gap',
    label: 'gap: 16px;',
    category: 'Spacing',
    snippet: 'gap: $016px;',
    descEn: 'Space between grid or flex items',
    descMs: 'Jarak ruang antara item grid atau flex'
  },
  {
    trigger: 'padding',
    aliases: ['pad'],
    label: 'padding: 16px;',
    category: 'Box Model',
    snippet: 'padding: $016px;',
    descEn: 'Inner breathing space inside border',
    descMs: 'Ruang dalaman di dalam sempadan kotak'
  },
  {
    trigger: 'margin',
    label: 'margin: 0 auto;',
    category: 'Box Model',
    snippet: 'margin: $00 auto;',
    descEn: 'Outer space / horizontal centering',
    descMs: 'Ruang luaran / penjajaran tengah mendatar'
  },
  {
    trigger: 'background',
    aliases: ['bg', 'background-color'],
    label: 'background: var(--primary);',
    category: 'Color',
    snippet: 'background: $0var(--primary);',
    descEn: 'Element background color or gradient',
    descMs: 'Warna latar belakang atau gradien elemen'
  },
  {
    trigger: 'color',
    aliases: ['col'],
    label: 'color: var(--text);',
    category: 'Color',
    snippet: 'color: $0var(--text);',
    descEn: 'Text foreground color',
    descMs: 'Warna teks hadapan'
  },
  {
    trigger: 'border-radius',
    aliases: ['rad', 'radius'],
    label: 'border-radius: 8px;',
    category: 'Border',
    snippet: 'border-radius: $08px;',
    descEn: 'Rounded corner radius',
    descMs: 'Bucu bulat sempadan kotak'
  },
  {
    trigger: 'border',
    label: 'border: 1px solid #cbd5e1;',
    category: 'Border',
    snippet: 'border: $01px solid #cbd5e1;',
    descEn: 'Element border width, style, and color',
    descMs: 'Tebal, gaya, dan warna garisan sempadan'
  },
  {
    trigger: 'box-shadow',
    aliases: ['shadow', 'shd'],
    label: 'box-shadow: 0 8px 24px rgba(...);',
    category: 'Effects',
    snippet: 'box-shadow: $00 8px 24px rgba(15, 23, 42, 0.12);',
    descEn: 'Soft elevation drop shadow',
    descMs: 'Bayang timbul lembut pada kotak'
  },
  {
    trigger: 'font-size',
    aliases: ['fs'],
    label: 'font-size: 16px;',
    category: 'Typography',
    snippet: 'font-size: $016px;',
    descEn: 'Text font size',
    descMs: 'Saiz tulisan teks'
  },
  {
    trigger: 'font-weight',
    aliases: ['fw'],
    label: 'font-weight: 700;',
    category: 'Typography',
    snippet: 'font-weight: $0700;',
    descEn: 'Font boldness (400 normal, 700 bold)',
    descMs: 'Ketebalan huruf (400 biasa, 700 tebal)'
  },
  {
    trigger: 'text-align',
    aliases: ['ta'],
    label: 'text-align: center;',
    category: 'Typography',
    snippet: 'text-align: $0center;',
    descEn: 'Horizontal text alignment (left, center, right)',
    descMs: 'Penjajaran teks (left, center, right)'
  },
  {
    trigger: 'transition',
    label: 'transition: all 0.2s ease;',
    category: 'Animation',
    snippet: 'transition: $0all 0.2s ease;',
    descEn: 'Smooth CSS property animation',
    descMs: 'Animasi peralihan gaya CSS yang lancar'
  },
  {
    trigger: '@media',
    aliases: ['media', 'responsive'],
    label: '@media (max-width: 768px) { ... }',
    category: 'Responsive',
    snippet: '@media (max-width: 768px) {\n  .grid {\n    grid-template-columns: 1fr;\n  }\n  $0\n}',
    descEn: 'Responsive tablet & mobile breakpoint query',
    descMs: 'Peraturan responsif skrin tablet & telefon'
  }
];

const DW_JS_SNIPPETS = [
  {
    trigger: 'querySelector',
    aliases: ['qs', '$'],
    label: "document.querySelector('.selector')",
    category: 'DOM',
    snippet: "const el = document.querySelector('$0.hero');",
    descEn: 'Select first matching DOM element',
    descMs: 'Pilih elemen DOM pertama yang sepadan'
  },
  {
    trigger: 'addEventListener',
    aliases: ['on', 'click'],
    label: "addEventListener('click', ...)",
    category: 'Events',
    snippet: "document.querySelector('$0.btn-cta')?.addEventListener('click', (event) => {\n  event.preventDefault();\n  console.log('Button clicked!');\n});",
    descEn: 'Attach interactive click event listener',
    descMs: 'Pasang pendengar acara klik interaktif'
  },
  {
    trigger: 'classList.toggle',
    aliases: ['toggle'],
    label: "el.classList.toggle('active')",
    category: 'DOM',
    snippet: "element.classList.toggle('$0active');",
    descEn: 'Toggle a CSS class on an element',
    descMs: 'Togol kelas CSS pada elemen'
  },
  {
    trigger: 'console.log',
    aliases: ['log', 'clg'],
    label: "console.log(...)",
    category: 'Debug',
    snippet: "console.log('$0Debug:', value);",
    descEn: 'Print message to browser developer console',
    descMs: 'Cetak mesej ke konsol pembangun pelayar'
  },
  {
    trigger: 'DOMContentLoaded',
    aliases: ['ready', 'init'],
    label: "document.addEventListener('DOMContentLoaded', ...)",
    category: 'Lifecycle',
    snippet: "document.addEventListener('DOMContentLoaded', () => {\n  $0\n});",
    descEn: 'Run script after HTML document finishes loading',
    descMs: 'Jalankan skrip selepas dokumen HTML selesai dimuatkan'
  }
];

/**
 * Scans HTML text before cursorIndex and returns the most recent unclosed non-void HTML tag name.
 * @param {string} htmlBeforeCursor
 * @returns {string|null}
 */
function findUnclosedHtmlTag(htmlBeforeCursor) {
  if (!htmlBeforeCursor) return null;
  const cleaned = htmlBeforeCursor
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const stack = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?>/g;
  let match;
  while ((match = tagRegex.exec(cleaned)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    if (VOID_HTML_TAGS.has(tag) || /\/>$/.test(full)) continue;
    if (full.startsWith('</')) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === tag) {
          stack.splice(i, 1);
          break;
        }
      }
    } else {
      stack.push(tag);
    }
  }
  return stack.length ? stack[stack.length - 1] : null;
}

/**
 * Computes the open HTML tag hierarchy at cursorIndex for Dreamweaver status bar breadcrumbs.
 * @param {string} htmlCode
 * @param {number} cursorIndex
 * @returns {Array<string>}
 */
function getHtmlCursorTagChain(htmlCode, cursorIndex) {
  if (!htmlCode) return [];
  const slice = htmlCode.slice(0, Math.max(0, cursorIndex))
    .replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*?)>/g;
  let match;
  while ((match = tagRegex.exec(slice)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    if (VOID_HTML_TAGS.has(tag) || /\/>$/.test(full)) continue;
    if (full.startsWith('</')) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          stack.splice(i, 1);
          break;
        }
      }
    } else {
      const clsMatch = attrs.match(/\bclass\s*=\s*["']([^"']+)["']/i);
      const firstCls = clsMatch ? clsMatch[1].trim().split(/\s+/)[0] : '';
      stack.push({ tag, label: firstCls ? `${tag}.${firstCls}` : tag });
    }
  }
  return stack.map(item => item.label);
}

/**
 * Expands Emmet-like shorthand expressions such as `section.hero`, `article.card`, `ul>li*3`, `!`.
 * @param {string} abbr
 * @param {'html'|'css'|'js'} tab
 * @returns {{ snippet: string, label: string, category: string, descEn: string, descMs: string } | null}
 */
function expandEmmetAbbreviation(abbr, tab = 'html') {
  if (!abbr) return null;
  const raw = abbr.trim();
  if (tab === 'html') {
    if (raw === '!' || raw === 'html:5') {
      return DW_HTML_SNIPPETS[0];
    }
    // Tag with class/id e.g. section.hero, div#main, article.card-box, .hero-box
    const tagClassMatch = raw.match(/^([a-z][a-z0-9]*)?(?:\.([a-zA-Z0-9_-]+))(?:#([a-zA-Z0-9_-]+))?$/);
    if (tagClassMatch) {
      const tag = tagClassMatch[1] || 'div';
      const cls = tagClassMatch[2];
      const idAttr = tagClassMatch[3] ? ` id="${tagClassMatch[3]}"` : '';
      if (VOID_HTML_TAGS.has(tag)) {
        return {
          trigger: raw,
          label: `<${tag} class="${cls}">`,
          category: 'Emmet',
          snippet: `<${tag} class="${cls}"${idAttr} $0>`,
          descEn: `Expand Emmet shorthand to <${tag} class="${cls}">`,
          descMs: `Kembangkan singkatan Emmet kepada <${tag} class="${cls}">`
        };
      }
      return {
        trigger: raw,
        label: `<${tag} class="${cls}">...</${tag}>`,
        category: 'Emmet',
        snippet: `<${tag} class="${cls}"${idAttr}>\n  $0\n</${tag}>`,
        descEn: `Expand Emmet shorthand to <${tag} class="${cls}">`,
        descMs: `Kembangkan singkatan Emmet kepada <${tag} class="${cls}">`
      };
    }
    // Multiplier e.g. ul>li*3 or nav>a*4
    const multMatch = raw.match(/^([a-z][a-z0-9]*)>([a-z][a-z0-9]*)\*(\d+)$/i);
    if (multMatch) {
      const parent = multMatch[1].toLowerCase();
      const child = multMatch[2].toLowerCase();
      const count = Math.min(12, Math.max(1, parseInt(multMatch[3], 10)));
      const childrenLines = [];
      for (let i = 1; i <= count; i++) {
        const marker = i === 1 ? '$0' : '';
        if (child === 'a') {
          childrenLines.push(`  <a href="#">${marker}Link ${i}</a>`);
        } else {
          childrenLines.push(`  <${child}>${marker}Item ${i}</${child}>`);
        }
      }
      return {
        trigger: raw,
        label: `${parent} > ${count} × <${child}>`,
        category: 'Emmet',
        snippet: `<${parent}>\n${childrenLines.join('\n')}\n</${parent}>`,
        descEn: `Generate <${parent}> with ${count} <${child}> children`,
        descMs: `Jana <${parent}> bersama ${count} elemen anak <${child}>`
      };
    }
  }
  return null;
}

/**
 * Core predictive code intelligence engine.
 * Analyzes text before cursor and returns ranked suggestions with replacement ranges.
 * @param {string} code Full editor source text
 * @param {number} cursorIndex Current caret index (selectionStart)
 * @param {'html'|'css'|'js'} tab Active code tab
 * @param {'en'|'ms'} lang Interface language
 * @param {Array<string>} pageNames Available project HTML filenames
 * @returns {{ token: string, replaceStart: number, replaceEnd: number, items: Array<object> }}
 */
function getCodePredictions(code, cursorIndex, tab = 'html', lang = 'en', pageNames = ['index.html', 'about.html', 'contact.html']) {
  const safeCode = String(code || '');
  const caret = Math.max(0, Math.min(safeCode.length, Number(cursorIndex) || 0));
  const before = safeCode.slice(0, caret);
  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLineBefore = before.slice(lineStart);
  const isEn = lang !== 'ms';

  // Detect if user is inside <style>...</style> or <script>...</script> inside HTML tab
  let effectiveTab = tab;
  if (tab === 'html') {
    const lastStyleOpen = before.lastIndexOf('<style');
    const lastStyleClose = before.lastIndexOf('</style>');
    if (lastStyleOpen !== -1 && (lastStyleClose === -1 || lastStyleOpen > lastStyleClose)) {
      effectiveTab = 'css';
    } else {
      const lastScriptOpen = before.lastIndexOf('<script');
      const lastScriptClose = before.lastIndexOf('</script>');
      if (lastScriptOpen !== -1 && (lastScriptClose === -1 || lastScriptOpen > lastScriptClose)) {
        effectiveTab = 'js';
      }
    }
  }

  // 1. HTML Mode Predictions
  if (effectiveTab === 'html') {
    // 1a. Closing tag prediction when user types `</` or `</sec`
    const closeMatch = currentLineBefore.match(/<\/([a-zA-Z0-9-]*)$/);
    if (closeMatch) {
      const partialTag = closeMatch[1].toLowerCase();
      const replaceStart = caret - closeMatch[0].length;
      const unclosed = findUnclosedHtmlTag(before.slice(0, replaceStart));
      const candidates = [];
      if (unclosed && (!partialTag || unclosed.startsWith(partialTag))) {
        candidates.push({
          trigger: `</${unclosed}>`,
          label: `</${unclosed}>`,
          category: isEn ? 'Close Tag' : 'Tutup Tag',
          snippet: `</${unclosed}>$0`,
          desc: isEn ? `Close nearest open <${unclosed}> tag` : `Tutup tag <${unclosed}> yang masih terbuka`
        });
      }
      ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'div', 'form', 'figure', 'details', 'ul']
        .filter(t => t !== unclosed && (!partialTag || t.startsWith(partialTag)))
        .forEach(t => {
          candidates.push({
            trigger: `</${t}>`,
            label: `</${t}>`,
            category: isEn ? 'Close Tag' : 'Tutup Tag',
            snippet: `</${t}>$0`,
            desc: isEn ? `Closing </${t}> tag` : `Tag penutup </${t}>`
          });
        });
      return { token: closeMatch[0], replaceStart, replaceEnd: caret, items: candidates.slice(0, 7) };
    }

    // 1b. href="..." page filename prediction
    const hrefMatch = currentLineBefore.match(/\bhref\s*=\s*["']([^"']*)$/i);
    if (hrefMatch) {
      const partialUrl = hrefMatch[1].toLowerCase();
      const replaceStart = caret - hrefMatch[1].length;
      const items = pageNames
        .filter(p => !partialUrl || p.toLowerCase().includes(partialUrl))
        .map(p => ({
          trigger: p,
          label: p,
          category: isEn ? 'Project Page' : 'Halaman Projek',
          snippet: `${p}$0`,
          desc: isEn ? `Link to project page ${p}` : `Pautkan ke halaman projek ${p}`
        }));
      if ('#'.includes(partialUrl) || !partialUrl) {
        items.push({
          trigger: '#main',
          label: '#main (Anchor)',
          category: 'Anchor',
          snippet: '#main$0',
          desc: isEn ? 'Scroll to #main section on same page' : 'Lompat ke bahagian #main pada halaman sama'
        });
      }
      return { token: hrefMatch[1], replaceStart, replaceEnd: caret, items };
    }

    // 1c. Inside an opening HTML tag `<tag attr...` -> suggest HTML attributes
    const insideTagMatch = currentLineBefore.match(/<([a-zA-Z][a-zA-Z0-9-]*)\s+([^>]*)$/);
    if (insideTagMatch) {
      const attrTrail = insideTagMatch[2];
      // Only suggest attribute names if not currently inside quotes
      const quoteCount = (attrTrail.match(/["']/g) || []).length;
      if (quoteCount % 2 === 0) {
        const wordMatch = attrTrail.match(/([a-zA-Z-]+)$/);
        const token = wordMatch ? wordMatch[1].toLowerCase() : '';
        const replaceStart = caret - token.length;
        const items = DW_HTML_ATTRIBUTES
          .filter(a => !token || a.trigger.startsWith(token))
          .map(a => ({
            trigger: a.trigger,
            label: a.label,
            category: 'Attribute',
            snippet: a.snippet,
            desc: isEn ? a.descEn : a.descMs
          }));
        return { token, replaceStart, replaceEnd: caret, items: items.slice(0, 7) };
      }
    }

    // 1d. Opening tag `<` or `<sec` or Emmet shorthand `section.hero`, `!`, `ul>li*3`
    const openTagMatch = currentLineBefore.match(/(?:<([a-zA-Z0-9!_-]*)|([a-zA-Z!][a-zA-Z0-9._>*:-]*))$/);
    if (openTagMatch) {
      const hasAngleBracket = openTagMatch[0].startsWith('<');
      const rawToken = (hasAngleBracket ? openTagMatch[1] : openTagMatch[2]) || '';
      if (!hasAngleBracket && rawToken.length < 1) {
        return { token: '', replaceStart: caret, replaceEnd: caret, items: [] };
      }
      const lowerToken = rawToken.toLowerCase();
      const replaceStart = caret - openTagMatch[0].length;
      const items = [];

      // Check dynamic Emmet expansion first
      if (!hasAngleBracket) {
        const emmet = expandEmmetAbbreviation(rawToken, 'html');
        if (emmet) {
          items.push({
            trigger: rawToken,
            label: `⚡ ${emmet.label}`,
            category: 'Emmet',
            snippet: emmet.snippet,
            desc: isEn ? emmet.descEn : emmet.descMs
          });
        }
      }

      // Check unclosed tag suggestion if user just typed `<`
      if (hasAngleBracket && !lowerToken) {
        const unclosed = findUnclosedHtmlTag(before.slice(0, replaceStart));
        if (unclosed) {
          items.push({
            trigger: `</${unclosed}>`,
            label: `</${unclosed}> (Auto-Close)`,
            category: isEn ? 'Close Tag' : 'Tutup Tag',
            snippet: `</${unclosed}>$0`,
            desc: isEn ? `Close open <${unclosed}> element` : `Tutup elemen <${unclosed}> yang terbuka`
          });
        }
      }

      DW_HTML_SNIPPETS.forEach(s => {
        const matchesTrigger = !lowerToken || s.trigger.startsWith(lowerToken) || (s.tag && s.tag.startsWith(lowerToken));
        const matchesAlias = (s.aliases || []).some(al => al.toLowerCase().startsWith(lowerToken));
        if (matchesTrigger || matchesAlias) {
          items.push({
            trigger: s.trigger,
            label: s.label,
            category: s.category,
            snippet: s.snippet,
            desc: isEn ? s.descEn : s.descMs
          });
        }
      });

      return { token: openTagMatch[0], replaceStart, replaceEnd: caret, items: items.slice(0, 8) };
    }
  }

  // 2. CSS Mode Predictions
  if (effectiveTab === 'css') {
    // Check if typing a CSS property value after `:`
    const valMatch = currentLineBefore.match(/([a-z-]+)\s*:\s*([^;{}]*)$/i);
    if (valMatch) {
      const prop = valMatch[1].toLowerCase();
      const partialVal = valMatch[2].trim().toLowerCase();
      const replaceStart = caret - valMatch[2].length;
      const valueSuggestions = {
        display: ['grid;', 'flex;', 'block;', 'inline-block;', 'none;'],
        'justify-content': ['space-between;', 'center;', 'flex-start;', 'flex-end;', 'space-around;'],
        'align-items': ['center;', 'stretch;', 'flex-start;', 'flex-end;'],
        'text-align': ['center;', 'left;', 'right;', 'justify;'],
        position: ['relative;', 'absolute;', 'sticky;', 'fixed;'],
        color: ['var(--text);', 'var(--primary);', '#203a5b;', '#ffffff;', '#0f172a;'],
        background: ['var(--bg);', 'var(--primary);', '#ffffff;', 'linear-gradient(135deg, #203a5b 0%, #c4d7ed 100%);'],
        'background-color': ['var(--bg);', 'var(--primary);', '#ffffff;', '#f8fafc;'],
        'font-weight': ['700;', '600;', '500;', '400;'],
        'grid-template-columns': ['repeat(12, 1fr);', 'repeat(3, 1fr);', 'repeat(auto-fit, minmax(260px, 1fr));', '1fr;']
      };
      const vals = valueSuggestions[prop] || [];
      const items = vals
        .filter(v => !partialVal || v.toLowerCase().startsWith(partialVal))
        .map(v => ({
          trigger: v,
          label: v,
          category: prop,
          snippet: ` ${v}$0`,
          desc: isEn ? `CSS value for ${prop}` : `Nilai CSS untuk ${prop}`
        }));
      if (items.length) {
        return { token: valMatch[2], replaceStart, replaceEnd: caret, items };
      }
    }

    // CSS property or @media snippet prediction
    const propMatch = currentLineBefore.match(/([@a-zA-Z][a-zA-Z0-9:-]*)$/);
    if (propMatch) {
      const rawToken = propMatch[1].toLowerCase();
      const replaceStart = caret - propMatch[1].length;
      const items = DW_CSS_SNIPPETS
        .filter(s => s.trigger.startsWith(rawToken) || (s.aliases || []).some(a => a.startsWith(rawToken)))
        .map(s => ({
          trigger: s.trigger,
          label: s.label,
          category: s.category,
          snippet: s.snippet,
          desc: isEn ? s.descEn : s.descMs
        }));
      return { token: propMatch[1], replaceStart, replaceEnd: caret, items: items.slice(0, 8) };
    }
  }

  // 3. JavaScript Mode Predictions
  if (effectiveTab === 'js') {
    const jsMatch = currentLineBefore.match(/([a-zA-Z_$][a-zA-Z0-9_$.]*)$/);
    if (jsMatch) {
      const rawToken = jsMatch[1].toLowerCase();
      const replaceStart = caret - jsMatch[1].length;
      const items = DW_JS_SNIPPETS
        .filter(s => s.trigger.toLowerCase().includes(rawToken) || (s.aliases || []).some(a => a.toLowerCase().startsWith(rawToken)))
        .map(s => ({
          trigger: s.trigger,
          label: s.label,
          category: s.category,
          snippet: s.snippet,
          desc: isEn ? s.descEn : s.descMs
        }));
      return { token: jsMatch[1], replaceStart, replaceEnd: caret, items: items.slice(0, 7) };
    }
  }

  return { token: '', replaceStart: caret, replaceEnd: caret, items: [] };
}

/**
 * Applies a selected prediction item into the full code string, preserving line indentation
 * and resolving the `$0` caret position marker.
 * @param {string} code
 * @param {number} replaceStart
 * @param {number} replaceEnd
 * @param {string} snippet
 * @returns {{ text: string, cursor: number }}
 */
function applyCodeCompletion(code, replaceStart, replaceEnd, snippet) {
  const safeCode = String(code || '');
  const start = Math.max(0, Math.min(safeCode.length, replaceStart));
  const end = Math.max(start, Math.min(safeCode.length, replaceEnd));

  // Detect current line indentation so multi-line snippets align cleanly
  const lineStart = safeCode.lastIndexOf('\n', start - 1) + 1;
  const linePrefix = safeCode.slice(lineStart, start);
  const indentMatch = linePrefix.match(/^(\s*)/);
  const baseIndent = indentMatch ? indentMatch[1] : '';

  const rawLines = String(snippet || '').split('\n');
  const indentedSnippet = rawLines
    .map((line, idx) => (idx === 0 ? line : baseIndent + line))
    .join('\n');

  const markerIndex = indentedSnippet.indexOf('$0');
  const cleanSnippet = indentedSnippet.replace('$0', '');
  const nextText = safeCode.slice(0, start) + cleanSnippet + safeCode.slice(end);
  const nextCursor = start + (markerIndex >= 0 ? markerIndex : cleanSnippet.length);

  return { text: nextText, cursor: nextCursor };
}

/**
 * Formats HTML, CSS, or JS code cleanly for the Dreamweaver "Format Code" toolbar action.
 * @param {string} code
 * @param {'html'|'css'|'js'} tab
 * @returns {string}
 */
function formatStudioCode(code, tab = 'html') {
  if (!code || !code.trim()) return code;
  if (tab === 'css' && typeof formatCssStylesheet === 'function') {
    return formatCssStylesheet(code);
  }
  if (tab === 'html') {
    const rawLines = code
      .replace(/>\s*</g, '>\n<')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    let indent = 0;
    const formatted = [];
    rawLines.forEach(line => {
      const isClosing = /^<\/[a-zA-Z0-9-]+>/.test(line);
      if (isClosing) indent = Math.max(0, indent - 1);
      formatted.push('  '.repeat(indent) + line);
      const openMatch = line.match(/^<([a-zA-Z0-9-]+)\b[^>]*>$/);
      if (openMatch) {
        const tag = openMatch[1].toLowerCase();
        const hasClosingOnSameLine = new RegExp(`</${tag}>\\s*$`, 'i').test(line);
        if (!VOID_HTML_TAGS.has(tag) && !hasClosingOnSameLine && !/\/>$/.test(line)) {
          indent++;
        }
      }
    });
    return formatted.join('\n');
  }
  return code;
}

/**
 * Maps Quick Insert toolbar keys to both Studio Visual Canvas block types and Code Snippets.
 */
const DW_QUICK_INSERT_MAP = {
  header: { tab: 'html', canvasType: 'header', trigger: 'header', snippetTrigger: 'header', label: '<header>' },
  nav: { tab: 'html', canvasType: 'nav', trigger: 'nav', snippetTrigger: 'nav', label: '<nav>' },
  hero: { tab: 'html', canvasType: 'hero', trigger: 'hero', snippetTrigger: 'hero', label: '<section.hero>' },
  section: { tab: 'html', canvasType: 'section', trigger: 'section', snippetTrigger: 'section', label: '<section>' },
  article: { tab: 'html', canvasType: 'card', trigger: 'article', snippetTrigger: 'article', label: '<article.card>' },
  aside: { tab: 'html', canvasType: 'aside', trigger: 'aside', snippetTrigger: 'aside', label: '<aside>' },
  form: { tab: 'html', canvasType: 'form', trigger: 'form', snippetTrigger: 'form', label: '<form>' },
  figure: { tab: 'html', canvasType: 'image', trigger: 'figure', snippetTrigger: 'figure', label: '<figure>' },
  button: { tab: 'html', canvasType: 'button', trigger: 'button', snippetTrigger: 'button', label: '<button>' },
  a: { tab: 'html', canvasType: 'link', trigger: 'a', snippetTrigger: 'a', label: '<a href>' },
  details: { tab: 'html', canvasType: 'dropdown', trigger: 'details', snippetTrigger: 'details', label: '<details>' },
  footer: { tab: 'html', canvasType: 'footer', trigger: 'footer', snippetTrigger: 'footer', label: '<footer>' },
  'css-grid': { tab: 'css', trigger: 'display: grid', snippetTrigger: 'display: grid', label: '📐 Grid 12', ruleSelector: '.grid-custom' },
  'css-flex': { tab: 'css', trigger: 'display: flex', snippetTrigger: 'display: flex', label: '📦 Flexbox', ruleSelector: '.flex-row' },
  'css-media': { tab: 'css', trigger: '@media', snippetTrigger: '@media', label: '📱 @media' },
  'js-qs': { tab: 'js', trigger: 'querySelector', snippetTrigger: 'querySelector', label: '⚡ querySelector' },
  'js-event': { tab: 'js', trigger: 'addEventListener', snippetTrigger: 'addEventListener', label: '🖱️ addEventListener' }
};

/**
 * Determines the safest, smartest insertion range when a user clicks a Quick Insert button in Edit mode.
 * Prevents inserting HTML snippets before <!DOCTYPE html>, inside another tag's heading/attributes,
 * or outside <body>/<main> when clicking Quick Insert repeatedly.
 * @param {string} code
 * @param {number} caretStart
 * @param {number} caretEnd
 * @param {'html'|'css'|'js'} tab
 * @returns {{ start: number, end: number, prefix: string, suffix: string }}
 */
function findSmartInsertTarget(code, caretStart, caretEnd, tab = 'html') {
  const safeCode = String(code || '');
  const start = Math.max(0, Math.min(safeCode.length, Number(caretStart) || 0));
  const end = Math.max(start, Math.min(safeCode.length, Number(caretEnd) || start));

  const lineStart = safeCode.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const lineEndIdx = safeCode.indexOf('\n', start);
  const curLine = safeCode.slice(lineStart, lineEndIdx === -1 ? safeCode.length : lineEndIdx);
  const isBlankLine = curLine.trim().length === 0;

  if (tab === 'html') {
    const mainOpenMatch = safeCode.match(/<main\b[^>]*>/i);
    const mainCloseMatch = safeCode.match(/^[ \t]*<\/main\s*>/im) || safeCode.match(/<\/main\s*>/i);
    const bodyCloseMatch = safeCode.match(/^[ \t]*<\/body\s*>/im) || safeCode.match(/<\/body\s*>/i);

    const mainStartIdx = mainOpenMatch ? mainOpenMatch.index + mainOpenMatch[0].length : -1;
    const mainCloseIdx = mainCloseMatch ? mainCloseMatch.index : -1;
    const isInsideMain = mainStartIdx !== -1 && start >= mainStartIdx && (mainCloseIdx === -1 || start <= mainCloseIdx);

    // Only insert at raw caret if the user is on a blank line inside <main>;
    // otherwise insert cleanly right before </main> (or before <footer if present inside <main>)
    if (!isInsideMain || !isBlankLine) {
      const footerLineMatch = safeCode.match(/^[ \t]*<!--[^\n]*Footer[^\n]*-->\r?\n[ \t]*<footer\b/im)
        || safeCode.match(/^[ \t]*<footer\b/im);
      if (footerLineMatch && mainStartIdx !== -1 && footerLineMatch.index > mainStartIdx && (mainCloseIdx === -1 || footerLineMatch.index < mainCloseIdx)) {
        return { start: footerLineMatch.index, end: footerLineMatch.index, prefix: '    ', suffix: '\n' };
      }
      if (mainCloseIdx !== -1) {
        return { start: mainCloseIdx, end: mainCloseIdx, prefix: '    ', suffix: '\n' };
      }
      if (bodyCloseMatch) {
        return { start: bodyCloseMatch.index, end: bodyCloseMatch.index, prefix: '  ', suffix: '\n' };
      }
      return { start: safeCode.length, end: safeCode.length, prefix: '\n', suffix: '' };
    }
  } else if (tab === 'css' || tab === 'js') {
    if (!isBlankLine && safeCode.trim().length > 0) {
      return { start: safeCode.length, end: safeCode.length, prefix: '\n\n', suffix: '\n' };
    }
  }

  return { start, end, prefix: '', suffix: '' };
}



