const fs = require('fs');
const vm = require('vm');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const studioCss = fs.readFileSync('css/studio.css', 'utf8');

const modularFiles = [
  'js/config.js',
  'js/icons.js',
  'js/state.js',
  'js/generator.js',
  'js/canvas.js',
  'js/inspector.js',
  'js/app.js'
];

let bundledJs = '';
modularFiles.forEach(f => {
  bundledJs += `\n/* === ${f} === */\n` + fs.readFileSync(f, 'utf8') + '\n';
});

// Inline CSS
let standaloneHtml = indexHtml.replace(
  '<link rel="stylesheet" href="css/studio.css">',
  () => `<style>\n${studioCss}\n</style>`
);

// Inline JS
const scriptTagsRegex = /<script src="js\/.*?"><\/script>(\s*<script src="js\/.*?"><\/script>)*/;
standaloneHtml = standaloneHtml.replace(
  scriptTagsRegex,
  () => `<script>\n${bundledJs}\n</script>`
);

// Inline Logo & Favicon as base64 data URI for 100% portable standalone distribution
if (fs.existsSync('assets/logo.png')) {
  const logoBase64 = `data:image/png;base64,${fs.readFileSync('assets/logo.png').toString('base64')}`;
  standaloneHtml = standaloneHtml.replace(/assets\/logo\.png/g, logoBase64);
  standaloneHtml = standaloneHtml.replace(/assets\/favicon\.png/g, logoBase64);
  standaloneHtml = standaloneHtml.replace(/assets\/favicon\.ico/g, logoBase64);
}

fs.writeFileSync('Blueprint Code Studio.html', standaloneHtml, 'utf8');
console.log('Blueprint Code Studio.html completely synchronized and updated!');

// Verify script syntax in standalone file
const pStart = standaloneHtml.indexOf('<script>');
const pEnd = standaloneHtml.lastIndexOf('</script>');
const scriptContent = standaloneHtml.substring(pStart + 8, pEnd);

try {
  new vm.Script(scriptContent, { filename: 'standalone_script.js' });
  console.log('Standalone script syntax: 100% VALID!');
} catch (e) {
  console.error('Syntax error:', e);
}
