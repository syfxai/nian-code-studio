# -*- coding: utf-8 -*-
import os

DOC_PATH = "Blueprint Code Studio.md"

content = """# NIAN CODE STUDIO 🐱💻
> **Studio Visual Pembelajaran & Reka Bentuk Web Berasaskan WYSIWYG & CSS Grid 12×12**

**NIAN CODE STUDIO** (dahulunya dikenali sebagai Blueprint Code Studio) ialah perisian studio reka bentuk web visual interaktif ala-ala WYSIWYG (*What You See Is What You Get*) yang membolehkan pelajar, pereka, dan pengajar menyusun susun atur laman web dengan pantas, menyunting teks terus di atas kanvas, melaraskan model kotak CSS, menguji reka bentuk responsif merentasi pelbagai peranti, serta melihat transformasi kod standard industri (**HTML5 Semantik, CSS3 Grid, dan JavaScript**).

---

## 📑 Isi Kandungan

1. [Terminologi Piawai: Elemen HTML vs Komponen](#1-terminologi-piawai-elemen-html-vs-komponen)
2. [Reka Bentuk Bersih (Clean UI) & Panel Inspector Tersusun](#2-reka-bentuk-bersih-clean-ui--panel-inspector-tersusun)
3. [Format Teks Sebenar (True WYSIWYG) & Penjajaran](#3-format-teks-sebenar-true-wysiwyg--penjajaran)
4. [Kawalan Model Kotak (Box Model: Padding, Radius, Shadow)](#4-kawalan-model-kotak-box-model-padding-radius-shadow)
5. [Pelarasan Saiz Pelbagai Sudut (Multi-Angle Resize Handles)](#5-pelarasan-saiz-pelbagai-sudut-multi-angle-resize-handles)
6. [Struktur Semantik W3C & Pembetulan `<figure>` `<figcaption>`](#6-struktur-semantik-w3c--pembetulan-figure-figcaption)
7. [Prestasi & Seni Bina Fail Tunggal (Single HTML File Performance)](#7-prestasi--seni-bina-fail-tunggal-single-html-file-performance)
8. [Laman Memanjang Menegak & Skrol (Infinite Vertical Grid)](#8-laman-memanjang-menegak--skrol-infinite-vertical-grid)
9. [Elemen Dropdown Semantik HTML5 (`<details>` & `<summary>`)](#9-elemen-dropdown-semantik-html5-details--summary)
10. [Hierarki Bar Alat Kod 2-Tingkat & Butang Salin Terapung](#10-hierarki-bar-alat-kod-2-tingkat--butang-salin-terapung)
11. [Mod Gabungan 3-dalam-1 (External + Internal + Inline) & Hierarki CSS](#11-mod-gabungan-3-dalam-1-external--internal--inline--hierarki-css)
12. [Ciri Kod Boleh Lipat (Code Folding / Collapse)](#12-ciri-kod-boleh-lipat-code-folding--collapse)
13. [Suis Penyorot Kod CSS (Highlight CSS Code)](#13-suis-penyorot-kod-css-highlight-css-code)
14. [Pedagogi: Formula Tubuh Manusia & Saringan Tag Semantik](#14-pedagogi-formula-tubuh-manusia--saringan-tag-semantik)
15. [Tab Halaman Ergonomik (Multi-Page Tabs)](#15-tab-halaman-ergonomik-multi-page-tabs)
16. [Peta Sambungan: Seni Bina Rangkaian Navigasi Penuh (Sitemap & Navigation Mesh)](#16-peta-sambungan-seni-bina-rangkaian-navigasi-penuh-sitemap--navigation-mesh)
17. [Guru AI Pintar (Simulated AI Tutor & Real-Time Auditor)](#17-guru-ai-pintar-simulated-ai-tutor--real-time-auditor)
18. [Muat Turun Fail Projek Sebenar (Export Packager)](#18-muat-turun-fail-projek-sebenar-export-packager)
19. [Suis Lapisan Pembelajaran (HTML, + CSS, + JS)](#19-suis-lapisan-pembelajaran-html--css--js)
20. [Pintasan Papan Kekunci (Keyboard Shortcuts)](#20-pintasan-papan-kekunci-keyboard-shortcuts)
21. [Editor Kod Boleh Sunting & Pengesanan Ralat Masa Nyata (Live Code Editor)](#21-editor-kod-boleh-sunting--pengesanan-ralat-masa-nyata-live-code-editor)
22. [Sistem Kotak Dialog Tempatan (Built-in Studio Modal System)](#22-sistem-kotak-dialog-tempatan-built-in-studio-modal-system)
23. [Ikon & Favicon Rasmi NIAN Code Studio (Official Brand Logo)](#23-ikon--favicon-rasmi-nian-code-studio-official-brand-logo)
24. [Koleksi 43 Ikon PNG Tempatan Baharu (`assets/icons/`)](#24-koleksi-43-ikon-png-tempatan-baharu-assetsicons)
25. [Panduan Penggunaan Logo Tempatan (*Local Folder Assets*)](#25-panduan-penggunaan-logo-tempatan-local-folder-assets)
26. [Nasihat Susun Atur Laman Web Standard (Top-to-Bottom Layout Hierarchy)](#26-nasihat-susun-atur-laman-web-standard-top-to-bottom-layout-hierarchy)
27. [Pembaikan Paparan Hasil Pratonton (*Live Preview Blank Fix*)](#27-pembaikan-paparan-hasil-pratonton-live-preview-blank-fix)
28. [Piawaian Komen Kod Menyeluruh (100% Fully Commented HTML, CSS, JS)](#28-piawaian-komen-kod-menyeluruh-100-fully-commented-html-css-js)
29. [Penstrukturan Ergonomik Palang Atas (Ergonomic Top Bar Layout)](#29-penstrukturan-ergonomik-palang-atas-ergonomic-top-bar-layout)
30. [Penukaran Pantas Jenis Elemen Semantik & Pautan Navigasi (Smart Element & Navigation Link Converter)](#30-penukaran-pantas-jenis-elemen-semantik--pautan-navigasi-smart-element--navigation-link-converter)

---

## 1. Terminologi Piawai: Elemen HTML vs Komponen

Mengikut spesifikasi rasmi **W3C** dan dokumentasi **MDN Web Docs**:
* **Elemen HTML (*HTML Elements*):** Tag asas web standard seperti `<header>`, `<nav>`, `<section>`, `<article>`, `<div>`, `<a>`, dan `<details>`. Ini ialah istilah rasmi untuk pembelajaran struktur asas web.
* **Komponen (*Components*):** Istilah industri perisian (seperti React, Vue) apabila beberapa elemen digabungkan bersama logik data.

Dalam **NIAN CODE STUDIO**, semua rujukan menggunakan istilah tepat dan standard W3C iaitu **Elemen** (*HTML Elements*).

---

## 2. Reka Bentuk Bersih (Clean UI) & Panel Inspector Tersusun

1. **Kanvas Bebas Gangguan:**
   * Kotak butang lama yang berterabur di kanvas telah dimansuhkan.
   * Kanvas blueprint kini memaparkan bingkai biru kemas, pemegang saiz 8-arah (*resize handles*), dan lencana tag cyan yang berkontras tinggi.
2. **Bar Alat Kontekstual Teks Ala Canva (*Canva-Style Context Bar*):**
   * Terletak tepat di atas kanvas (`#canva-bar`) dan muncul sebaik sahaja elemen dipilih:
     * **Dropdown Tag Semantik Interaktif**: Tukar `<section>` ke `<nav>`, `<a>`, `<header>` terus dari kanvas.
     * **Butang Pintas Nav & Pautan**: Pecahkan teks menjadi pautan dengan satu klik.
     * **Pemilih Warna Latar & Teks**: Palet warna lengkap dengan popover RGB/HEX.
     * **Garisan Sempadan & Bucu**: Pilihan 0px, 1px, 2px solid/dashed serta bucu bulat *pill*.
     * **Fon Google & Saiz Stepper**: Kawalan fon Google (Poppins, Inter, Lora, Caveat) dan stepper saiz fon.
     * **Penjajaran Teks**: Kiri, Tengah, dan Kanan.
3. **Panel Inspector (Sidebar Kanan) Yang Bernafas:**
   * Dikhaskan untuk perincian dimensi grid (kolum & baris), penukaran jenis semantik pantas, teks elemen, pengurusan latar corak/imej, dan pemadaman elemen.

---

## 3. Format Teks Sebenar (True WYSIWYG) & Penjajaran

Perubahan teks terus terpapar secara visual pada kanvas menyerupai halaman web sebenar:
* Tag tebal `<b>` / `<strong>` memaparkan teks tebal (*bold*).
* Tag condong `<i>` / `<em>` memaparkan gaya condong (*italic*).
* Tag tajuk `<h1>` hingga `<h6>` memaparkan skala saiz tajuk sebenar.
* Penjajaran rata kiri, tengah, dan kanan diselaraskan secara langsung di atas kanvas dan kod CSS.

---

## 4. Kawalan Model Kotak (Box Model: Padding, Radius, Shadow)

Pelajar dan pengajar boleh melaras sifat Box Model:
* **Padding (Ruang Dalam):** `0px` (Rapat), `8px` (Kecil), `16px` (Biasa), `24px` (Selesa), `32px` (Luas).
* **Border Radius (Bucu Melengkung):** `0px` (Tajam), `4px` (Halus), `8px` (Sederhana), `16px` (Melengkung), `9999px` (Pill / Bulat Penuh).
* **Box Shadow (Kesan Bayang):** Tiada, Lembut (*Soft*), Timbul (*Medium*), Jelas (*Elevated*).
* Diselaraskan automatik ke dalam CSS luaran, dalaman, inline, dan utiliti Tailwind CSS.

---

## 5. Pelarasan Saiz Pelbagai Sudut (Multi-Angle Resize Handles)

* Elemen yang dipilih dilengkapi 8 titik pemegang saiz (Utara, Selatan, Timur, Barat, serta 4 penjuru Pepenjuru).
* Membolehkan perubahan saiz blok secara intuitif tanpa perlu mengira nombor kolum manual.

---

## 6. Struktur Semantik W3C & Pembetulan `<figure>` `<figcaption>`

* **Atribut `alt`:** Sentiasa mengandungi teks bersih (*plain text*) tanpa tag HTML bagi memastikan kebolehcapaian pembaca skrin (*screen reader accessibility*).
* **Tag `<figcaption>`:** Membungkus kapsyen atau penerangan imej di bawah gambar mengikut piawaian HTML5.

---

## 7. Prestasi & Seni Bina Fail Tunggal (Single HTML File Performance)

* Keseluruhan studio boleh dijalankan menerusi fail mandiri mudah alih [`Blueprint Code Studio.html`](Blueprint Code Studio.html) tanpa pelayan luar (*zero dependencies*).
* Disokong oleh modul modular di dalam folder `js/` dan `css/` untuk pembangunan perisian bersih.
* Skrip penyegerakan automatik `sync_all.js` menjamin keselarasan kod 100%.

---

## 8. Laman Memanjang Menegak & Skrol (Infinite Vertical Grid)

* Kanvas CSS Grid secara dinamik menambah baris secara menegak mengikut keperluan kandungan.
* Baris auto-rows memastikan laman tidak terhad kepada saiz skrin awal sahaja.

---

## 9. Elemen Dropdown Semantik HTML5 (`<details>` & `<summary>`)

* Sokongan menu boleh buka/tutup menggunakan tag semantik asli `<details>` dan `<summary>`.
* Berfungsi secara interaktif di pelayar web tanpa memerlukan skrip JavaScript tambahan.

---

## 10. Hierarki Bar Alat Kod 2-Tingkat & Butang Salin Terapung

* Ruang kod dibahagikan kepada 2 tingkat yang kemas:
  1. **Tingkat 1:** Pilihan tab fail (`index.html`, `style.css`, `script.js`) dan togol mod (Papar vs Sunting).
  2. **Tingkat 2:** Pilihan kaedah gaya CSS (External, Internal, Inline, 3-in-1, Tailwind) dan lencana status sintaks.
* Butang salin kod terapung (*floating copy button*) dengan maklum balas segera.

---

## 11. Mod Gabungan 3-dalam-1 (External + Internal + Inline) & Hierarki CSS

* Mengajar konsep *CSS Cascading Priority*:
  $$\\text{Inline CSS} > \\text{Internal CSS} > \\text{External CSS}$$
* Memaparkan ketiga-tiga kaedah serentak dalam kod dengan penanda visual warna.

---

## 12. Ciri Kod Boleh Lipat (Code Folding / Collapse)

* Pelajar boleh melipat (*collapse*) blok tag besar seperti `<head>`, `<main>`, atau `<style>` untuk memudahkan pembacaan kod yang panjang.

---

## 13. Suis Penyorot Kod CSS (Highlight CSS Code)

* Butang penyorot warna yang menghubungkan blok visual di atas kanvas dengan baris kod CSS yang sepadan.

---

## 14. Pedagogi: Formula Tubuh Manusia & Saringan Tag Semantik

* Mengajar susunan laman web menggunakan analogi anatomi tubuh:
  * **Kepala:** `<header>` & `<nav>`
  * **Badan/Torso:** `<main>`, `<section>`, `<article>`, `<aside>`
  * **Kaki:** `<footer>`

---

## 15. Tab Halaman Ergonomik (Multi-Page Tabs)

* Menguruskan berbilang halaman web serentak (`index.html`, `about.html`, `services.html`, `contact.html`).
* Menambah, menamakan semula, dan memadam halaman dengan satu klik.

---

## 16. Peta Sambungan: Seni Bina Rangkaian Navigasi Penuh (Sitemap & Navigation Mesh)

```
[ Utama (index.html) ] ─── <nav> Menu ───► [ Tentang (tentang.html) ]
        │                                         ▲
        └─── <a> Butang CTA ──────────────────────┘
        │
        └─── <footer> Kaki Laman ─────────────────► [ WhatsApp / Privasi ]
```

1. **Rangkaian Navigasi Sebenar (*True Site Navigation Mesh*):**
   * Peta sambungan bukan sekadar senarai nama fail kosong, tetapi memetakan seluruh pergerakan pelawat antara komponen navigasi (`<nav>`, butang CTA `<a>`, dan `<footer>`).
2. **Carta Aliran Visual Vektor (*SVG Navigation Flowchart*):**
   * Garis penyambung lengkung (*bezier curves*) bercahaya cyan dengan kepala anak panah menunjukkan arah aliran trafik.
   * Garis laluan kembali (*return flow*) dari laman anak menghala semula ke Laman Utama.
3. **Lompat Pantas Satu-Klik:**
   * Klik pada mana-mana kad nod untuk terus melompat menyunting laman tersebut di atas kanvas.

---

## 17. Guru AI Pintar (Simulated AI Tutor & Real-Time Auditor)

* Mengimbas susunan blok kanvas dan memberikan teguran pedagogi secara masa nyata.
* Menjawab soalan lazim pelajar berkenaan semantik HTML, CSS Grid, dan navigasi web.

---

## 18. Muat Turun Fail Projek Sebenar (Export Packager)

* Menjana arkib fail web lengkap sedia lancar:
  * `index.html` (struktur semantik W3C)
  * `style.css` (gaya CSS Grid responsif)
  * `script.js` (interaktiviti JavaScript lengkap)

---

## 19. Suis Lapisan Pembelajaran (HTML, + CSS, + JS)

* Membolehkan pelajar mematikan atau menghidupkan CSS dan JS bagi memahami peranan setiap lapisan teknologi web secara terasing.

---

## 20. Pintasan Papan Kekunci (Keyboard Shortcuts)

* `Ctrl + Z`: Undur (*Undo*)
* `Ctrl + Shift + Z` / `Ctrl + Y`: Ulang (*Redo*)
* `Ctrl + S`: Terapkan kod ke kanvas
* `[` / `]`: Sorok atau buka panel sisi
* `V`: Alat Pilih | `R`: Alat Lukis Kotak

---

## 21. Editor Kod Boleh Sunting & Pengesanan Ralat Masa Nyata (Live Code Editor)

```
[ 👁️ Papar ]   [ ✏️ Sunting ]   ───   🟢 Sintaks Sah (Segerak)
```

1. **Mod Papar vs Mod Sunting:**
   * Mod Papar: Kod bersalut sintaks warna dengan garis panduan kaitan blok kanvas.
   * Mod Sunting: Ruang penyunting `<textarea>` interaktif lengkap dengan nombor baris (*gutter line numbers*).
2. **Pengesahan Sintaks Automatik (*Real-Time Syntax Validation*):**
   * Mengesan tag HTML tidak tertutup, kurungan kurawal CSS `{ ... }` tidak seimbang, dan `SyntaxError` JavaScript.
3. **Banner Makluman Ralat & Lompat Baris (*Go-to-Line*):**
   * Menekan butang **`Lihat Baris`** akan menatal editor dan menyorot teks pada baris ralat secara automatik.

---

## 22. Sistem Kotak Dialog Tempatan (Built-in Studio Modal System)

* Menggantikan pop-up pelayar lama (`alert`, `confirm`, `prompt`) dengan modal dalaman moden (`.app-dialog-overlay` & `.app-dialog-card`) beranimasi pudar lembut dan berlatar belakang kabur (*backdrop blur*).

---

## 23. Ikon & Favicon Rasmi NIAN Code Studio (Official Brand Logo)

* Menggunakan maskot kucing hitam bermata tajam yang melambangkan ketelitian dan ketangkasan reka bentuk web.
* Disimpan dalam resolusi tinggi di folder `assets/` (`assets/logo.png`, `assets/favicon.png`, `assets/favicon.ico`).
* Disuntik sebagai Base64 Data URI di dalam `Blueprint Code Studio.html` untuk portabiliti 100%.

---

## 24. Koleksi 43 Ikon PNG Tempatan Baharu (`assets/icons/`)

Semua ikon SVG dan emoji lama telah digantikan dengan **43 fail PNG beresolusi tinggi** berlatar belakang lutsinar (*transparent background*):

```
assets/icons/
├── undo.png, redo.png, export.png, trash.png, close.png, inspector.png, ai-guru.png
├── mode-visual.png, mode-split.png, mode-code.png, mode-grid.png, mode-nodes.png, mode-preview.png
├── tab-html.png, tab-css.png, view-mobile.png, view-tablet.png, view-desktop.png
├── theme-blueprint.png, theme-light.png, theme-dark.png, theme-mint.png, tool-theme.png
├── elem-header.png, elem-nav.png, elem-hero.png, elem-text.png, elem-button.png, elem-image.png, elem-card.png, elem-footer.png, elem-form.png
└── code-view.png, code-edit.png, code-sync.png, code-restore.png, alert-warn.png
```

---

## 25. Panduan Penggunaan Logo Tempatan (*Local Folder Assets*)

Untuk menggunakan gambar logo daripada folder komputer sendiri:

1. **Simpan Fail di Folder Projek:**
   Letakkan logo dalam folder `assets/` (cth: `assets/logo.png`).
2. **Pautan Dalam HTML Menggunakan Laluan Relatif:**
   ```html
   <header class="header">
     <a href="index.html" class="brand-link">
       <img src="assets/logo.png" alt="Logo Rasmi" class="brand-logo" width="40" height="40">
       <span class="brand-name">NAMA STUDIO</span>
     </a>
   </header>
   ```
3. **Kawalan Gaya CSS:**
   ```css
   .brand-logo {
     height: 40px;
     width: auto;
     object-fit: contain;
     display: block;
   }
   ```
4. **Sebagai Favicon Tab Pelayar Web:**
   ```html
   <link rel="icon" type="image/png" href="assets/favicon.png">
   ```

---

## 26. Nasihat Susun Atur Laman Web Standard (Top-to-Bottom Layout Hierarchy)

Urutan anatomi susun atur profesional dari atas ke bawah:

```
┌────────────────────────────────────────────────────────┐
│ 1. BAR UTILITI / NOTIS (Announcement Bar) [Pilihan]    │
├────────────────────────────────────────────────────────┤
│ 2. KEPALA LAMAN (<header>): Logo + Menu <nav> + Butang │
├────────────────────────────────────────────────────────┤
│ 3. RUANG HERO (<section class="hero">):                │
│    • Tajuk Utama (H1) & Tawaran Nilai (Value Prop)     │
│    • Sub-tajuk Penjelasan Ringkas (1-2 ayat)           │
│    • Butang Tindakan Utama & Sekunder (CTA Buttons)    │
│    • Visual Utama / Mockup / Ilustrasi Produk          │
├────────────────────────────────────────────────────────┤
│ 4. BUKTI SOSIAL / PENARAFAN (Social Proof & Trust)     │
│    • Logo Rakan Kongsi / Klien / Statistik Ringkas     │
├────────────────────────────────────────────────────────┤
│ 5. CIRI & FAEDAH UTAMA (<article class="card"> Grid)   │
│    • 3 atau 4 Kad di Desktop | Bersusun 1 Kolum Mobile │
├────────────────────────────────────────────────────────┤
│ 6. KANDUNGAN TERPERINCI / GALERI / SENARAI HARGA       │
├────────────────────────────────────────────────────────┤
│ 7. SERUAN TINDAKAN AKHIR (Final CTA Banner)            │
├────────────────────────────────────────────────────────┤
│ 8. KAKI LAMAN (<footer>): Pautan Dasar, Hak Cipta & Sos│
└────────────────────────────────────────────────────────┘
```

---

## 27. Pembaikan Paparan Hasil Pratonton (*Live Preview Blank Fix*)

1. **Ketinggian Iframe Terjamin:** Menggantikan `height: auto` kepada `height: 100%; min-height: 520px;` supaya iframe tidak menguncup kepada 0px.
2. **Urutan Paparan Unhide Sebelum Suntik Kod:** Bekas `#paper` dibuka terlebih dahulu sebelum menyuntik `srcdoc`, mengatasi sekatan enjin Chromium (*display: none bug*).
3. **Pelepasan Sekatan Kotak Pasir (*Sandbox Expansion*):** `sandbox="allow-scripts allow-same-origin allow-modals allow-forms"` membolehkan fon Google Fonts dan manipulasi pautan berfungsi secara sempurna.

---

## 28. Piawaian Komen Kod Menyeluruh (100% Fully Commented HTML, CSS, JS)

Setiap fail kod yang dijana dan dimuat turun kini mempunyai dokumentasi komen yang lengkap:
* **HTML (`index.html`):** Setiap blok semantik dilabel dengan komen saiz dan fungsinya (`<!-- 🧱 Header: <header> .header-1 (12 kol × 2 baris) -->`).
* **CSS (`style.css`):** Setiap *rule selector* dilabel dengan komen kedudukan kolum dan barisnya (`/* 🎨 Header: .header-1 - Kolum 1 & Baris 1 */`).
* **JavaScript (`script.js`):** Langkah demi langkah dijelaskan dengan komen (DOM Ready, Butang CTA, Smooth Scrolling, Carousel Autoplay).

---

## 29. Penstrukturan Ergonomik Palang Atas (Ergonomic Top Bar Layout)

Susun atur palang atas dibahagikan kepada 3 zon ergonomik seimbang mengikut standard Figma dan Canva:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] NIAN CODE STUDIO │ [↖ Pilih | ▢ Lukis] [↶ Undo | ↷ Redo] │ [Visual|Split|Kod] ...│
│ (KIRI: Jenama & Alat Sunting Kanvas Utama)                     │  (TENGAH: Mod Kerja)   │
│                                                                                          │
│ ... [Pelan Grid|Peta Sambungan|Hasil] ──SPACER── [HTML|+CSS|+JS] [Guru AI] [Muat Turun] │
│                                                  (KANAN: Lapisan, Bantuan & Eksport)     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Zon Kiri:** Logo Jenama, Alat Kanvas (`Pilih (V)` dan `Lukis (R)`), serta butang berkembar `Undur` dan `Ulang`. Tangan dan mata pereka tidak perlu lagi mencari alat melukis jauh di sudut kanan skrin.
* **Zon Tengah:** Mod Kerja (`Visual`, `Split`, `Kod`) dan Paparan Kanvas (`Pelan Grid`, `Peta Sambungan`, `Hasil`).
* **Zon Kanan:** Lapisan Pembelajaran (`HTML`, `+ CSS`, `+ JS`), `Guru AI`, `Elemen`, `Inspector`, dan butang hijau `Muat Turun Projek`.

---

## 30. Penukaran Pantas Jenis Elemen Semantik & Pautan Navigasi (Smart Element & Navigation Link Converter)

1. **Tukar Terus dari Bar Canva:**
   * Dropdown tag `<section>` di atas blok kanvas membolehkan pertukaran terus kepada `<nav> Navigasi` atau `<a> Butang CTA`.
   * Butang pintas **`Nav`** dan **`Pautan`** menukarkan elemen dengan satu klik.
2. **Tukar dari Panel Inspector:**
   * Cip pertukaran pantas: `🧭 Tukar ke <nav>`, `🔗 Tukar ke <a>`, `🏷️ Tukar ke <header>`, dan `🌟 Tukar ke <section>`.
3. **Pengecaman Pintar Pautan Navigasi (*Auto-Linking Engine*):**
   * Teks mentah (contoh: `Logo Utama Tentang Hubungi Mula sekarang`) dipecahkan secara automatik kepada tag pautan `<a>` berasingan dengan destinasi pautan sebenar (`<a href="index.html">Utama</a>`, `<a href="contact.html" class="btn-cta">Hubungi</a>`).
   * Di atas kanvas, setiap item dipaparkan kemas sebagai lencana pautan (`🔗 Logo`, `🔗 Utama`, `🔗 Tentang`, `🔗 Hubungi`).

---

*Dokumentasi ini dikemas kini secara menyeluruh pada 1 November 2026 untuk NIAN CODE STUDIO.*
"""

with open(DOC_PATH, "w", encoding="utf-8") as f:
    f.write(content.strip() + "\n")

print(f"Successfully updated {DOC_PATH} with 30 comprehensive chapters!")
