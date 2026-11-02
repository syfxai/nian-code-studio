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
  for (const file of ['js/config.js', 'js/icons.js', 'js/state.js', 'js/generator.js']) {
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

test('Generator inner() produces valid W3C <form> fields and submit button', () => {
  const ctx = loadStudioContext();
  const formHtml = vm.runInContext(`
    const b = mk('form', 1, 5, 6, 4);
    inner(b);
  `, ctx);
  assert.match(formHtml, /<label for="field-\d+-1">Nama Penuh<\/label>/);
  assert.match(formHtml, /<input type="email" id="field-\d+-2"/);
  assert.match(formHtml, /<textarea id="field-\d+-3"/);
  assert.match(formHtml, /<button type="submit" class="btn-cta form-submit">Hantar Mesej<\/button>/);
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

