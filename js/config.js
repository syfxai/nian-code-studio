/**
 * NIAN CODE STUDIO - Configuration & Constants (config.js)
 * Stores W3C standard elements, pre-built layout templates, color palettes, and AI Tutor knowledge base.
 */

const $ = s => document.querySelector(s);
let R = 12;
function getAutoRows() {
  if (typeof S === 'undefined' || !S || !S.blocks || !S.blocks.length) return 12;
  const maxRow = Math.max(...S.blocks.map(b => (b.r || 1) + (b.h || 1) - 1), 0);
  return Math.max(12, maxRow + 3);
}
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const qa = s => esc(s).replace(/"/g, '&quot;');

const FILLS = ['#ffffff', '#cfe0ff', '#ffd166', '#2b2f3a', '#ff7a59', '#b8f2c9'];

const TEXT_COLORS = ['#ffffff', '#111827', '#00d4ff', '#ffd166', '#ff7a59', '#10b981', '#a855f7'];

const GOOGLE_FONTS = [
  { id: 'Inter', name: 'Inter', fam: "'Inter', sans-serif" },
  { id: 'Roboto', name: 'Roboto', fam: "'Roboto', sans-serif" },
  { id: 'Lato', name: 'Lato', fam: "'Lato', sans-serif" },
  { id: 'Source Sans 3', name: 'Source Sans 3', fam: "'Source Sans 3', sans-serif" },
  { id: 'IBM Plex Sans', name: 'IBM Plex Sans', fam: "'IBM Plex Sans', sans-serif" },
  { id: 'Merriweather', name: 'Merriweather', fam: "'Merriweather', serif" },
  { id: 'Lora', name: 'Lora', fam: "'Lora', serif" },
  { id: 'Playfair Display', name: 'Playfair Display', fam: "'Playfair Display', serif" },
  { id: 'JetBrains Mono', name: 'JetBrains Mono', fam: "'JetBrains Mono', monospace" }
];

function isColorDark(hex) {
  if (!hex || hex === 'transparent' || hex === 'none') return false;
  if (hex === '#2b2f3a' || hex === '#111827' || hex === '#06255c' || hex === '#082f73' || hex === '#000000') return true;
  if (typeof hex === 'string' && hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 135;
  }
  return false;
}

function getPatternCss(name) {
  if (name === 'pattern-blueprint') {
    return {
      image: 'linear-gradient(rgba(0,212,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.18) 1px, transparent 1px)',
      size: '20px 20px',
      repeat: 'repeat'
    };
  } else if (name === 'pattern-dots') {
    return {
      image: 'radial-gradient(rgba(0,212,255,0.35) 1.5px, transparent 1.5px)',
      size: '16px 16px',
      repeat: 'repeat'
    };
  } else if (name === 'pattern-stripes') {
    return {
      image: 'repeating-linear-gradient(45deg, rgba(0,212,255,0.12), rgba(0,212,255,0.12) 8px, transparent 8px, transparent 16px)',
      size: 'auto',
      repeat: 'repeat'
    };
  } else if (name === 'pattern-mesh') {
    return {
      image: 'radial-gradient(at 0% 0%, rgba(0,212,255,0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168,85,247,0.25) 0px, transparent 50%)',
      size: '100% 100%',
      repeat: 'no-repeat'
    };
  }
  return { image: 'none', size: 'auto', repeat: 'no-repeat' };
}

const TY = {
  header: { tag: 'header', n: 'Pengepala', en: 'Header', w: 12, h: 1, f: 0, t: 'Nama laman', y: 'Bahagian paling atas laman untuk nama atau logo.' },
  nav: { tag: 'nav', n: 'Navigasi', en: 'Navigation', w: 12, h: 1, f: 0, t: 'Utama, Tentang, Hubungi', y: 'Bar menu yang mengandungi pautan ke halaman lain.' },
  hero: { tag: 'section', n: 'Bahagian Utama', en: 'Hero Section', w: 12, h: 5, f: 1, t: 'Tajuk utama yang menarik perhatian', y: 'Bahagian besar yang biasanya mula-mula dilihat pelawat.' },
  section: { tag: 'section', n: 'Bahagian', en: 'Section', w: 6, h: 3, f: 1, t: 'Tajuk bahagian', y: 'Kumpulan kandungan yang berkaitan.' },
  card: { tag: 'article', n: 'Kad', en: 'Card', w: 4, h: 3, f: 1, t: 'Tajuk kad', y: 'Kotak ringkas untuk maklumat, servis atau produk.' },
  image: { tag: 'figure', n: 'Imej', en: 'Image', w: 4, h: 3, f: 1, t: 'Penerangan imej', y: 'Imej dengan ruang untuk penerangan ringkas.' },
  text: { tag: 'div', n: 'Teks', en: 'Text', w: 6, h: 2, f: 0, t: 'Tulis teks di sini', y: 'Ruang untuk perenggan atau maklumat.' },
  link: { tag: 'a', n: 'Pautan', en: 'Link', w: 3, h: 1, f: 'none', t: 'Teks pautan', y: 'Pautan biasa untuk membawa pelawat ke halaman lain atau alamat web.' },
  button: { tag: 'a', n: 'Butang CTA', en: 'CTA Button', w: 3, h: 1, f: 2, t: 'Mula sekarang', y: 'Butang ajakan seperti Mula, Daftar atau Hubungi.' },
  dropdown: { tag: 'details', n: 'Menu Dropdown', en: 'Dropdown Menu', w: 4, h: 2, f: 2, t: 'Pilih menu ▾', y: 'Menu yang dibuka untuk menunjukkan beberapa pilihan.' },
  form: { tag: 'form', n: 'Borang Hubungan', en: 'Contact Form', w: 6, h: 4, f: 0, t: 'Nama Penuh, Alamat Emel, Mesej Anda', y: 'Borang input interaktif untuk pelawat menghantar maklumat atau pertanyaan.' },
  aside: { tag: 'aside', n: 'Ruang Sisi', en: 'Sidebar Aside', w: 3, h: 6, f: 1, t: 'Maklumat sampingan', y: 'Ruang untuk maklumat tambahan di sisi kandungan.' },
  footer: { tag: 'footer', n: 'Pengaki', en: 'Footer', w: 12, h: 1, f: 0, t: 'Hak cipta © 2026', y: 'Bahagian paling bawah untuk hak cipta atau maklumat hubungan.' },
  logo: { tag: 'a', n: 'Logo', en: 'Logo', w: 2, h: 1, f: 0, t: 'Logo', y: 'Logo yang biasanya membawa pelawat kembali ke halaman utama.' },
  slider: { tag: 'div', n: 'Slider Imej', en: 'Image Slider', w: 12, h: 4, f: 1, t: 'Slider imej', y: 'Paparan beberapa imej secara bergilir.' }
};

const TP = [
  ['Laman Utama (Home)', [['header',1,1,12,1],['logo',1,1,2,1],['nav',4,1,6,1],['button',11,1,2,1],['hero',1,2,12,5],['text',2,3,6,2],['button',2,6,3,1],['image',8,3,4,3],['card',1,7,4,5],['card',5,7,4,5],['card',9,7,4,5],['footer',1,12,12,1]]],
  ['Hero + Imej (Bersebelahan)', [['header',1,1,12,1],['logo',1,1,2,1],['nav',4,1,6,1],['hero',1,2,12,6],['text',2,3,5,3],['button',2,6,3,1],['image',7,3,5,4],['card',1,8,4,4],['card',5,8,4,4],['card',9,8,4,4],['footer',1,12,12,1]]],
  ['Hero Slider (Bergilir)', [['header',1,1,12,1],['logo',1,1,2,1],['nav',4,1,6,1],['slider',1,2,12,5],['section',1,7,12,4],['card',2,8,4,3],['card',7,8,4,3],['footer',1,12,12,1]]],
  ['Halaman Arahan (Landing)', [['header',1,1,12,1],['logo',1,1,2,1],['button',11,1,2,1],['hero',1,2,12,6],['text',2,3,6,3],['button',2,6,3,1],['image',8,3,4,4],['section',1,8,12,4],['card',2,9,3,2],['card',5,9,3,2],['card',8,9,3,2],['footer',1,12,12,1]]],
  ['Dua Lajur (Sidebar)', [['header',1,1,12,1],['aside',1,2,3,10],['section',4,2,9,10],['footer',1,12,12,1]]],
  ['Skrin Terbahagi (Split)', [['hero',1,1,6,12],['image',7,1,6,12]]],
  ['Asimetri Moden', [['section',1,1,3,5],['card',4,1,5,3],['hero',9,1,4,5],['card',4,4,5,2],['section',1,6,8,6],['card',9,6,4,6]]],
  ['Corak Bacaan F-Shape', [['header',1,1,12,2],['hero',1,3,9,2],['image',1,5,3,7],['text',4,5,6,2],['section',4,7,9,5]]],
  ['Corak Bacaan Z-Shape', [['header',1,1,12,1],['hero',1,2,12,6],['card',1,9,3,3],['card',5,9,3,3],['button',10,10,3,2]]],
  ['Grid Kad / Blok', [['header',1,1,12,1],['card',1,2,4,5],['card',5,2,4,5],['card',9,2,4,5],['card',1,7,4,5],['card',5,7,4,5],['card',9,7,4,5]]],
  ['Gaya Majalah', [['image',1,1,4,5],['text',5,1,8,5],['card',1,6,6,6],['card',7,6,6,6]]],
  ['Imej Utama (Featured)', [['image',1,1,5,12],['hero',6,1,7,4],['text',6,5,7,5],['button',6,11,3,1]]],
  ['Susunan Masonry', [['card',1,1,4,5],['card',5,1,4,3],['card',9,1,4,6],['card',5,4,4,6],['card',1,6,4,4],['card',9,7,4,4]]],
  ['Navigasi Tetap', [['nav',1,1,12,1],['hero',1,2,12,5],['section',1,7,6,5],['section',7,7,6,5]]],
  ['Borang & Hubungan', [['header',1,1,12,1],['nav',4,1,6,1],['section',1,2,5,8],['form',6,2,7,8],['footer',1,12,12,1]]]
];

const DEFAULT_PAGES = {
  'index.html': {
    name: 'Utama (index.html)',
    blocks: TP[0][1].map((a, i) => ({ id: String(i + 1), type: a[0], c: a[1], r: a[2], w: a[3], h: a[4], t: TY[a[0]].t, f: TY[a[0]].f })),
    links: ['about.html', 'contact.html']
  },
  'about.html': {
    name: 'Tentang Kami (about.html)',
    blocks: [
      { id: '1', type: 'header', c: 1, r: 1, w: 12, h: 1, t: 'Tentang Kami', f: 0 },
      { id: '2', type: 'nav', c: 4, r: 1, w: 6, h: 1, t: 'Utama, Tentang, Hubungi', f: 0 },
      { id: '3', type: 'hero', c: 1, r: 2, w: 12, h: 5, t: 'Kenali Pasukan Dedikasi Kami', f: 1 },
      { id: '4', type: 'footer', c: 1, r: 12, w: 12, h: 1, t: 'Hak cipta © 2026', f: 0 }
    ],
    links: ['index.html']
  },
  'contact.html': {
    name: 'Hubungi (contact.html)',
    blocks: [
      { id: '1', type: 'header', c: 1, r: 1, w: 12, h: 1, t: 'Hubungi Kami', f: 0 },
      { id: '2', type: 'nav', c: 4, r: 1, w: 6, h: 1, t: 'Utama, Tentang, Hubungi', f: 0 },
      { id: '3', type: 'section', c: 1, r: 3, w: 5, h: 6, t: 'Maklumat Lokasi & Waktu Operasi', f: 1 },
      { id: '4', type: 'form', c: 6, r: 3, w: 7, h: 6, t: 'Nama Penuh, Alamat Emel, Mesej Anda', f: 0, fields: ['Nama Penuh', 'Alamat Emel', 'Mesej Anda'], submitText: 'Hantar Mesej' },
      { id: '5', type: 'footer', c: 1, r: 12, w: 12, h: 1, t: 'Hak cipta © 2026', f: 0 }
    ],
    links: ['index.html']
  }
};

const AI_KNOWLEDGE_BM = {
  order: `<b>Formula Anatomi Tubuh Manusia untuk Laman Web:</b><br>
  1. <b>Kepala:</b> &lt;header&gt; &amp; &lt;nav&gt; di baris paling atas (logo &amp; menu navigasi).<br>
  2. <b>Wajah (Hero):</b> &lt;section class="hero"&gt; untuk tajuk utama &amp; butang tindakan (CTA).<br>
  3. <b>Badan:</b> &lt;section&gt;, &lt;article&gt; (Kad), &amp; &lt;form&gt; untuk isi kandungan utama.<br>
  4. <b>Kaki:</b> &lt;footer&gt; di bahagian paling bawah untuk hak cipta dan pautan rujukan.`,
  nav: `<b>Mengapa guna &lt;nav&gt; berbanding &lt;div&gt;?</b><br>
  • Enjin carian (SEO) &amp; pembaca skrin (screen reader) terus mengenali ia sebagai menu navigasi utama.<br>
  • Tag &lt;div&gt; hanyalah kotak umum tanpa makna semantik. Gunakan tag semantik untuk piawaian W3C moden.`,
  hero: `<b>Cara menyusun Teks &amp; Imej bersebelahan dalam Hero:</b><br>
  1. Lukis kotak <b>Bahagian Utama (Hero)</b> (12 kolum × 5 baris).<br>
  2. Seret elemen <b>Teks</b> ke separuh kiri Hero (kolum 2–6).<br>
  3. Seret elemen <b>Imej</b> ke separuh kanan (kolum 7–11). Ia akan bersarang (nested) secara automatik!`,
  css: `<b>Bila perlu guna External vs Internal vs Inline CSS?</b><br>
  • <b>External CSS:</b> Amalan terbaik industri (fail <code>style.css</code> berasingan untuk semua halaman).<br>
  • <b>Internal CSS:</b> Sesuai untuk latihan satu fail HTML tunggal.<br>
  • <b>Inline CSS:</b> Hanya untuk ujian pantas pada satu tag tertentu.`,
  box: `<b>Perbezaan Padding vs Margin:</b><br>
  • <b>Padding:</b> Ruang <i>di dalam</i> sempadan kotak (menolak teks ke dalam dari tepi kotak).<br>
  • <b>Margin:</b> Ruang <i>di luar</i> sempadan kotak (menjarakkan kotak daripada elemen bersebelahan).`,
  semantic: `<b>Kelebihan HTML5 Semantik berbanding &lt;div&gt;:</b><br>
  • <b>Kebolehcapaian (a11y):</b> Pembaca skrin dapat melompat terus ke bahagian utama.<br>
  • <b>SEO:</b> Enjin carian memahami struktur kandungan halaman dengan tepat.<br>
  • <b>Kemudahan Penyelenggaraan:</b> Kod lebih bersih dan mudah dibaca berbanding "Div Soup".`,
  links: `<b>Cara menghubungkan Halaman dalam Peta Aliran (Sitemap):</b><br>
  1. Klik mod <b>Aliran</b> di bar atas.<br>
  2. Pilih halaman sasaran pada kad halaman &amp; klik <b>+ Sambung</b>.<br>
  3. Pautan <code>&lt;a href="..."&gt;</code> akan dijana secara automatik dalam menu navigasi anda!`
};

const AI_KNOWLEDGE_EN = {
  order: `<b>Human Body Web Anatomy Formula:</b><br>
  1. <b>Head:</b> &lt;header&gt; &amp; &lt;nav&gt; at the very top (logo &amp; navigation menu).<br>
  2. <b>Face (Hero):</b> &lt;section class="hero"&gt; for impactful headlines &amp; CTA buttons.<br>
  3. <b>Body:</b> &lt;section&gt;, &lt;article&gt; (Cards), &amp; &lt;form&gt; for core page content.<br>
  4. <b>Feet:</b> &lt;footer&gt; at the very bottom for copyright, sitemaps, and legal links.`,
  nav: `<b>Why use &lt;nav&gt; instead of &lt;div&gt;?</b><br>
  • Search engines (SEO) &amp; screen readers instantly identify it as the navigation landmark.<br>
  • A &lt;div&gt; is just a generic box without semantics. Always use semantic tags for modern W3C standards.`,
  hero: `<b>How to build a Hero with Image &amp; Text side-by-side:</b><br>
  1. Draw a <b>Hero</b> box (12 columns × 5 rows).<br>
  2. Drag a <b>Text</b> block to the left half of the Hero (columns 2–6).<br>
  3. Drag an <b>Image</b> block into the right half (columns 7–11). The layout automatically nests cleanly!`,
  css: `<b>When to use External vs Internal vs Inline CSS?</b><br>
  • <b>External CSS:</b> Best practice for production (separate style.css cached by browsers).<br>
  • <b>Internal CSS:</b> Convenient for single-file exercises and self-contained demos.<br>
  • <b>Inline CSS:</b> Only for quick local tests (avoid in production code).`,
  box: `<b>Padding vs Margin:</b><br>
  • <b>Padding:</b> Space <i>inside</i> the block border, pushing text inward from edges.<br>
  • <b>Margin:</b> Space <i>outside</i> the block border, separating it from adjacent elements.`,
  semantic: `<b>Why Semantic HTML5 matters:</b><br>
  • <b>Accessibility (a11y):</b> Screen readers navigate landmarks seamlessly.<br>
  • <b>SEO:</b> Search engines index meaningful content hierarchy accurately.<br>
  • <b>Maintainability:</b> Clean, readable code avoiding "Div Soup".`,
  links: `<b>How to connect Pages with Sitemap Links:</b><br>
  1. Switch top view to <b>Page Flow (Sitemap)</b>.<br>
  2. Select target page on card dropdown &amp; click <b>+ Connect</b>.<br>
  3. Clean &lt;a href="..."&gt; links are automatically generated in your navigation!`
};

const AI_KNOWLEDGE = AI_KNOWLEDGE_BM;

const TEXT_SWATCHES = [
  '#ffffff', '#000000', '#1e293b', '#64748b',
  '#00d4ff', '#0284c7', '#2563eb', '#6366f1',
  '#a855f7', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#ffd166', '#84cc16', '#10b981'
];

const FILL_SWATCHES = [
  'none', '#ffffff', '#cfe0ff', '#ffd166',
  '#2b2f3a', '#ff7a59', '#b8f2c9', '#0b3d91',
  '#06255c', '#1e293b', '#f1f5f9', '#fef08a',
  '#fecdd3', '#ddd6fe', '#e0e7ff', '#111827'
];
