# Template Manager Chrome Extension

Chrome extension for managing and using mega prompt templates directly from your browser.

## Features

- ✅ Browse and search templates
- ✅ Customize templates
- ✅ Quick insert templates into any webpage
- ✅ Context menu integration
- ✅ Keyboard shortcuts
- ✅ Export/import customizations
- ✅ Auto-sync templates
- ✅ Offline caching
- ✅ Template analytics

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. Configure API settings in extension options

## Configuration

1. Click the extension icon
2. Click the settings (⚙️) button
3. Enter your API base URL (e.g., `http://localhost:3001`)
4. Enter your authentication token
5. Test connection
6. Save settings

## Usage

### Browse Templates
1. Click the extension icon
2. Browse templates by milestone
3. Search for specific templates
4. Click a template to view details

### Customize Templates
1. Browse templates
2. Click a template
3. Click "Customize"
4. Edit variables and instructions
5. Test before saving
6. Save customization

### Quick Insert
1. Navigate to any webpage
2. Click in an input field or textarea
3. Right-click → "Insert Template Prompt"
4. Or use keyboard shortcut: `Ctrl+Shift+Q`
5. Search and select template
6. Template is inserted automatically

### Context Menu
- Right-click on selected text → "Use Template"
- Right-click in input field → "Insert Template Prompt"

### Keyboard Shortcuts
- `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) - Open Template Manager
- `Ctrl+Shift+Q` (Mac: `Cmd+Shift+Q`) - Quick Template Search

## API Integration

The extension communicates with the backend API:
- `/user-templates/*` - Template management endpoints
- `/assemble-prompt` - Prompt generation
- `/health` - Health check

## Storage

- **Sync Storage**: Settings, API config
- **Local Storage**: Cached templates, offline data

## Permissions

- `storage` - Store settings and cached data
- `activeTab` - Access current tab for template insertion
- `contextMenus` - Add context menu items
- `notifications` - Show sync notifications
- `scripting` - Inject content scripts

## Development

### File Structure
```
chrome-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── popup.html/js/css      # Popup UI
├── options.html/js/css    # Settings page
├── content.js/css         # Content script
├── template-injector.js   # Page context script
└── icons/                 # Extension icons
```

### Building

No build step required. Load unpacked in Chrome.

### Testing

1. Load extension in Chrome
2. Configure API settings
3. Test template browsing
4. Test template insertion on test pages
5. Test context menu
6. Test keyboard shortcuts

## Troubleshooting

### Connection Issues
- Check API base URL in settings
- Verify authentication token
- Test connection in settings
- Check CORS settings on API

### Template Not Inserting
- Ensure you're in an editable field
- Check browser console for errors
- Verify template ID is correct
- Check API response

### Sync Issues
- Check auto-sync setting
- Manually sync from settings
- Check network connectivity
- Verify API is accessible

## Security

- Authentication tokens stored securely
- API requests use HTTPS when available
- No sensitive data stored in plain text
- RLS policies enforced on backend

## Support

For issues or questions:
1. Check extension console (right-click extension → Inspect)
2. Check browser console for errors
3. Verify API configuration
4. Review backend logs
