import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadStudioContext() {
  const ctx = {
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      createElement: () => ({ click: () => {}, style: {} })
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {}
    },
    Blob,
    TextEncoder,
    Uint8Array,
    Uint32Array,
    DataView,
    console,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    RegExp,
    Date,
    setTimeout: () => 1,
    clearTimeout: () => {}
  };
  vm.createContext(ctx);
  for (const file of ['js/config.js', 'js/icons.js', 'js/state.js', 'js/generator.js', 'js/code-intel.js']) {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx;
}

test('TY includes <form> element with BM and EN labels and PNG icon mapping', () => {
  const ctx = loadStudioContext();
  const TY = vm.runInContext('TY', ctx);
  const PNG_ICON_MAP = vm.runInContext('PNG_ICON_MAP', ctx);
  assert.ok(TY.form, 'TY.form should exist');
  assert.equal(TY.form.tag, 'form');
  assert.equal(TY.form.n, 'Borang Hubungan');
  assert.equal(TY.form.en, 'Contact Form');
  assert.equal(PNG_ICON_MAP.form, 'assets/icons/elem-form.png');
});

test('Generator inner() produces valid W3C <form> fields and submit button in English default and BM', () => {
  const ctx = loadStudioContext();
  const formHtmlEn = vm.runInContext(`
    const bEn = mk('form', 1, 5, 6, 4);
    inner(bEn);
  `, ctx);
  assert.match(formHtmlEn, /<label for="field-\d+-1">Full Name<\/label>/);
  assert.match(formHtmlEn, /<input type="email" id="field-\d+-2"/);
  assert.match(formHtmlEn, /<textarea id="field-\d+-3"/);
  assert.match(formHtmlEn, /<button type="submit" class="btn-cta form-submit">Send Message<\/button>/);

  const formHtmlMs = vm.runInContext(`
    S.lang = 'ms';
    const bMs = mk('form', 1, 5, 6, 4);
    inner(bMs);
  `, ctx);
  assert.match(formHtmlMs, /<label for="field-\d+-1">Nama Penuh<\/label>/);
  assert.match(formHtmlMs, /<button type="submit" class="btn-cta form-submit">Hantar Mesej<\/button>/);
});

