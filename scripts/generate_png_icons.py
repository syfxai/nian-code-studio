import os
from PIL import Image, ImageDraw

# Ensure target folder exists
OUT_DIR = os.path.join("assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Generate supersampled 256x256 icons downscaled to 128x128 for ultra-crisp antialiasing
CANVAS_SIZE = 256
FINAL_SIZE = (128, 128)

CYAN = (111, 227, 255, 255)
SKY = (56, 189, 248, 255)
WHITE = (255, 255, 255, 255)
BLUE_BG = (10, 42, 98, 255)
AMBER = (245, 158, 11, 255)
RED = (244, 63, 94, 255)
GREEN = (16, 185, 129, 255)
PURPLE = (168, 85, 247, 255)
MUTED = (148, 163, 184, 255)

def create_base():
    return Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

def save_icon(img, filename):
    downscaled = img.resize(FINAL_SIZE, Image.Resampling.LANCZOS)
    path = os.path.join(OUT_DIR, filename)
    downscaled.save(path, "PNG", optimize=True)
    print(f"Created: {path}")

# ==========================================
# 1. UNDO & REDO
# ==========================================
def make_undo():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Curved arrow left
    draw.arc([50, 70, 200, 210], start=180, end=350, fill=CYAN, width=18)
    draw.polygon([(40, 100), (90, 60), (90, 140)], fill=CYAN)
    save_icon(img, "undo.png")

def make_redo():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Curved arrow right
    draw.arc([56, 70, 206, 210], start=190, end=0, fill=CYAN, width=18)
    draw.polygon([(216, 100), (166, 60), (166, 140)], fill=CYAN)
    save_icon(img, "redo.png")

# ==========================================
# 2. ZOOM CONTROLS
# ==========================================
def make_zoom_in():
    img = create_base()
    draw = ImageDraw.Draw(img)
    draw.ellipse([40, 40, 160, 160], outline=CYAN, width=16)
    draw.line([145, 145, 215, 215], fill=CYAN, width=20)
    # Plus sign
    draw.line([75, 100, 125, 100], fill=WHITE, width=14)
    draw.line([100, 75, 100, 125], fill=WHITE, width=14)
    save_icon(img, "zoom-in.png")

def make_zoom_out():
    img = create_base()
    draw = ImageDraw.Draw(img)
    draw.ellipse([40, 40, 160, 160], outline=CYAN, width=16)
    draw.line([145, 145, 215, 215], fill=CYAN, width=20)
    # Minus sign
    draw.line([75, 100, 125, 100], fill=WHITE, width=14)
    save_icon(img, "zoom-out.png")

def make_zoom_reset():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Frame target corners
    l = 30
    draw.line([40, 70, 40, 40], fill=CYAN, width=14)
    draw.line([40, 40, 70, 40], fill=CYAN, width=14)
    draw.line([216, 70, 216, 40], fill=CYAN, width=14)
    draw.line([216, 40, 186, 40], fill=CYAN, width=14)
    draw.line([40, 186, 40, 216], fill=CYAN, width=14)
    draw.line([40, 216, 70, 216], fill=CYAN, width=14)
    draw.line([216, 186, 216, 216], fill=CYAN, width=14)
    draw.line([216, 216, 186, 216], fill=CYAN, width=14)
    # Center dot
    draw.ellipse([110, 110, 146, 146], fill=WHITE)
    save_icon(img, "zoom-reset.png")

# ==========================================
# 3. EXPORT / DOWNLOAD PROJECT
# ==========================================
def make_export():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Tray
    draw.line([40, 150, 40, 210], fill=GREEN, width=16)
    draw.line([32, 210, 224, 210], fill=GREEN, width=16)
    draw.line([216, 150, 216, 210], fill=GREEN, width=16)
    # Down arrow
    draw.line([128, 40, 128, 160], fill=WHITE, width=16)
    draw.polygon([(85, 140), (128, 185), (171, 140)], fill=WHITE)
    save_icon(img, "export.png")

# ==========================================
# 4. TRASH & CLOSE
# ==========================================
def make_trash():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Can
    draw.polygon([(65, 85), (191, 85), (175, 220), (81, 220)], outline=RED, fill=(244, 63, 94, 40), width=12)
    # Lid
    draw.line([45, 75, 211, 75], fill=RED, width=14)
    draw.arc([105, 45, 151, 80], start=180, end=360, fill=RED, width=12)
    # Slats
    draw.line([105, 115, 105, 195], fill=WHITE, width=8)
    draw.line([128, 115, 128, 195], fill=WHITE, width=8)
    draw.line([151, 115, 151, 195], fill=WHITE, width=8)
    save_icon(img, "trash.png")

def make_close():
    img = create_base()
    draw = ImageDraw.Draw(img)
    draw.ellipse([30, 30, 226, 226], fill=(244, 63, 94, 50), outline=RED, width=12)
    draw.line([80, 80, 176, 176], fill=WHITE, width=16)
    draw.line([176, 80, 80, 176], fill=WHITE, width=16)
    save_icon(img, "close.png")

# ==========================================
# 5. MODES (Visual, Split, Code, Grid, Nodes, Preview)
# ==========================================
def make_mode_visual():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Eye shape
    draw.arc([35, 75, 221, 181], start=0, end=180, fill=CYAN, width=14)
    draw.arc([35, 75, 221, 181], start=180, end=360, fill=CYAN, width=14)
    draw.ellipse([98, 98, 158, 158], fill=WHITE)
    draw.ellipse([116, 116, 140, 140], fill=(4, 32, 79, 255))
    save_icon(img, "mode-visual.png")

def make_mode_split():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Outer rectangle
    draw.rounded_rectangle([35, 45, 221, 211], radius=24, outline=CYAN, width=14)
    # Split divider
    draw.line([128, 45, 128, 211], fill=WHITE, width=12)
    # Left lines (visual)
    draw.rounded_rectangle([55, 75, 108, 120], radius=8, fill=SKY)
    draw.line([55, 145, 108, 145], fill=MUTED, width=8)
    draw.line([55, 175, 95, 175], fill=MUTED, width=8)
    # Right lines (code)
    draw.line([148, 85, 200, 85], fill=AMBER, width=8)
    draw.line([148, 115, 185, 115], fill=WHITE, width=8)
    draw.line([148, 145, 200, 145], fill=CYAN, width=8)
    draw.line([148, 175, 175, 175], fill=MUTED, width=8)
    save_icon(img, "mode-split.png")

def make_mode_code():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Left bracket <
    draw.line([100, 70, 45, 128], fill=AMBER, width=18)
    draw.line([45, 128, 100, 186], fill=AMBER, width=18)
    # Slash /
    draw.line([145, 60, 111, 196], fill=WHITE, width=16)
    # Right bracket >
    draw.line([156, 70, 211, 128], fill=CYAN, width=18)
    draw.line([211, 128, 156, 186], fill=CYAN, width=18)
    save_icon(img, "mode-code.png")

def make_mode_grid():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # 3x3 blueprint grid with glowing border
    draw.rounded_rectangle([35, 35, 221, 221], radius=16, outline=CYAN, width=14)
    draw.line([97, 35, 97, 221], fill=SKY, width=10)
    draw.line([159, 35, 159, 221], fill=SKY, width=10)
    draw.line([35, 97, 221, 97], fill=SKY, width=10)
    draw.line([35, 159, 221, 159], fill=SKY, width=10)
    save_icon(img, "mode-grid.png")

def make_mode_nodes():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Three connected circular nodes
    # Links
    draw.line([75, 80, 180, 80], fill=CYAN, width=12)
    draw.line([75, 80, 128, 185], fill=CYAN, width=12)
    draw.line([180, 80, 128, 185], fill=CYAN, width=12)
    # Node circles
    draw.ellipse([45, 50, 105, 110], fill=WHITE, outline=SKY, width=10)
    draw.ellipse([150, 50, 210, 110], fill=WHITE, outline=SKY, width=10)
    draw.ellipse([98, 155, 158, 215], fill=AMBER, outline=WHITE, width=10)
    save_icon(img, "mode-nodes.png")

def make_mode_preview():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Browser window
    draw.rounded_rectangle([35, 45, 221, 211], radius=20, outline=CYAN, width=14)
    # Window title bar
    draw.line([35, 95, 221, 95], fill=CYAN, width=10)
    draw.ellipse([55, 65, 75, 85], fill=RED)
    draw.ellipse([85, 65, 105, 85], fill=AMBER)
    draw.ellipse([115, 65, 135, 85], fill=GREEN)
    # Play arrow inside preview
    draw.polygon([(110, 125), (160, 155), (110, 185)], fill=WHITE)
    save_icon(img, "mode-preview.png")

# ==========================================
# 6. GURU AI & INSPECTOR
# ==========================================
def make_ai_guru():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Robot Head
    draw.rounded_rectangle([50, 65, 206, 205], radius=28, fill=(16, 32, 70, 255), outline=CYAN, width=14)
    # Antenna
    draw.line([128, 25, 128, 65], fill=CYAN, width=12)
    draw.ellipse([116, 15, 140, 39], fill=AMBER)
    # Glowing Eyes
    draw.rounded_rectangle([75, 105, 115, 135], radius=10, fill=CYAN)
    draw.rounded_rectangle([141, 105, 181, 135], radius=10, fill=CYAN)
    # Smile / soundwave mouth
    draw.line([85, 170, 105, 170], fill=WHITE, width=8)
    draw.line([115, 162, 115, 178], fill=AMBER, width=8)
    draw.line([128, 158, 128, 182], fill=WHITE, width=8)
    draw.line([141, 162, 141, 178], fill=AMBER, width=8)
    draw.line([151, 170, 171, 170], fill=WHITE, width=8)
    save_icon(img, "ai-guru.png")

def make_inspector():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Target crosshair box
    draw.rectangle([50, 50, 206, 206], outline=SKY, width=10)
    # Inspect cursor arrow
    draw.polygon([(90, 80), (170, 140), (135, 145), (160, 195), (140, 205), (115, 155), (90, 175)], fill=WHITE, outline=CYAN, width=6)
    save_icon(img, "inspector.png")

# ==========================================
# 7. TABS: HTML & CSS STUDIO
# ==========================================
def make_tab_html():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Document sheet with folded corner
    draw.polygon([(60, 40), (155, 40), (200, 85), (200, 216), (60, 216)], outline=CYAN, fill=(8, 30, 72, 255), width=12)
    draw.line([155, 40, 155, 85], fill=CYAN, width=10)
    draw.line([155, 85, 200, 85], fill=CYAN, width=10)
    # Code tag <> inside
    draw.line([105, 125, 85, 145], fill=AMBER, width=10)
    draw.line([85, 145, 105, 165], fill=AMBER, width=10)
    draw.line([155, 125, 175, 145], fill=WHITE, width=10)
    draw.line([175, 145, 155, 165], fill=WHITE, width=10)
    draw.line([138, 120, 122, 170], fill=CYAN, width=8)
    save_icon(img, "tab-html.png")

def make_tab_css():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Painter Palette
    draw.ellipse([45, 45, 211, 211], outline=PURPLE, fill=(18, 20, 60, 255), width=12)
    # Thumb hole
    draw.ellipse([145, 145, 185, 185], fill=(4, 16, 45, 255), outline=PURPLE, width=8)
    # Color dabs
    draw.ellipse([75, 75, 105, 105], fill=CYAN)
    draw.ellipse([135, 65, 165, 95], fill=AMBER)
    draw.ellipse([80, 135, 110, 165], fill=RED)
    draw.ellipse([160, 105, 180, 125], fill=GREEN)
    save_icon(img, "tab-css.png")

# ==========================================
# 8. VIEWPORTS (Mobile, Tablet, Desktop)
# ==========================================
def make_view_mobile():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Phone body
    draw.rounded_rectangle([75, 35, 181, 221], radius=26, outline=CYAN, fill=(8, 28, 68, 255), width=12)
    # Speaker top pill
    draw.line([110, 55, 146, 55], fill=MUTED, width=6)
    # Home line
    draw.line([114, 205, 142, 205], fill=WHITE, width=8)
    # Screen rect
    draw.rectangle([89, 70, 167, 190], fill=(20, 50, 110, 255))
    save_icon(img, "view-mobile.png")

def make_view_tablet():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Tablet body
    draw.rounded_rectangle([55, 40, 201, 216], radius=22, outline=CYAN, fill=(8, 28, 68, 255), width=12)
    # Screen rect
    draw.rectangle([70, 60, 186, 196], fill=(20, 50, 110, 255))
    # Top camera
    draw.ellipse([124, 48, 132, 56], fill=WHITE)
    save_icon(img, "view-tablet.png")

def make_view_desktop():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Monitor screen
    draw.rounded_rectangle([35, 45, 221, 175], radius=16, outline=CYAN, fill=(8, 28, 68, 255), width=12)
    draw.rectangle([47, 57, 209, 163], fill=(20, 50, 110, 255))
    # Stand neck
    draw.line([128, 175, 128, 205], fill=CYAN, width=14)
    # Stand base
    draw.line([90, 205, 166, 205], fill=WHITE, width=14)
    save_icon(img, "view-desktop.png")

# ==========================================
# 9. DIMENSION & THEME WAND
# ==========================================
def make_dimension():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Ruler / Calipers
    draw.polygon([(45, 211), (211, 45), (225, 59), (59, 225)], fill=AMBER)
    # Measurement tick marks
    ticks = [(85, 171), (115, 141), (145, 111), (175, 81)]
    for tx, ty in ticks:
        draw.line([tx, ty, tx - 15, ty + 15], fill=WHITE, width=6)
    save_icon(img, "tool-dimension.png")

def make_theme_wand():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Sparkle stars
    def star(cx, cy, r):
        draw.polygon([(cx, cy - r), (cx + r//3, cy - r//3), (cx + r, cy), (cx + r//3, cy + r//3),
                      (cx, cy + r), (cx - r//3, cy + r//3), (cx - r, cy), (cx - r//3, cy - r//3)], fill=AMBER)
    star(128, 65, 36)
    star(65, 128, 22)
    star(190, 150, 22)
    star(110, 185, 18)
    save_icon(img, "tool-theme.png")

# ==========================================
# 10. CANVAS THEMES (Blueprint, Light, Dark, Mint)
# ==========================================
def make_theme_blueprint():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Blueprint grid tile with lightning bolt
    draw.rectangle([45, 45, 211, 211], outline=CYAN, fill=(11, 61, 145, 255), width=10)
    draw.line([45, 128, 211, 128], fill=SKY, width=4)
    draw.line([128, 45, 128, 211], fill=SKY, width=4)
    # Lightning bolt
    draw.polygon([(135, 60), (100, 125), (135, 125), (120, 195), (160, 115), (130, 115)], fill=CYAN)
    save_icon(img, "theme-blueprint.png")

def make_theme_light():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Sun rays
    draw.ellipse([80, 80, 176, 176], fill=WHITE, outline=AMBER, width=10)
    rays = [(128, 45, 128, 70), (128, 186, 128, 211),
            (45, 128, 70, 128), (186, 128, 211, 128),
            (70, 70, 88, 88), (168, 168, 186, 186),
            (186, 70, 168, 88), (70, 186, 88, 168)]
    for x1, y1, x2, y2 in rays:
        draw.line([x1, y1, x2, y2], fill=AMBER, width=8)
    save_icon(img, "theme-light.png")

def make_theme_dark():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Crescent moon
    draw.ellipse([50, 50, 190, 190], fill=CYAN)
    draw.ellipse([90, 40, 210, 180], fill=(4, 16, 45, 255))
    # Star
    draw.polygon([(185, 75), (190, 90), (205, 95), (190, 100), (185, 115), (180, 100), (165, 95), (180, 90)], fill=WHITE)
    save_icon(img, "theme-dark.png")

def make_theme_mint():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Sprout leaf
    draw.ellipse([70, 60, 186, 176], fill=GREEN)
    draw.ellipse([95, 60, 205, 176], fill=(4, 25, 45, 255))
    draw.arc([75, 120, 180, 210], start=45, end=135, fill=GREEN, width=12)
    save_icon(img, "theme-mint.png")

# ==========================================
# 11. CODE EDITOR CONTROLS & ALERT
# ==========================================
def make_code_view():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Eye
    draw.arc([45, 80, 211, 176], start=0, end=180, fill=CYAN, width=12)
    draw.arc([45, 80, 211, 176], start=180, end=360, fill=CYAN, width=12)
    draw.ellipse([110, 110, 146, 146], fill=WHITE)
    save_icon(img, "code-view.png")

def make_code_edit():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Pencil
    draw.polygon([(60, 196), (75, 150), (165, 60), (196, 91), (106, 181)], fill=AMBER, outline=WHITE, width=8)
    draw.polygon([(60, 196), (75, 180), (60, 165)], fill=WHITE)
    save_icon(img, "code-edit.png")

def make_code_sync():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Circular sync arrows
    draw.arc([55, 55, 201, 201], start=30, end=150, fill=GREEN, width=14)
    draw.polygon([(65, 140), (85, 165), (50, 175)], fill=GREEN)
    draw.arc([55, 55, 201, 201], start=210, end=330, fill=GREEN, width=14)
    draw.polygon([(191, 116), (171, 91), (206, 81)], fill=GREEN)
    save_icon(img, "code-sync.png")

def make_code_restore():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Restore arrow
    draw.arc([55, 55, 201, 201], start=60, end=330, fill=WHITE, width=14)
    draw.polygon([(60, 80), (105, 50), (100, 100)], fill=WHITE)
    save_icon(img, "code-restore.png")

def make_alert_warn():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Warning triangle
    draw.polygon([(128, 40), (225, 205), (31, 205)], fill=RED, outline=WHITE, width=8)
    # Exclamation mark
    draw.line([128, 90, 128, 150], fill=WHITE, width=16)
    draw.ellipse([120, 170, 136, 186], fill=WHITE)
    save_icon(img, "alert-warn.png")

# ==========================================
# 12. PAGES & SITEMAP ICONS
# ==========================================
def make_page_home():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Roof
    draw.polygon([(128, 45), (45, 115), (211, 115)], fill=CYAN)
    # Base
    draw.rectangle([65, 115, 191, 211], fill=WHITE)
    # Door
    draw.rounded_rectangle([108, 145, 148, 211], radius=8, fill=(10, 42, 98, 255))
    save_icon(img, "page-home.png")

def make_page_add():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Dashed/glowing circle
    draw.ellipse([45, 45, 211, 211], outline=CYAN, fill=(10, 42, 98, 150), width=10)
    # Plus sign
    draw.line([128, 80, 128, 176], fill=WHITE, width=16)
    draw.line([80, 128, 176, 128], fill=WHITE, width=16)
    save_icon(img, "page-add.png")

# ==========================================
# 13. SEMANTIC HTML ELEMENTS
# ==========================================
def make_elem_header():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Web frame
    draw.rounded_rectangle([35, 45, 221, 211], radius=16, outline=MUTED, width=8)
    # Highlighted header bar
    draw.rounded_rectangle([39, 49, 217, 95], radius=12, fill=CYAN)
    save_icon(img, "elem-header.png")

def make_elem_nav():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Horizontal nav pill bar
    draw.rounded_rectangle([40, 95, 216, 161], radius=16, outline=CYAN, fill=(12, 35, 80, 255), width=10)
    draw.ellipse([65, 118, 85, 138], fill=AMBER)
    draw.line([100, 128, 130, 128], fill=WHITE, width=8)
    draw.line([145, 128, 175, 128], fill=WHITE, width=8)
    draw.line([190, 128, 200, 128], fill=CYAN, width=8)
    save_icon(img, "elem-nav.png")

def make_elem_hero():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Hero container with banner spotlight
    draw.rounded_rectangle([35, 45, 221, 211], radius=16, outline=CYAN, fill=(15, 40, 95, 255), width=10)
    draw.line([60, 85, 150, 85], fill=WHITE, width=14)
    draw.line([60, 115, 185, 115], fill=MUTED, width=8)
    draw.line([60, 135, 140, 135], fill=MUTED, width=8)
    draw.rounded_rectangle([60, 160, 125, 190], radius=8, fill=AMBER)
    save_icon(img, "elem-hero.png")

def make_elem_text():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Paragraph lines
    draw.line([50, 60, 206, 60], fill=WHITE, width=14)
    draw.line([50, 105, 180, 105], fill=MUTED, width=12)
    draw.line([50, 150, 206, 150], fill=MUTED, width=12)
    draw.line([50, 195, 130, 195], fill=CYAN, width=12)
    save_icon(img, "elem-text.png")

def make_elem_button():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Interactive Button pill
    draw.rounded_rectangle([45, 85, 211, 171], radius=24, fill=AMBER, outline=WHITE, width=8)
    draw.line([95, 128, 161, 128], fill=(12, 24, 50, 255), width=12)
    save_icon(img, "elem-button.png")

def make_elem_image():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Frame
    draw.rounded_rectangle([40, 45, 216, 211], radius=16, outline=CYAN, fill=(10, 30, 70, 255), width=10)
    # Sun
    draw.ellipse([65, 75, 105, 115], fill=AMBER)
    # Mountains
    draw.polygon([(50, 195), (115, 120), (160, 170), (195, 130), (206, 195)], fill=SKY)
    save_icon(img, "elem-image.png")

def make_elem_card():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Card frame
    draw.rounded_rectangle([50, 40, 206, 216], radius=16, outline=CYAN, fill=(14, 38, 86, 255), width=10)
    draw.rounded_rectangle([65, 55, 191, 115], radius=8, fill=SKY)
    draw.line([65, 140, 150, 140], fill=WHITE, width=10)
    draw.line([65, 165, 180, 165], fill=MUTED, width=6)
    draw.line([65, 185, 120, 185], fill=AMBER, width=8)
    save_icon(img, "elem-card.png")

def make_elem_footer():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Web frame with highlighted bottom dock
    draw.rounded_rectangle([35, 45, 221, 211], radius=16, outline=MUTED, width=8)
    draw.rounded_rectangle([39, 165, 217, 207], radius=12, fill=CYAN)
    save_icon(img, "elem-footer.png")

def make_elem_form():
    img = create_base()
    draw = ImageDraw.Draw(img)
    # Form input field
    draw.rounded_rectangle([40, 75, 216, 135], radius=12, outline=CYAN, fill=(8, 25, 60, 255), width=8)
    draw.line([60, 92, 60, 118], fill=AMBER, width=6) # blinking cursor
    draw.line([75, 105, 135, 105], fill=MUTED, width=8)
    # Checkbox
    draw.rectangle([45, 165, 75, 195], outline=CYAN, width=6)
    draw.line([85, 180, 175, 180], fill=WHITE, width=8)
    save_icon(img, "elem-form.png")

def main():
    print("Generating all PNG icons freshly...")
    make_undo()
    make_redo()
    make_zoom_in()
    make_zoom_out()
    make_zoom_reset()
    make_export()
    make_trash()
    make_close()
    make_mode_visual()
    make_mode_split()
    make_mode_code()
    make_mode_grid()
    make_mode_nodes()
    make_mode_preview()
    make_ai_guru()
    make_inspector()
    make_tab_html()
    make_tab_css()
    make_view_mobile()
    make_view_tablet()
    make_view_desktop()
    make_dimension()
    make_theme_wand()
    make_theme_blueprint()
    make_theme_light()
    make_theme_dark()
    make_theme_mint()
    make_code_view()
    make_code_edit()
    make_code_sync()
    make_code_restore()
    make_alert_warn()
    make_page_home()
    make_page_add()
    make_elem_header()
    make_elem_nav()
    make_elem_hero()
    make_elem_text()
    make_elem_button()
    make_elem_image()
    make_elem_card()
    make_elem_footer()
    make_elem_form()
    print("ALL PNG ICONS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
