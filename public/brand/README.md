# Safar-e-Anbiya — Logo & Icon Pack

Brand mark for **Safar-e-Anbiya · Journey of the Prophets** (safar-anbiya.gennoor.com).
The guiding lantern + eight-pointed star (Noor). Twilight navy & gold.

## Folders
- `svg/`  — vector masters (infinitely scalable; use these wherever possible)
- `png/`  — ready-to-use raster exports (favicons, app icons, transparent emblems)

## SVG masters
- `emblem-color.svg`        Full-colour lantern, transparent background (use on light)
- `emblem-glow.svg`         Colour lantern with soft halo (use on dark)
- `emblem-mono-cream.svg`   Single-colour cream outline (reverse / dark backgrounds)
- `emblem-mono-ink.svg`     Single-colour ink outline (one-colour print)
- `app-icon.svg`            Lantern on rounded navy tile
- `app-icon-maskable.svg`   Full-bleed square (Android maskable / safe zone)

## PNG exports
- `favicon-16/32/48.png`        Browser tab favicons
- `icon-64.png`                 Small UI icon
- `apple-touch-icon-180.png`    iOS home-screen icon
- `icon-192.png / icon-512.png` PWA / Android icons (manifest)
- `icon-maskable-512.png`       Android maskable icon
- `emblem-256/512/1024.png`     Transparent emblem (with halo)
- `emblem-mono-512.png`         Transparent cream outline emblem

## Web setup (paste into <head>)
```html
<link rel="icon" type="image/png" sizes="32x32" href="/brand/png/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/brand/png/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/brand/png/apple-touch-icon-180.png">
<link rel="icon" type="image/svg+xml" href="/brand/svg/emblem-color.svg">
```

manifest.json:
```json
"icons": [
  { "src": "/brand/png/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/brand/png/icon-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/brand/png/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

## Colours
Twilight `#0C0820` · Royal `#1A1140` · Noor Gold `#F5C451` · Amber `#F0A93A` · Cream `#F4EEDE` · Emerald `#2E9E6B`

## Fonts
Display: **Fredoka** · Arabic: **Amiri** · Body: **Nunito**

## Note on .ico
A classic multi-size `favicon.ico` isn't included. Modern browsers use the PNG/SVG favicons above. If you need `.ico`, convert `favicon-32.png` with any online ICO converter.
