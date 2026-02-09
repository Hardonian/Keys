# Chrome Extension Integration

## Overview

The Template Manager Chrome Extension provides seamless access to template functionality directly from your browser. Use templates on any website, in any input field, with keyboard shortcuts and context menus.

## Features

### Core Features
- ✅ **Template Browser** - Browse and search all templates
- ✅ **Template Customization** - Customize templates in popup
- ✅ **Quick Insert** - Insert templates into any webpage
- ✅ **Context Menu** - Right-click to insert templates
- ✅ **Keyboard Shortcuts** - Quick access with hotkeys
- ✅ **Export/Import** - Backup and restore customizations
- ✅ **Auto-Sync** - Automatic template synchronization
- ✅ **Offline Caching** - Works offline with cached data

### Integration Points
- ✅ **Backend API** - Full integration with template API
- ✅ **Storage** - Sync and local storage
- ✅ **Analytics** - Usage tracking
- ✅ **Notifications** - Sync and update notifications

## Architecture

```
Chrome Extension
├── Background Service Worker (background.js)
│   ├── API Communication
│   ├── Storage Management
│   ├── Sync Scheduling
│   └── Message Handling
│
├── Popup UI (popup.html/js/css)
│   ├── Template Browser
│   ├── Customization Editor
│   └── Quick Insert
│
├── Content Script (content.js)
│   ├── Page Injection
│   ├── Template Insertion
│   └── UI Overlays
│
├── Options Page (options.html/js/css)
│   ├── API Configuration
│   ├── Sync Settings
│   └── Export/Import
│
└── Template Injector (template-injector.js)
    └── Page Context Script
```

## Installation

See `chrome-extension/INSTALLATION.md` for detailed instructions.

Quick steps:
1. Load unpacked extension in Chrome
2. Configure API settings
3. Start using templates

## Usage Examples

### Example 1: Insert Template in GitHub Issue
1. Open GitHub issue
2. Click in comment textarea
3. Right-click → "Insert Template Prompt"
4. Select "API Route Structure" template
5. Template prompt is inserted

### Example 2: Use Template in ChatGPT
1. Open ChatGPT
2. Click in input field
3. Press `Ctrl+Shift+Q`
4. Search for "authentication"
5. Select template
6. Template is inserted

### Example 3: Customize Template
1. Click extension icon
2. Browse templates
3. Click "JWT Authentication"
4. Click "Customize"
5. Edit variables
6. Test template
7. Save customization

## API Endpoints Used

The extension uses these backend endpoints:

- `GET /user-templates/search` - Search templates
- `GET /user-templates/:id/preview` - Get template preview
- `POST /user-templates/:id/customize` - Save customization
- `POST /user-templates/:id/test` - Test template
- `POST /user-templates/:id/generate` - Generate prompt
- `GET /user-templates/customizations` - Get customizations
- `GET /user-templates/export` - Export customizations
- `POST /user-templates/import` - Import customizations
- `GET /health` - Health check

## Security

- ✅ Authentication tokens stored securely
- ✅ HTTPS required for production
- ✅ No sensitive data in plain text
- ✅ CORS properly configured
- ✅ Content Security Policy enforced

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ⏳ Firefox (requires Manifest V2 conversion)
- ⏳ Safari (requires separate implementation)

## Development

### File Structure
```
chrome-extension/
├── manifest.json
├── background.js
├── popup.html/js/css
├── options.html/js/css
├── content.js/css
├── template-injector.js
├── icons/
└── README.md
```

### Testing
1. Load extension in Chrome
2. Test all features
3. Check console for errors
4. Test on various websites
5. Verify API integration

### Debugging
- Popup: Right-click extension → Inspect popup
- Background: chrome://extensions → Service Worker → Inspect
- Content: DevTools → Console
- Options: Right-click options page → Inspect

## Future Enhancements

- ⏳ Template suggestions based on page content
- ⏳ AI-powered template recommendations
- ⏳ Template snippets library
- ⏳ Integration with code editors
- ⏳ Template sharing via extension
- ⏳ Offline template editing

## Support

For issues:
1. Check extension console
2. Verify API configuration
3. Review backend logs
4. Check browser compatibility
