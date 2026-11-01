# NIAN CODE STUDIO 🐱💻
> **Interactive Visual Web Design & Live Code Studio with Adobe Dreamweaver & Canva UX**

🌐 **Live Web Application:** [https://niancode.netlify.app/](https://niancode.netlify.app/)

[![HTML5](https://img.shields.io/badge/HTML5-Semantic%20W3C-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3-Grid%20%26%20Flexbox-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/TR/css-grid-1/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-success?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**NIAN CODE STUDIO** is a modern visual web design studio and bidirectional live coding environment. Engineered for students, web developers, educators, and UI designers, it bridges the gap between drag-and-drop WYSIWYG layout design and production-ready **Semantic HTML5, CSS3 Grid, and Vanilla JavaScript**.

Designed with the ergonomic flexibility of **Canva** (left rail dock & contextual formatting bar) and the professional developer power of **Adobe Dreamweaver** (split-view resizer, DOM tag selector breadcrumbs, document status metrics), Nian Code Studio operates completely in the browser with **zero dependencies, zero build steps, and zero server requirements**.

---

## 🌟 Key Highlights & Features

### 1. ⚡ Adobe Dreamweaver Experience (Professional Developer Suite)
* **5 Workspace View Modes:**
  * `< /> Code`: Fullscreen production code editor with line numbers, code folding, and syntax coloring.
  * `◫ Split`: Visual design canvas and code editor side-by-side with bidirectional live synchronization.
  * `📐 Design`: Pure 12-column drag-and-drop CSS Grid canvas for intuitive visual prototyping.
  * `⚡ Live`: Real-time sandboxed browser rendering with interactive links, forms, and JavaScript.
  * `🗺️ Flow`: Interactive visual sitemap diagram illustrating multi-page connections and routing.
* **↔️ Draggable Split-Pane Resizer:**
  * Smooth fluid dragging (`col-resize`) between Design and Code views.
  * Safety boundary clamps (minimum 240px width on each side) to prevent pane crushing.
  * Memory persistence via `localStorage` and **Double-Click to Reset** to a perfect 50:50 balance.
  * Automatic `iframe-shield` prevents mouse cursor events from dropping when hovering over live previews.
* **🏷️ DOM Tag Selector Breadcrumb Bar:**
  * Located along the bottom status bar, mirroring Dreamweaver's iconic tag selector:  
    `<body> > <main.grid> > <header.header> > <nav.nav>`
  * Click any parent tag in the breadcrumb hierarchy to select that container instantly on the canvas and scroll to it in the code editor.
* **📊 Document Status & Live Metrics:**
  * Real-time cursor position tracking (`Ln 14, Col 5`).
  * Canvas grid dimensions (`12 cols × auto rows`), author metadata, W3C specification status, and `UTF-8` encoding.

---

### 2. 🎨 Canva-Style Ergonomic Workspace (+300px Horizontal Room)
* **68px Vertical Rail Dock:**
  * Quick 1-click access to **Elements** (`elem`), **Pre-built Layouts** (`tpl`), **Inspector & Properties** (`ins`), **Layers Hierarchy** (`layers`), **CSS Studio & Responsive** (`css`), and **Smart AI Tutor** (`ai`).
* **Auto-Contextual Sliding Drawer:**
  * Drawer automatically opens to the **Inspector** tab when an element is clicked on canvas, and reverts to Elements/Layouts when clicking empty space.
  * Press **`[`** keyboard shortcut anytime to toggle the drawer open or closed.
* **Floating Contextual Formatting Bar:**
  * Dynamically appears right above the active element with clean grouped clusters:
    * **Element:** Semantic tag badge, navigation convert toggle, dropdown submenu switcher.
    * **Style:** Background color palette, border width/style, corner radius presets (sharp, rounded, pill).
    * **Text:** Bold, Italic, Underline, and Text Alignment (Left, Center, Right).
    * **Layout:** Internal padding stepper, drop-shadow elevation presets.
    * **Actions:** Layer positioning (Bring to Front), Duplicate, and Delete.

---

### 3. 🏷️ Dual Engine: W3C Semantic HTML5 vs Classic `<div>` (Div Soup)
* **W3C Semantic Standards:** Generates clean, accessible, SEO-optimized markup using `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`, and `<details>`.
* **Classic `<div>` Mode:** Switch anytime to teach and demonstrate legacy layout structures (Div Soup) vs modern semantic standards.
* **Dropdown Menu Stepper Manager:**
  * Interactive counter controls (`[ − ]` and `[ + ]`) to dynamically set option count.
  * Individual editable label inputs with remove buttons (`✕`) generating native `<details>`/`<summary>` semantics.

---

### 4. 📱 Responsive CSS Studio & Multi-Engine Styling
* **Real-Time Responsive Viewport Preview:**
  * `Desktop` (100% full width)
  * `Tablet` (768px iPad breakpoint)
  * `Mobile` (375px iPhone breakpoint)
* **Conditional `@media` Query Injection:** Toggle responsive CSS code generation on/off with one click.
* **4 CSS Output Modes:**
  1. **External CSS (`style.css`):** Industry standard separate stylesheet linked in `<head>`.
  2. **Internal CSS (`<style>`):** Self-contained single-file document styling.
  3. **Inline Styles (`style="..."`):** Direct style attributes for teaching CSS specificity.
  4. **3-in-1 Combo:** External + Internal + Inline simultaneously for comprehensive code review.
* **Custom Theme Tokens & Presets:** Quick global color switches (`Clean Light`, `Dark Slate`, `Fresh Mint`, `Blueprint Blue`).

---

### 5. 🗺️ Interactive Visual Sitemap Flowchart
* Built-in SVG mesh diagram dynamically scans page links and navigation routes across multi-page projects.
* Add, manage, and disconnect inter-page connections or external links (WhatsApp, Google Maps, Social Media).

---

### 6. 📦 Zero-Dependency Single-File Distribution
* In addition to the modular source files (`index.html`, `css/studio.css`, `js/*.js`), the project includes **`Blueprint Code Studio.html`**:
  * An entirely self-contained single file with all HTML, CSS, JavaScript, SVG icons, and base64 assets embedded.
  * Runs completely offline from a USB drive, local folder, or LMS without Node.js, npm, or web servers.

---

## 📂 Project Architecture

```
nian-code-studio/
├── index.html                  # Main modular studio application entry
├── Blueprint Code Studio.html  # 100% standalone single-file distribution (offline ready)
├── Blueprint Code Studio.md    # Comprehensive architectural specification (37 Chapters)
├── README.md                   # Project overview and developer documentation
├── .gitignore                  # Git ignore rules
│
├── css/
│   └── studio.css              # Main studio stylesheet & responsive layout system
│
├── js/
│   ├── config.js               # Element definitions, templates & AI knowledge base
│   ├── icons.js                # Crisp inline SVG icon library
│   ├── state.js                # Reactive reactive state store & localStorage sync
│   ├── generator.js            # Semantic HTML5, CSS Grid & JS code generation engine
│   ├── canvas.js               # Interactive 12-column grid canvas & resize handles
│   ├── inspector.js            # Property inspector, background picker & Canva bar
│   └── app.js                  # Application coordinator, Dreamweaver modes & split resizer
│
├── assets/                     # Graphical assets, logo, and studio icons
│   ├── favicon.ico
│   ├── favicon.png
│   ├── logo.png
│   └── icons/                  # High-DPI UI icons
│
└── scripts/
    └── sync_all.js             # Automated bundler: syncs modular files to standalone bundle
```

---

## 🚀 Getting Started

### Option 1: Try Online Directly (Instant Web App)
Launch the full interactive studio in your browser with zero installation:
👉 **[https://niancode.netlify.app/](https://niancode.netlify.app/)**

### Option 2: Direct Local File Launch (No Server Required)
Simply double-click **`index.html`** or **`Blueprint Code Studio.html`** to run in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Option 2: Run with Local HTTP Server
Using Python:
```bash
python -m http.server 8000
```
Using Node.js:
```bash
npx serve .
```
Then visit `http://localhost:8000` in your browser.

### Option 3: Synchronizing Standalone Bundle
Whenever changes are made to modular files in `index.html`, `css/`, or `js/`, update the standalone single-file distribution with:
```bash
node scripts/sync_all.js
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Switch to Select & Move Tool |
| `R` | Switch to Box Creation Tool |
| `[` | Toggle Left Drawer Panel (Elements, Inspector, CSS) |
| `Ctrl + Z` | Undo last canvas action |
| `Ctrl + Shift + Z` | Redo last canvas action |
| `Ctrl + S` | Apply manual code edits from editor directly to canvas |
| `Delete` / `Backspace` | Delete currently selected element |
| `Double-Click Split Divider` | Reset split view panes to 50:50 balance |

---

## 🤝 Contributing

Contributions, feature requests, and suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author & Credits

Developed with ❤️ for web design educators, students, and modern web developers.  
**Live Web App:** [https://niancode.netlify.app/](https://niancode.netlify.app/)  
**Repository:** [https://github.com/syfxai/nian-code-studio](https://github.com/syfxai/nian-code-studio)
