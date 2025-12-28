/**
 * Node.js script to generate extension icons
 * Run: node create-icons.js
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#007bff';
  ctx.fillRect(0, 0, size, size);
  
  // Template icon (document with lines)
  ctx.fillStyle = '#ffffff';
  const padding = size * 0.15;
  const docWidth = size - padding * 2;
  const docHeight = size - padding * 2;
  
  // Document shape
  ctx.fillRect(padding, padding, docWidth, docHeight);
  
  // Lines representing template
  ctx.fillStyle = '#007bff';
  const lineHeight = docHeight / 6;
  const linePadding = padding + docWidth * 0.2;
  const lineWidth = docWidth * 0.6;
  
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(
      linePadding,
      padding + lineHeight * (i + 1),
      lineWidth,
      lineHeight * 0.3
    );
  }
  
  return canvas.toBuffer('image/png');
}

// Create icons
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const buffer = createIcon(size);
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
});

console.log('All icons created successfully!');
