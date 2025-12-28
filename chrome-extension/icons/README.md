# Extension Icons

## Quick Creation

### Option 1: Use Online Generator
1. Go to https://www.favicon-generator.org/ or similar
2. Upload a 128x128 image
3. Download all sizes
4. Rename to icon16.png, icon48.png, icon128.png

### Option 2: Use create-icons.js
```bash
npm install canvas
node create-icons.js
```

### Option 3: Use ImageMagick
```bash
# Create a simple icon
convert -size 128x128 xc:'#007bff' \
  -fill white -draw 'rectangle 19,19 109,109' \
  -fill '#007bff' -draw 'rectangle 45,38 83,45' \
  -draw 'rectangle 45,51 83,58' \
  -draw 'rectangle 45,64 83,71' \
  -draw 'rectangle 45,77 83,84' \
  icon128.png

# Resize for other sizes
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

### Option 4: Manual Creation
Create PNG files:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Use any image editor (Photoshop, GIMP, Figma, etc.)

## Icon Design
- Background: #007bff (blue)
- Document: White rectangle
- Lines: Blue lines representing template content

## For Now
Placeholder files are created. Replace with proper icons before production deployment.