test('syncLanguageDefaults translates unmodified default page titles and block texts between EN and BM', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    S.pages = JSON.parse(JSON.stringify(DEFAULT_PAGES));
    S.blocks = [mk('section', 1, 1, 6, 3)];
    S.pages['index.html'].blocks = S.blocks;
    syncLanguageDefaults('ms');
    const msPageName = S.pages['index.html'].name;
    const msHeading = S.blocks[0].t;
    syncLanguageDefaults('en');
    const enPageName = S.pages['index.html'].name;
    const enHeading = S.blocks[0].t;
    ({ msPageName, msHeading, enPageName, enHeading, defaultMode: S.mode, defaultLang: S.lang });
  `, ctx);
  assert.equal(res.defaultLang, 'en');
  assert.equal(res.defaultMode, 's');
  assert.equal(res.msPageName, 'Utama (index.html)');
  assert.equal(res.msHeading, 'Tajuk bahagian');
  assert.equal(res.enPageName, 'Home (index.html)');
  assert.equal(res.enHeading, 'Section Heading');
});

test('createZipArchive builds a valid PKZIP binary with all project files', () => {
  const ctx = loadStudioContext();
  const zipBytes = vm.runInContext(`
    createZipArchive([
      { name: 'index.html', content: '<!DOCTYPE html><html></html>' },
      { name: 'about.html', content: '<!DOCTYPE html><html></html>' },
      { name: 'contact.html', content: '<!DOCTYPE html><html></html>' },
      { name: 'style.css', content: 'body { margin: 0; }' },
      { name: 'script.js', content: 'console.log("ok");' }
    ])
  `, ctx);
  assert.ok(zipBytes instanceof Uint8Array);
  assert.ok(zipBytes.length > 200);
  // Check PK\x03\x04 local file header signature at start
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  // Check PK\x05\x06 End of Central Directory signature at the last 22 bytes
  const eocdOffset = zipBytes.byteLength - 22;
  assert.equal(view.getUint32(eocdOffset, true), 0x06054b50);
  // Total entries in EOCD should be 5
  assert.equal(view.getUint16(eocdOffset + 8, true), 5);
  assert.equal(view.getUint16(eocdOffset + 10, true), 5);
});

test('splitCssDeclarations and formatCssStylesheet handle rgb() parentheses and multi-line formatting cleanly', () => {
  const appCode = fs.readFileSync('js/app.js', 'utf8');
  const splitFnMatch = appCode.match(/function splitCssDeclarations[\s\S]*?function stripLegacyInlineClasses/);
  assert.ok(splitFnMatch, 'CSS helper functions should exist in js/app.js');
  const ctx = { Object, Array, String, RegExp };
  vm.createContext(ctx);
  vm.runInContext(splitFnMatch[0].replace(/function stripLegacyInlineClasses$/, ''), ctx);

  const decls = vm.runInContext(
    `splitCssDeclarations("display: inline-block; width: 280px; border: 1px solid rgb(221, 221, 221); flex: 1 1 0%;")`,
    ctx
  );
  assert.equal(decls.length, 4);
  assert.equal(decls[2].prop, 'border');
  assert.equal(decls[2].value, '1px solid rgb(221, 221, 221)');

  const formatted = vm.runInContext(
    `formatCssStylesheet("body { margin: 0px; background-color: rgb(247, 247, 247); } .card { width: 280px; padding: 15px; }")`,
    ctx
  );
  assert.match(formatted, /body \{\n  margin: 0px;\n  background-color: rgb\(247, 247, 247\);\n\}/);
  assert.match(formatted, /\.card \{\n  width: 280px;\n  padding: 15px;\n\}/);
});

test('Undo and Redo are isolated per page and restore custom code overrides and theme settings', () => {
  const ctx = loadStudioContext();
  ctx.render = () => {};
  ctx.toast = () => {};
  const res = vm.runInContext(`
    S.pages = JSON.parse(JSON.stringify(DEFAULT_PAGES));
    S.curPage = 'index.html';
    syncCurPage();
    const origIndexCount = S.blocks.length;

    // Modify index.html
    snap();
    S.blocks.push(mk('card', 1, 13, 4, 3));
    S.pages['index.html'].blocks = S.blocks;
    const afterAddIndexCount = S.blocks.length;

    // Switch to about.html and press Undo -> should NOT affect about.html
    S.curPage = 'about.html';
    syncCurPage();
    const origAboutCount = S.blocks.length;
    undo();
    const afterUndoOnAboutCount = S.blocks.length;

    // Switch back to index.html and press Undo -> should revert index.html
    S.curPage = 'index.html';
    syncCurPage();
    undo();
    const revertedIndexCount = S.blocks.length;
    redo();
    const redoneIndexCount = S.blocks.length;

    // Test custom code override snapshot & undo
    S.codeEdits = { 'index.html': { html: '<h1>Custom</h1>' } };
    snap();
    delete S.codeEdits['index.html'];
    undo();
    const restoredCodeHtml = S.codeEdits['index.html'] && S.codeEdits['index.html'].html;

    ({
      origIndexCount,
      afterAddIndexCount,
      origAboutCount,
      afterUndoOnAboutCount,
      revertedIndexCount,
      redoneIndexCount,
      restoredCodeHtml
    });
  `, ctx);

  assert.equal(res.afterAddIndexCount, res.origIndexCount + 1);
  assert.equal(res.afterUndoOnAboutCount, res.origAboutCount, 'about.html must not be overwritten by index.html undo');
  assert.equal(res.revertedIndexCount, res.origIndexCount, 'index.html should revert its added block');
  assert.equal(res.redoneIndexCount, res.origIndexCount + 1, 'index.html should redo its added block');
  assert.equal(res.restoredCodeHtml, '<h1>Custom</h1>', 'Undo should restore discarded custom code override');
});

test('safeCssUrl and qa sanitize quotes and parentheses in image and background URLs', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    const imgBlock = mk('image', 1, 1, 4, 3);
    imgBlock.imgUrl = 'https://example.com/pic"quote.jpg';
    const htmlOut = inner(imgBlock);

    const heroBlock = mk('hero', 1, 1, 12, 4);
    heroBlock.bgImg = "https://example.com/bg'(1).jpg";
    S.blocks = [heroBlock];
    const cssOut = getCssRules().map(l => l.s).join('\\n');
    ({ htmlOut, cssOut });
  `, ctx);
  assert.match(res.htmlOut, /src="https:\/\/example\.com\/pic&quot;quote\.jpg"/);
  assert.match(res.cssOut, /background-image: url\('https:\/\/example\.com\/bg\\'\\\(1\\\)_?\.jpg'\)|background-image: url\('https:\/\/example\.com\/bg\\'\\\(1\\\)\.jpg'\)/);
});

