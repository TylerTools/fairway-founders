"""
Fairway Founders Network — web asset package builder.
Generates: favicons, app icons, OG image, Twitter card, manifest, HTML snippet.
"""
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = "/sessions/gallant-dazzling-dirac/mnt/outputs/fairway-founders-web"
os.makedirs(OUT, exist_ok=True)

# Brand colors
DARK_GREEN = (46, 93, 58)          # #2E5D3A
LIGHT_GREEN = (124, 179, 66)        # #7CB342
ORANGE = (232, 163, 61)             # #E8A33D
CREAM = (245, 241, 232)             # #F5F1E8
BLACK_BG = (10, 14, 12)             # near-black
INK = (31, 45, 36)                  # #1F2D24
INK_SOFT = (90, 105, 92)

# ---------------------------------------------------------------------------
# 1. Render the icon SVG to a high-res master PNG with ImageMagick / rsvg
# ---------------------------------------------------------------------------
def svg_to_png(svg_path, png_path, size):
    # Use ImageMagick to rasterize the SVG
    subprocess.run([
        "convert", "-background", "none", "-density", "300",
        "-resize", f"{size}x{size}", svg_path, png_path
    ], check=True)

svg_path = os.path.join(OUT, "icon.svg")
master_path = os.path.join(OUT, "icon-master-1024.png")
svg_to_png(svg_path, master_path, 1024)
print("master icon rendered")

master = Image.open(master_path).convert("RGBA")

# ---------------------------------------------------------------------------
# 2. Favicon sizes (transparent)
# ---------------------------------------------------------------------------
favicon_sizes = [16, 32, 48, 64, 96, 128, 192, 256, 512]
for s in favicon_sizes:
    img = master.resize((s, s), Image.LANCZOS)
    img.save(os.path.join(OUT, f"favicon-{s}x{s}.png"), "PNG")

