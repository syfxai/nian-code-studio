/**
 * NIAN CODE STUDIO - Pustaka Ikon Vektor Web & Pengekodan (icons.js)
 * Koleksi ikon SVG berasaskan garisan (stroke) piawai 24x24 gaya Web Code / Developer (Flaticon / Iconfinder standard).
 * Menggantikan semua ikon tidak konsisten dengan gaya geometri bersih dan profesional.
 */

const ICONS = {
  // Alat Kawalan Utama (Main Tools)
  select: '<path d="M4 4l7.07 17 2.51-7.39L21 11.1z"/>',
  rect: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  robot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/><path d="M12 4v4"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  highlight: '<path d="m14 12-8.5 8.5H2v-3.5L10.5 8.5"/><path d="m18 8 2.5-2.5a2.12 2.12 0 0 0 0-3l-1-1a2.12 2.12 0 0 0-3 0L14 4"/><path d="m10.5 8.5 5 5"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',

  // Elemen HTML & Web Code
  header: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="7" y1="6.5" x2="11" y2="6.5"/>',
  nav: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
  hero: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m12 8 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z"/>',
  section: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/>',
  card: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  text: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  button: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 11h.01"/><path d="m14 14 3 3"/>',
  dropdown: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="8 10 12 14 16 10"/>',
  aside: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/>',
  footer: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="16" x2="21" y2="16"/>',
  logo: '<circle cx="12" cy="12" r="9"/><path d="m12 7 3.5 7h-7z"/>',
  slider: '<rect x="2" y="5" width="20" height="14" rx="2"/><polyline points="8 10 6 12 8 14"/><polyline points="16 10 18 12 16 14"/>',

  // Canva Styling & Inspector Tools
  border: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12" stroke-width="2.5"/><line x1="3" y1="18" x2="21" y2="18" stroke-width="3.5"/>',
  radius: '<path d="M4 20V10a6 6 0 0 1 6-6h10"/>',
  spacing: '<line x1="12" y1="3" x2="12" y2="21"/><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/><line x1="4" y1="3" x2="20" y2="3"/><line x1="4" y1="21" x2="20" y2="21"/>',
  effects: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  alignLeft: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
  alignCenter: '<line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>',
  alignRight: '<line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>'
};

const PNG_ICON_MAP = {
  header: 'assets/icons/elem-header.png',
  nav: 'assets/icons/elem-nav.png',
  hero: 'assets/icons/elem-hero.png',
  section: 'assets/icons/elem-hero.png',
  card: 'assets/icons/elem-card.png',
  image: 'assets/icons/elem-image.png',
  text: 'assets/icons/elem-text.png',
  button: 'assets/icons/elem-button.png',
  dropdown: 'assets/icons/elem-form.png',
  aside: 'assets/icons/elem-card.png',
  footer: 'assets/icons/elem-footer.png',
  logo: 'assets/logo.png',
  slider: 'assets/icons/elem-image.png',
  undo: 'assets/icons/undo.png',
  redo: 'assets/icons/redo.png',
  download: 'assets/icons/export.png',
  robot: 'assets/icons/ai-guru.png',
  code: 'assets/icons/mode-code.png',
  eye: 'assets/icons/code-view.png',
  trash: 'assets/icons/trash.png',
  close: 'assets/icons/close.png',
  select: 'assets/icons/inspector.png',
  highlight: 'assets/icons/highlighter.png',
  radius: 'assets/icons/tool-dimension.png',
  spacing: 'assets/icons/tool-dimension.png',
  effects: 'assets/icons/tool-theme.png'
};

/**
 * Penjana Ikon Piawai NIAN CODE STUDIO (Menyokong PNG Tempatan & SVG Fallback)
 * @param {string} name - Nama ikon dalam PNG_ICON_MAP atau ICONS
 * @param {string} cls - Kelas CSS tambahan
 * @param {number} size - Saiz ikon dalam piksel (lalai 18)
 * @returns {string} Markup <img> PNG atau SVG lengkap
 */
function icon(name, cls = '', size = 18) {
  if (PNG_ICON_MAP[name]) {
    return `<img src="${PNG_ICON_MAP[name]}" class="png-ic ${cls}" width="${size}" height="${size}" alt="${name}" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;display:inline-block;pointer-events:none;" />`;
  }
  const d = ICONS[name];
  if (!d) return '';
  return `<svg class="svg-ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