test('Dreamweaver Predictive Code Intelligence anticipates HTML tags, closing tags, Emmet shorthands, and CSS rules', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    // 1. Typing '<sec' in HTML mode anticipates <section>
    const htmlPred = getCodePredictions('<main>\\n  <sec', 13, 'html', 'en');

    // 2. Typing '</' inside unclosed <main><section class="hero"> anticipates </section> first
    const closePred = getCodePredictions('<main><section class="hero"><h1>Hi</h1></', 41, 'html', 'en');

    // 3. Emmet abbreviation expansion 'article.feature-card'
    const emmetPred = expandEmmetAbbreviation('article.feature-card', 'html');

    // 4. Applying completion preserves line indentation and resolves $0 cursor marker
    const applied = applyCodeCompletion('<main>\\n  <sec\\n</main>', 9, 13, '<section class="section">\\n  <h2>$0Section Heading</h2>\\n</section>');

    // 5. CSS property prediction when typing 'grid'
    const cssPred = getCodePredictions('.main {\\n  grid', 14, 'css', 'ms');

    // 6. Cursor HTML tag chain for status bar breadcrumbs
    const tagChain = getHtmlCursorTagChain('<body><main class="grid"><article class="card"><h3>Title', 56);

    // 7. Smart Quick Insert target places HTML snippet inside <main> before </main> instead of index 0
    const sampleDoc = '<!DOCTYPE html>\\n<html>\\n<body>\\n  <main>\\n    <header class="header"><h1>Logo</h1></header>\\n  </main>\\n</body>\\n</html>';
    const smartTarget = findSmartInsertTarget(sampleDoc, 0, 0, 'html');
    const insertedDoc = applyCodeCompletion(sampleDoc, smartTarget.start, smartTarget.end, (smartTarget.prefix || '') + '<section class="section">\\n  <h2>$0Title</h2>\\n</section>');
    const quickKeys = Object.keys(DW_QUICK_INSERT_MAP);

    ({ htmlPred, closePred, emmetPred, applied, cssPred, tagChain, insertedDoc, quickKeys });
  `, ctx);

  assert.ok(res.htmlPred.items.some(i => i.trigger === 'section'), 'Should suggest <section> when typing <sec');
  assert.equal(res.closePred.items[0].trigger, '</section>', 'Should suggest closing the nearest open <section> tag first');
  assert.match(res.emmetPred.snippet, /<article class="feature-card">/);
  assert.match(res.applied.text, /<main>\n  <section class="section">\n    <h2>Section Heading<\/h2>\n  <\/section>\n<\/main>/);
  assert.ok(res.cssPred.items.some(i => i.trigger === 'display: grid'), 'Should suggest CSS Grid snippet');
  assert.deepEqual(Array.from(res.tagChain), ['body', 'main.grid', 'article.card', 'h3']);
  assert.ok(res.insertedDoc.text.indexOf('<section class="section">') > res.insertedDoc.text.indexOf('<header class="header">'), 'Quick Insert at caret 0 must insert inside <main> after existing children');
  assert.ok(res.insertedDoc.text.indexOf('<section class="section">') < res.insertedDoc.text.indexOf('</main>'), 'Quick Insert at caret 0 must insert before </main>');
  assert.equal(res.quickKeys.length, 17, 'DW_QUICK_INSERT_MAP should define all 17 Quick Insert items');
});

test('htmlLines() always includes mandatory basic HTML skeleton on empty canvas and generates clean HTML when visual blocks are drawn', () => {
  const ctx = loadStudioContext();
  ctx.render = () => {};
  ctx.toast = () => {};
  const res = vm.runInContext(`
    S.pages = JSON.parse(JSON.stringify(DEFAULT_PAGES));
    S.curPage = 'index.html';
    syncCurPage();
    clearCanvas();
    const emptyHtml = htmlLines().map(l => l.s).join('\\n');

    // Draw a visual Header block on the canvas
    S.blocks.push(mk('header', 1, 1, 12, 1));
    const drawnHtml = htmlLines().map(l => l.s).join('\\n');
    ({ emptyHtml, drawnHtml });
  `, ctx);

  const expectedEmpty = [
    '<!DOCTYPE html>',
    '<html>',
    '<head><title> Your Page Title</title></head>',
    '',
    '<body>',
    ' ',
    '  ',
    '</body>',
    '</html>'
  ].join('\n');

  assert.equal(res.emptyHtml, expectedEmpty, 'Empty canvas must output the exact mandatory basic HTML skeleton');
  assert.match(res.drawnHtml, /^<!DOCTYPE html>\n<html>\n<head>\n  <title> Your Page Title<\/title>/);
  assert.match(res.drawnHtml, /<body>\n  <main>\n    <header class="header">\n      <h1>Site Name<\/h1>\n    <\/header>\n  <\/main>/);
  assert.doesNotMatch(res.drawnHtml, /fonts\.googleapis\.com/, 'Student HTML view should not be cluttered with Google Fonts links');
});

test('sanitizePageBlocks and generators safely handle legacy or unknown block types without throwing on T.tag', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    S.pages['index.html'].blocks = [
      { id: '1', type: 'box', c: 1, r: 1, w: 12, h: 2, t: 'Legacy Box', f: 0 },
      { id: '2', type: 'heading', c: 1, r: 3, w: 12, h: 1, t: 'Legacy Heading', f: 0 },
      { id: '3', type: 'unknown_widget', c: 1, r: 4, w: 6, h: 2, t: 'Mystery Block', f: 0 },
      { id: '4', type: undefined, c: 7, r: 4, w: 6, h: 2, t: null, f: 0 }
    ];
    syncCurPage();
    sorted();
    const types = Array.from(S.blocks.map(b => b.type));
    const htmlOut = htmlLines().map(l => l.s).join('\\n');
    const cssOut = css().map(l => l.s).join('\\n');
    ({ types, htmlOut, cssOut });
  `, ctx);

  assert.deepEqual(res.types, ['section', 'header', 'text', 'text']);
  assert.match(res.htmlOut, /<section class="section">/);
  assert.match(res.htmlOut, /<header class="header">/);
  assert.match(res.cssOut, /\.section \{/);
});