# Multi-resolution .ico
ico_imgs = [master.resize((s, s), Image.LANCZOS) for s in [16, 32, 48, 64]]
ico_imgs[0].save(os.path.join(OUT, "favicon.ico"), format="ICO",
                 sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("favicons done")

# ---------------------------------------------------------------------------
# 3. Apple touch icon — needs a solid background (iOS strips transparency)
# ---------------------------------------------------------------------------
def make_apple_touch(size, bg, padding_ratio=0.18, save_name=None):
    bg_img = Image.new("RGBA", (size, size), bg + (255,))
    icon_size = int(size * (1 - padding_ratio * 2))
    icon = master.resize((icon_size, icon_size), Image.LANCZOS)
    bg_img.paste(icon, ((size - icon_size) // 2, (size - icon_size) // 2), icon)
    if save_name:
        bg_img.convert("RGB").save(os.path.join(OUT, save_name), "PNG", quality=95)
    return bg_img

make_apple_touch(180, CREAM, save_name="apple-touch-icon.png")
make_apple_touch(180, CREAM, save_name="apple-touch-icon-180x180.png")
make_apple_touch(152, CREAM, save_name="apple-touch-icon-152x152.png")
make_apple_touch(167, CREAM, save_name="apple-touch-icon-167x167.png")
make_apple_touch(120, CREAM, save_name="apple-touch-icon-120x120.png")
print("apple touch icons done")

# ---------------------------------------------------------------------------
# 4. Android / PWA icons (with safe padding)
# ---------------------------------------------------------------------------
def make_android(size, bg):
    bg_img = Image.new("RGBA", (size, size), bg + (255,))
    icon_size = int(size * 0.72)
    icon = master.resize((icon_size, icon_size), Image.LANCZOS)
    bg_img.paste(icon, ((size - icon_size) // 2, (size - icon_size) // 2), icon)
    bg_img.convert("RGB").save(
        os.path.join(OUT, f"android-chrome-{size}x{size}.png"), "PNG"
    )

make_android(192, CREAM)
make_android(512, CREAM)
# Maskable variant (Android adaptive icon) — uses full bleed background
def make_maskable(size, bg):
    bg_img = Image.new("RGBA", (size, size), bg + (255,))
    icon_size = int(size * 0.6)  # smaller for safe zone
    icon = master.resize((icon_size, icon_size), Image.LANCZOS)
    bg_img.paste(icon, ((size - icon_size) // 2, (size - icon_size) // 2), icon)
    bg_img.convert("RGB").save(
        os.path.join(OUT, f"maskable-icon-{size}x{size}.png"), "PNG"
    )

make_maskable(512, CREAM)
make_maskable(192, CREAM)
print("android/pwa icons done")

# ---------------------------------------------------------------------------
# 5. Safari pinned tab SVG (monochrome silhouette of the icon)
# ---------------------------------------------------------------------------
pinned_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path d="M 40 320 Q 256 180 472 320 Q 256 290 40 320 Z
           M 150 312 Q 256 250 362 312 Q 256 300 150 312 Z
           M 262 120 h 6 v 200 h -6 z
           M 268 128 L 360 152 L 268 178 Z" fill="black"/>
</svg>'''
with open(os.path.join(OUT, "safari-pinned-tab.svg"), "w") as f:
    f.write(pinned_svg)
print("safari pinned tab done")

# ---------------------------------------------------------------------------
# 6. Helper: load a usable font
# ---------------------------------------------------------------------------
def load_font(size, bold=False):
    candidates_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    candidates_reg = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in (candidates_bold if bold else candidates_reg):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# ---------------------------------------------------------------------------
# 7. Open Graph image (1200x630) — cream + premium
# ---------------------------------------------------------------------------
def build_og(w=1200, h=630, tagline="Where Founders Connect."):
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img, "RGBA")

    # Subtle radial fairway curve in background
    curve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(curve)
    cd.ellipse([-200, h - 180, w + 200, h + 600],
               fill=LIGHT_GREEN + (45,))
    cd.ellipse([100, h - 80, w - 100, h + 500],
               fill=DARK_GREEN + (55,))
    img.paste(curve, (0, 0), curve)

    # Icon — left side
    icon_size = 320
    icon = master.resize((icon_size, icon_size), Image.LANCZOS)
    icon_x, icon_y = 90, (h - icon_size) // 2 - 20
    img.paste(icon, (icon_x, icon_y), icon)

    # Vertical divider
    d.rectangle([icon_x + icon_size + 60, 180,
                 icon_x + icon_size + 62, h - 180],
                fill=DARK_GREEN + (180,))

    # Text block
    tx = icon_x + icon_size + 110
    title_font = load_font(96, bold=True)
    sub_font = load_font(34, bold=True)
    tag_font = load_font(28, bold=False)

    # FAIRWAY title
    d.text((tx, 200), "FAIRWAY", font=title_font, fill=DARK_GREEN)
    # underline accent
    d.rectangle([tx, 318, tx + 60, 326], fill=ORANGE)
    # Subtitle
    d.text((tx, 345), "FOUNDERS NETWORK", font=sub_font,
           fill=INK, spacing=4)
    # Tagline (only if room and provided)
    if tagline:
        d.text((tx, 415), tagline, font=tag_font, fill=INK_SOFT)

    img.save(os.path.join(OUT, "og-image.png"), "PNG", quality=95, optimize=True)
    img.save(os.path.join(OUT, "og-image.jpg"), "JPEG", quality=90, optimize=True)
    return img

build_og()
print("og image done")

# Twitter card (same dims work fine, but make a 1200x600 variant too)
def build_twitter(w=1200, h=600):
    img = build_og(w=1200, h=630)
    # crop top/bottom slightly to 600 height ratio
    img2 = Image.new("RGB", (w, h), CREAM)
    src = img.resize((w, int(h * (img.height / img.width) * (w / img.width))),
                      Image.LANCZOS) if False else img
    # Just paste centered
    src = img.crop((0, 15, w, 615))
    src.save(os.path.join(OUT, "twitter-card.png"), "PNG", quality=95)

build_twitter()
print("twitter card done")

# ---------------------------------------------------------------------------
# 8. Dark variant OG (just in case)
# ---------------------------------------------------------------------------
def build_og_dark(w=1200, h=630, tagline="Where Founders Connect."):
    img = Image.new("RGB", (w, h), BLACK_BG)
    d = ImageDraw.Draw(img, "RGBA")

    icon_size = 320
    icon = master.resize((icon_size, icon_size), Image.LANCZOS)
    icon_x, icon_y = 90, (h - icon_size) // 2 - 20
    img.paste(icon, (icon_x, icon_y), icon)

    d.rectangle([icon_x + icon_size + 60, 180,
                 icon_x + icon_size + 62, h - 180],
                fill=(255, 255, 255, 120))

    tx = icon_x + icon_size + 110
    title_font = load_font(96, bold=True)
    sub_font = load_font(34, bold=True)
    tag_font = load_font(28, bold=False)

    d.text((tx, 200), "FAIRWAY", font=title_font, fill=CREAM)
    d.rectangle([tx, 318, tx + 60, 326], fill=ORANGE)
    d.text((tx, 345), "FOUNDERS NETWORK", font=sub_font,
           fill=(180, 200, 185), spacing=4)
    if tagline:
        d.text((tx, 415), tagline, font=tag_font, fill=(160, 175, 165))

    img.save(os.path.join(OUT, "og-image-dark.png"), "PNG", quality=95, optimize=True)

build_og_dark()
print("og dark done")

# ---------------------------------------------------------------------------
# 9. site.webmanifest
# ---------------------------------------------------------------------------
manifest = '''{
  "name": "Fairway Founders Network",
  "short_name": "Fairway",
  "description": "Fairway Founders Network — where founders connect.",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "theme_color": "#2E5D3A",
  "background_color": "#F5F1E8",
  "display": "standalone",
  "start_url": "/"
}'''
with open(os.path.join(OUT, "site.webmanifest"), "w") as f:
    f.write(manifest)

# browserconfig.xml (Windows tiles)
browserconfig = '''<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/favicon-192x192.png"/>
      <TileColor>#2E5D3A</TileColor>
    </tile>
  </msapplication>
</browserconfig>'''
with open(os.path.join(OUT, "browserconfig.xml"), "w") as f:
    f.write(browserconfig)

# ---------------------------------------------------------------------------
# 10. HTML <head> snippet
# ---------------------------------------------------------------------------
head_html = '''<!-- Fairway Founders Network — Favicons & Social -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2E5D3A">
<link rel="manifest" href="/site.webmanifest">
<meta name="msapplication-config" content="/browserconfig.xml">
<meta name="msapplication-TileColor" content="#2E5D3A">
<meta name="theme-color" content="#2E5D3A">

<!-- Primary Meta -->
<title>Fairway Founders Network</title>
<meta name="description" content="Fairway Founders Network — where founders connect, talk shop, and build deals on the course.">

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fairway Founders Network">
<meta property="og:title" content="Fairway Founders Network">
<meta property="og:description" content="Where founders connect, talk shop, and build deals on the course.">
<meta property="og:url" content="https://YOURDOMAIN.com">
<meta property="og:image" content="https://YOURDOMAIN.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Fairway Founders Network logo">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Fairway Founders Network">
<meta name="twitter:description" content="Where founders connect, talk shop, and build deals on the course.">
<meta name="twitter:image" content="https://YOURDOMAIN.com/og-image.png">
'''
with open(os.path.join(OUT, "head-snippet.html"), "w") as f:
    f.write(head_html)

# ---------------------------------------------------------------------------
# 11. README
# ---------------------------------------------------------------------------
readme = '''# Fairway Founders Network — Web Asset Package

## What's inside

### Favicons (drop in root of site)
- favicon.ico                     (multi-res 16/32/48/64)
- favicon-16x16.png ... favicon-512x512.png

### Apple / iOS
- apple-touch-icon.png            (180x180, default)
- apple-touch-icon-180x180.png
- apple-touch-icon-167x167.png    (iPad Pro)
- apple-touch-icon-152x152.png    (iPad)
- apple-touch-icon-120x120.png    (iPhone)

### Android / PWA
- android-chrome-192x192.png
- android-chrome-512x512.png
- maskable-icon-192x192.png       (adaptive icon, safe zone)
- maskable-icon-512x512.png

### Safari pinned tab
- safari-pinned-tab.svg           (monochrome)

### Social share
- og-image.png       (1200x630, cream/premium — primary)
- og-image.jpg       (same, JPEG fallback)
- og-image-dark.png  (1200x630, dark variant — bonus)
- twitter-card.png   (1200x600)

### Config
- site.webmanifest
- browserconfig.xml

### Drop-in
- head-snippet.html  — paste into <head> on every page
- icon.svg           — vector source of the extracted icon (use anywhere)
- icon-master-1024.png — high-res raster master

## Install

1. Copy all files (except this README, build.py, and head-snippet.html) into
   the root of your site (next to index.html).
2. Open head-snippet.html, copy its contents into the <head> of every page.
3. Replace YOURDOMAIN.com with your real domain in the og:url and twitter image tags.
4. Validate:
   - Favicon: https://realfavicongenerator.net/favicon_checker
   - OG card: https://www.opengraph.xyz/  or  https://metatags.io/
   - Twitter: https://cards-dev.twitter.com/validator

## Brand colors used
- Dark green:  #2E5D3A
- Light green: #7CB342
- Orange:      #E8A33D
- Cream:       #F5F1E8
- Ink:         #1F2D24
'''
with open(os.path.join(OUT, "README.md"), "w") as f:
    f.write(readme)

print("ALL DONE")
print("Files in:", OUT)
for f in sorted(os.listdir(OUT)):
    full = os.path.join(OUT, f)
    print(f"  {f:40s} {os.path.getsize(full):>10,} bytes")
