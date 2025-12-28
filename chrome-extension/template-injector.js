/**
 * Template Injector Script
 * 
 * Injected into page context to enable template insertion
 */

(function() {
  'use strict';

  // This script runs in the page context, not extension context
  // It can access page variables and functions

  window.templateManager = {
    insertTemplate: async function(templateId, prompt) {
      const activeElement = document.activeElement;
      
      if (activeElement && (
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'INPUT' ||
        activeElement.contentEditable === 'true'
      )) {
        if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
          const start = activeElement.selectionStart || 0;
          const end = activeElement.selectionEnd || 0;
          const text = activeElement.value || '';
          activeElement.value = text.slice(0, start) + prompt + text.slice(end);
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          activeElement.setSelectionRange(start + prompt.length, start + prompt.length);
        } else {
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
          }
        }
        return true;
      }
      return false;
    }
  };

  // Listen for messages from content script
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'INSERT_TEMPLATE') {
      const inserted = await window.templateManager.insertTemplate(
        event.data.templateId,
        event.data.prompt
      );
      window.postMessage({
        type: 'TEMPLATE_INSERTED',
        success: inserted
      }, '*');
    }
  });
})();
