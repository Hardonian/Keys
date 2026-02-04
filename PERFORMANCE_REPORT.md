# UI Hot Path Performance Report

## PHASE 0: Frontend Hot Path Candidate List

### Top 3 Routes by User Impact
1. **/ (Home)** - Landing page, first impression, highest traffic
2. **/library** - Core content discovery, primary value prop
3. **/signin** - Conversion-critical auth flow

### Route Analysis

| Route | Render Mode | Key Components | Above-Fold Content |
|-------|-------------|----------------|-------------------|
| / | SSG | HeroSection, Navigation | Hero visual, Stats, Feature cards |
| /library | SSR | LibraryIndexClient, FilterGroups | Search bar, Filter chips, Artifact grid |
| /signin | CSR (dynamic) | SignInContent, Suspense | Form fields, CTAs |

---

## PHASE 1: BASELINE INSTRUMENTATION

### Bundle Analysis
```bash
cd frontend && npm run build
```

**JS Chunk Distribution:**
| Chunk | Size | Impact |
|-------|------|--------|
| 8fdd54b1b9af6be2.js | 220KB | Largest - likely framer-motion + libs |
| cef00d4831b10f4a.js | 192KB | Secondary - UI components |
| 6bc0dacb9df4b20a.js | 116KB | Dashboard components |
| a6dad97d9634a72d.js | 112KB | Library components |
| **Total** | ~1.7MB | Heavy for SPA |

**CSS:**
- Single 91KB CSS bundle (4b7365ec3b7bbc5f.css)
- Contains ALL styles (Tailwind + custom template styles)

**Fonts:**
- InterVariable.woff2: 338KB
- InterVariable-Italic.woff2: 372KB
- Individual weights: ~106-109KB each
- **Total font payload: ~1.4MB** (all preloaded!)

### Critical Issues Identified

1. **Font Over-Preloading** - Loading both variable AND individual fonts
2. **Hero Image Missing** - Referenced but not present, causing layout shift
3. **Large CSS Bundle** - No critical CSS extraction
4. **Service Worker Sync Registration** - Blocks main thread
5. **No DNS Prefetch** - External GitHub links delay connection setup

---

## PHASE 2: UI HOT PATH SCOREBOARD

### Ranked Issues (by weighted impact)

| Rank | Issue | LCP | INP | CLS | Bytes | Weight | Score |
|------|-------|-----|-----|-----|-------|--------|-------|
| 1 | Font over-preloading (338KB+ blocking) | +3 | +2 | 0 | +2 | 7 | **Critical** |
| 2 | Hero image missing (layout shift) | +3 | 0 | +3 | 0 | 6 | **Critical** |
| 3 | Large initial CSS (91KB render-blocking) | +2 | 0 | +1 | +2 | 5 | **High** |
| 4 | Service worker sync load | +1 | +2 | 0 | 0 | 3 | **Medium** |
| 5 | No DNS prefetch for externals | +1 | 0 | 0 | 0 | 1 | **Low** |

### Evidence for Top 3

**Issue #1: Font Over-Preloading**
- File: `frontend/src/lib/fonts.ts`
- Both `inter` and `interVariable` have `preload: true`
- Layout.tsx loads `interVariable` but `inter` is never used
- Variable font alone is 338KB blocking render

**Issue #2: Hero Image Missing**
- File: `frontend/src/components/HeroSection.tsx:68`
- `<Image src="/assets/visuals/hero-visual.webp" />`
- Image doesn't exist in `frontend/public/assets/visuals/`
- Causes layout shift when image fails to load

**Issue #3: Large CSS Bundle**
- File: `frontend/src/app/globals.css` (1091 lines)
- Contains template-specific styles for ALL pages
- Render-blocking download of 91KB
- Unused styles for: templates, auth, dashboard in home page

---

## PHASE 3: PATCH PLAYBOOK

### Fix #1: Remove Duplicate Font Preloading
**Target:** `frontend/src/lib/fonts.ts`
- Remove unused `inter` export (lines 3-29)
- Keep only `interVariable`
- Expected impact: -710KB font payload (5 individual weights)

### Fix #2: Add Hero Image Placeholder
**Target:** `frontend/src/components/HeroSection.tsx`
- Remove or fix the hero image
- Add explicit width/height/aspect-ratio to prevent CLS
- Expected impact: CLS reduction, faster LCP

### Fix #3: Add DNS Prefetch for External Links
**Target:** `frontend/src/app/layout.tsx`
- Add `<link rel="dns-prefetch" href="https://github.com">`
- Add `<link rel="preconnect" href="https://github.com">`
- Expected impact: -100-200ms TTFB for external resources

---

## BEFORE/AFTER PROJECTIONS

| Metric | Before | After Target | Delta |
|--------|--------|--------------|-------|
| Total Blocking Fonts | ~1.4MB | ~338KB | -76% |
| CSS Render Blocking | 91KB | 91KB* | No change* |
| CLS (Hero) | >0.1 | <0.05 | -50% |
| DNS Prefetch | None | GitHub | -100-200ms |

*CSS requires more invasive splitting - out of scope for hot-path fixes

---

## IMPLEMENTATION CHECKLIST

- [ ] Remove `inter` font export from fonts.ts
- [ ] Update layout.tsx to remove unused import
- [ ] Fix or remove hero image in HeroSection.tsx
- [ ] Add DNS prefetch for github.com
- [ ] Verify fonts still render correctly
- [ ] Run build and verify chunk sizes
- [ ] Run lighthouse to verify LCP/CLS improvements
