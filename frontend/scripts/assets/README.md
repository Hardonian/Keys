# Asset Generation Guide

This document contains generation recipes for all visual assets in the Keys application.

## Critical Assets (Required for Build)

### PWA/App Icons

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `/icon-192.png` | 192×192 | PNG | PWA icon, Apple touch icon |
| `/icon-512.png` | 512×512 | PNG | PWA icon, high-res displays |

**Generation Recipe:**
```
A minimalist app icon for "Keys" - a stylized key shape formed by 
interconnected geometric nodes in a blue-to-purple gradient 
(#2563eb to #8b5cf6). Clean lines, rounded corners (8px radius), 
transparent background. Modern developer tool aesthetic.
```

**Export Settings:**
- PNG with transparency
- 192×192 and 512×512 variants
- Place directly in `/public/` (not /assets/visuals/)

### Social Sharing Image

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `/og-image.png` | 1200×630 | PNG | Open Graph / Twitter card |

**Generation Recipe:**
```
Social sharing card for "Keys - Open Source Knowledge Library". 
Split layout: left side has bold "KEYS" logotype with tagline 
"Open Source Knowledge & Artifact Library" in Inter font. 
Right side features abstract illustration of connected knowledge 
nodes in blue-purple gradient. Background: subtle gradient from 
white to light blue-gray. Dimensions 1200×630. Professional, 
clean, developer-focused.
```

**Export Settings:**
- PNG, 1200×630px exact
- Place in `/public/og-image.png`
- File size target: <250KB

---

## UX Enhancement Assets

### Hero Visual

| File | Sizes | Format | Purpose |
|------|-------|--------|---------|
| `hero-visual.webp` | 800×600 (1x), 1600×1200 (2x) | WebP | Hero section illustration |

**Generation Recipe:**
```
Abstract illustration of interconnected knowledge nodes forming 
a network/graph pattern. Geometric style with circles (nodes) 
connected by lines (relationships). Color palette: blue (#2563eb) 
to purple (#8b5cf6) gradient accents on white/off-white background. 
Subtle glow effects on nodes. Clean, modern, represents "keys" 
unlocking knowledge connections. No text. Aspect ratio 4:3.
```

**Export Settings:**
- WebP format with transparency
- Generate at 1600×1200, then compress to 800×600 for 1x
- Target file sizes: 1x <80KB, 2x <200KB
- Place in `/public/assets/visuals/`

**Usage:**
```tsx
<Image
  src="/assets/visuals/hero-visual.webp"
  alt="Abstract illustration of interconnected knowledge nodes"
  width={800}
  height={600}
  priority
  className="w-full h-auto"
/>
```

### Empty State Illustration

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `empty-library.webp` | 400×300 | WebP | Library empty state |

**Generation Recipe:**
```
Minimalist illustration of an open empty bookshelf or library 
space with soft shadows. Color palette: soft grays with subtle 
blue-purple accent lighting. Geometric style matching the app 
theme. Represents "ready to be filled" state. Clean lines, 
modern aesthetic. Size: 400×300px.
```

**Export Settings:**
- WebP format
- Target: <40KB
- Place in `/public/assets/visuals/`

**Usage:**
```tsx
<Image
  src="/assets/visuals/empty-library.webp"
  alt="Empty library waiting for content"
  width={400}
  height={300}
  loading="lazy"
  className="mx-auto mb-4"
/>
```

---

## Feature Icons (SVG)

These are inline SVGs for crisp rendering at any size.

### Prompts Icon

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#2563eb" fill-opacity="0.1"/>
  <path d="M14 24H34M14 18H34M14 30H24" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
  <circle cx="34" cy="30" r="3" fill="#8b5cf6"/>
</svg>
```

### Notebooks Icon

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#8b5cf6" fill-opacity="0.1"/>
  <rect x="12" y="10" width="24" height="28" rx="2" stroke="#8b5cf6" stroke-width="2"/>
  <path d="M16 18H32M16 24H32M16 30H24" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### Runbooks Icon

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#2563eb" fill-opacity="0.1"/>
  <path d="M24 10L34 16V32L24 38L14 32V16L24 10Z" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>
  <path d="M24 20V28M20 24H28" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## Asset Validation

Run the validation script to check assets:

```bash
npm run validate-assets
```

Or with strict mode (fails CI):

```bash
ASSET_STRICT=1 npm run validate-assets
```

## Checklist for Adding Assets

- [ ] Generated in correct format (WebP preferred, PNG for icons)
- [ ] File size within budget (hero <200KB, icons <40KB)
- [ ] Alt text added for accessibility
- [ ] Width/height attributes set to prevent CLS
- [ ] Lazy loading for non-critical images
- [ ] Tested in both light and dark mode
- [ ] Responsive behavior verified

## Rollback

To disable new visuals, set the environment variable:

```bash
NEXT_PUBLIC_DISABLE_VISUALS=1
```

This will fall back to text-only/emoji states.
