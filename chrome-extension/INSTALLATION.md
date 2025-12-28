# Chrome Extension Installation Guide

## Quick Start

1. **Load Extension**
   - Open Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` directory

2. **Configure API**
   - Click the extension icon
   - Click settings (⚙️)
   - Enter API Base URL: `http://localhost:3001` (or your API URL)
   - Enter your authentication token
   - Click "Test Connection"
   - Click "Save Settings"

3. **Start Using**
   - Click extension icon to browse templates
   - Right-click in any input field → "Insert Template Prompt"
   - Use keyboard shortcuts for quick access

## Creating Icons

The extension needs icon files. Create or download:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

You can use any image editor or online icon generator.

## First Use

1. **Browse Templates**
   - Click extension icon
   - Browse by milestone or search
   - Click a template to view details

2. **Customize Template**
   - Click a template
   - Click "Customize"
   - Edit variables and instructions
   - Test before saving
   - Save customization

3. **Insert Template**
   - Navigate to any webpage
   - Click in an input/textarea
   - Right-click → "Insert Template Prompt"
   - Select template
   - Template is inserted automatically

## Keyboard Shortcuts

- `Ctrl+Shift+T` - Open Template Manager
- `Ctrl+Shift+Q` - Quick Template Search

Customize in `chrome://extensions/shortcuts`

## Troubleshooting

### Extension Not Loading
- Check manifest.json syntax
- Ensure all files are present
- Check Chrome console for errors

### API Connection Fails
- Verify API URL is correct
- Check authentication token
- Ensure API is running
- Check CORS settings

### Templates Not Loading
- Check API configuration
- Verify authentication token
- Test API connection in settings
- Check browser console for errors

### Template Not Inserting
- Ensure you're in an editable field
- Check content script is loaded
- Verify template ID is correct
- Check browser console

## Development

### Testing Changes
1. Make changes to files
2. Go to `chrome://extensions/`
3. Click reload icon on extension
4. Test changes

### Debugging
- **Popup**: Right-click extension icon → Inspect popup
- **Background**: Go to `chrome://extensions/` → Service Worker → Inspect
- **Content Script**: Open DevTools on webpage → Console
- **Options**: Right-click options page → Inspect

## Production Build

1. **Prepare Icons**
   - Create proper icon files
   - Ensure all sizes are present

2. **Test Thoroughly**
   - Test all features
   - Test on different websites
   - Test keyboard shortcuts
   - Test context menu

3. **Package Extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select extension directory
   - Save `.crx` file

4. **Publish** (optional)
   - Create Chrome Web Store developer account
   - Upload `.crx` file
   - Fill out store listing
   - Submit for review
