/**
 * Content Script
 * 
 * Injected into web pages to enable template insertion
 */

let templateInjector = null;

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Inject template injector script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('template-injector.js');
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true;
  });

  // Add template insertion UI
  addTemplateUI();
}

function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'insertTemplate':
      insertTemplate(request.templateId);
      sendResponse({ success: true });
      break;

    case 'openTemplateSelector':
      openTemplateSelector(request.selectedText);
      sendResponse({ success: true });
      break;

    case 'openQuickInsert':
      openQuickInsert();
      sendResponse({ success: true });
      break;

    case 'openQuickTemplate':
      openQuickTemplate();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }
}

// Add template UI overlay
function addTemplateUI() {
  // Check if UI already exists
  if (document.getElementById('template-manager-ui')) {
    return;
  }

  const ui = document.createElement('div');
  ui.id = 'template-manager-ui';
  ui.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    display: none;
  `;
  document.body.appendChild(ui);
}

// Insert template into active input/textarea
async function insertTemplate(templateId) {
  const activeElement = document.activeElement;
  
  if (!activeElement || !isEditableElement(activeElement)) {
    // Find first editable element
    const editable = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
    if (editable) {
      editable.focus();
      insertIntoElement(editable, templateId);
    } else {
      showNotification('No editable field found. Click on an input field first.');
    }
    return;
  }

  insertIntoElement(activeElement, templateId);
}

async function insertIntoElement(element, templateId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generatePrompt',
      templateId,
      taskDescription: '',
    });

    const prompt = response.prompt;

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const text = element.value || '';
      element.value = text.slice(0, start) + prompt + text.slice(end);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Set cursor position
      const newPosition = start + prompt.length;
      element.setSelectionRange(newPosition, newPosition);
    } else if (element.contentEditable === 'true') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(prompt);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        element.textContent = (element.textContent || '') + prompt;
      }
    }

    showNotification('Template inserted successfully!');
    
    // Track usage
    await chrome.runtime.sendMessage({
      action: 'trackUsage',
      templateId,
      success: true,
    });
  } catch (error) {
    console.error('Failed to insert template:', error);
    showNotification('Failed to insert template. Check your configuration.');
  }
}

function isEditableElement(element) {
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.contentEditable === 'true'
  );
}

// Open template selector overlay
function openTemplateSelector(selectedText) {
  const overlay = createOverlay('template-selector');
  overlay.innerHTML = `
    <div class="template-selector-content">
      <h3>Select Template</h3>
      <input type="text" id="template-search" placeholder="Search templates..." />
      <div id="template-options" class="template-options"></div>
      <div class="selector-actions">
        <button id="cancel-btn" class="btn-secondary">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Load templates
  loadTemplatesForSelector(overlay, selectedText);
  
  // Setup cancel
  overlay.querySelector('#cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

async function loadTemplatesForSelector(overlay, selectedText) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getTemplates',
    });

    const templates = response.results || [];
    const optionsContainer = overlay.querySelector('#template-options');
    
    templates.forEach((template) => {
      const option = document.createElement('div');
      option.className = 'template-option';
      option.innerHTML = `
        <strong>${template.name}</strong>
        <p>${template.description}</p>
      `;
      option.addEventListener('click', async () => {
        await insertTemplate(template.templateId);
        overlay.remove();
      });
      optionsContainer.appendChild(option);
    });

    // Setup search
    overlay.querySelector('#template-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      Array.from(optionsContainer.children).forEach((option) => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

// Quick insert overlay
function openQuickInsert() {
  const overlay = createOverlay('quick-insert');
  overlay.innerHTML = `
    <div class="quick-insert-content">
      <h3>Quick Template Insert</h3>
      <input type="text" id="quick-template-search" placeholder="Search..." />
      <div id="quick-template-results" class="template-options"></div>
      <button id="quick-cancel" class="btn-secondary">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);
  
  overlay.querySelector('#quick-template-search').addEventListener('input', debounce(async (e) => {
    const query = e.target.value;
    if (query.length < 2) return;
    
    const response = await chrome.runtime.sendMessage({
      action: 'searchTemplates',
      query,
    });
    
    renderQuickResults(overlay, response.results || []);
  }, 300));
  
  overlay.querySelector('#quick-cancel').addEventListener('click', () => {
    overlay.remove();
  });
}

function renderQuickResults(overlay, results) {
  const container = overlay.querySelector('#quick-template-results');
  container.innerHTML = '';
  
  results.slice(0, 5).forEach((template) => {
    const option = document.createElement('div');
    option.className = 'template-option';
    option.innerHTML = `<strong>${template.name}</strong>`;
    option.addEventListener('click', async () => {
      await insertTemplate(template.templateId);
      overlay.remove();
    });
    container.appendChild(option);
  });
}

function createOverlay(id) {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'template-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  return overlay;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