test('splitNavItems splits emoji-prefixed phrases and inner() supports per-item navHrefs and navCtas', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    const parts = Array.from(splitNavItems('🏠 Laman Utama 📞 Hubungi'));
    const navBlk = mk('nav', 1, 1, 12, 1);
    navBlk.t = '🏠 Laman Utama 📞 Hubungi';
    navBlk.navHrefs = { '🏠 Laman Utama': 'index.html', '📞 Hubungi': 'contact.html' };
    navBlk.navCtas = { '🏠 Laman Utama': false, '📞 Hubungi': true };
    const navHtml = inner(navBlk);
    ({ parts, navHtml });
  `, ctx);

  assert.deepEqual(res.parts, ['🏠 Laman Utama', '📞 Hubungi']);
  assert.match(res.navHtml, /<a href="index\.html">🏠 Laman Utama<\/a>/);
  assert.match(res.navHtml, /<a href="contact\.html" class="btn-cta">📞 Hubungi<\/a>/);
});

test('parseBlockInlineItems and serializeBlockInlineItems support per-item link, button, color, and font styling on any block', () => {
  const ctx = loadStudioContext();
  const res = vm.runInContext(`
    const secBlk = mk('section', 1, 1, 12, 1);
    secBlk.t = '🏠 Laman Utama 📞 Hubungi Kami';
    const items = parseBlockInlineItems(secBlk);
    items[0].isLink = true;
    items[0].href = 'index.html';
    items[0].color = '#2563eb';
    items[1].isLink = true;
    items[1].isBtn = true;
    items[1].href = 'contact.html';
    items[1].bg = '#16a34a';
    secBlk.t = serializeBlockInlineItems(items);
    const outHtml = inner(secBlk);
    ({ count: items.length, firstText: items[0].text, secondText: items[1].text, outHtml });
  `, ctx);

  assert.equal(res.count, 2);
  assert.equal(res.firstText, '🏠 Laman Utama');
  assert.equal(res.secondText, '📞 Hubungi Kami');
  assert.match(res.outHtml, /<a href="index\.html"[^>]*>🏠 Laman Utama<\/a>/);
  assert.match(res.outHtml, /<a href="contact\.html"[^>]*>📞 Hubungi Kami<\/a>/);
});
