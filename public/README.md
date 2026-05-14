# Fairway Founders Network — Web Asset Package

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
