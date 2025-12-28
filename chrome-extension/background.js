/**
 * Chrome Extension Background Service Worker
 * 
 * Handles API communication, storage, and background tasks
 */

const API_BASE_URL = 'http://localhost:3001'; // Configure in options

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - open options page
    chrome.runtime.openOptionsPage();
    
    // Set default settings
    await chrome.storage.sync.set({
      apiBaseUrl: API_BASE_URL,
      autoSync: true,
      showNotifications: true,
      theme: 'light',
    });
  }

  // Create context menu items
  chrome.contextMenus.create({
    id: 'use-template',
    title: 'Use Template',
    contexts: ['editable', 'selection'],
  });

  chrome.contextMenus.create({
    id: 'insert-template',
    title: 'Insert Template Prompt',
    contexts: ['editable'],
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'use-template') {
    // Open template selector
    chrome.tabs.sendMessage(tab.id, {
      action: 'openTemplateSelector',
      selectedText: info.selectionText,
    });
  } else if (info.menuItemId === 'insert-template') {
    // Open quick template insert
    chrome.tabs.sendMessage(tab.id, {
      action: 'openQuickInsert',
    });
  }
});

// Command handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-template-manager') {
    chrome.action.openPopup();
  } else if (command === 'quick-template') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'openQuickTemplate' });
  }
});

// Message handler from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getTemplates':
        sendResponse(await getTemplates(request.filters));
        break;

      case 'getTemplatePreview':
        sendResponse(await getTemplatePreview(request.templateId));
        break;

      case 'saveCustomization':
        sendResponse(await saveCustomization(
          request.templateId,
          request.customVariables,
          request.customInstructions
        ));
        break;

      case 'testTemplate':
        sendResponse(await testTemplate(
          request.templateId,
          request.customVariables,
          request.customInstructions
        ));
        break;

      case 'generatePrompt':
        sendResponse(await generatePrompt(
          request.templateId,
          request.taskDescription,
          request.inputFilter
        ));
        break;

      case 'getUserCustomizations':
        sendResponse(await getUserCustomizations());
        break;

      case 'exportCustomizations':
        sendResponse(await exportCustomizations(request.format));
        break;

      case 'importCustomizations':
        sendResponse(await importCustomizations(request.data));
        break;

      case 'searchTemplates':
        sendResponse(await searchTemplates(request.query, request.filters));
        break;

      case 'getAnalytics':
        sendResponse(await getAnalytics(request.templateId));
        break;

      case 'trackUsage':
        await trackUsage(request.templateId, request.success);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Background message handler error:', error);
    sendResponse({ error: error.message });
  }
}

// API Functions

async function getApiConfig() {
  const config = await chrome.storage.sync.get(['apiBaseUrl', 'authToken']);
  return {
    baseUrl: config.apiBaseUrl || API_BASE_URL,
    authToken: config.authToken,
  };
}

async function apiRequest(endpoint, options = {}) {
  const config = await getApiConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

async function getTemplates(filters = {}) {
  const params = new URLSearchParams();
  if (filters.milestone) params.append('milestone', filters.milestone);
  if (filters.query) params.append('query', filters.query);
  
  return apiRequest(`/user-templates/search?${params}`);
}

async function getTemplatePreview(templateId) {
  return apiRequest(`/user-templates/${templateId}/preview`);
}

async function saveCustomization(templateId, customVariables, customInstructions) {
  return apiRequest(`/user-templates/${templateId}/customize`, {
    method: 'POST',
    body: JSON.stringify({ customVariables, customInstructions }),
  });
}

async function testTemplate(templateId, customVariables, customInstructions) {
  return apiRequest(`/user-templates/${templateId}/test`, {
    method: 'POST',
    body: JSON.stringify({ customVariables, customInstructions }),
  });
}

async function generatePrompt(templateId, taskDescription, inputFilter) {
  return apiRequest(`/user-templates/${templateId}/generate`, {
    method: 'POST',
    body: JSON.stringify({ taskDescription, inputFilter }),
  });
}

async function getUserCustomizations() {
  return apiRequest('/user-templates/customizations');
}

async function exportCustomizations(format = 'json') {
  return apiRequest(`/user-templates/export?format=${format}`);
}

async function importCustomizations(data) {
  return apiRequest('/user-templates/import', {
    method: 'POST',
    body: JSON.stringify({ exportData: data }),
  });
}

async function searchTemplates(query, filters = {}) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, Array.isArray(value) ? value.join(',') : value);
  });
  
  return apiRequest(`/user-templates/search?${params}`);
}

async function getAnalytics(templateId) {
  return apiRequest(`/user-templates/${templateId}/analytics`);
}

async function trackUsage(templateId, success = true) {
  try {
    await apiRequest(`/user-templates/${templateId}/analytics`, {
      method: 'POST',
      body: JSON.stringify({ success }),
    });
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

// Sync templates periodically
chrome.alarms.create('syncTemplates', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncTemplates') {
    const config = await chrome.storage.sync.get(['autoSync']);
    if (config.autoSync) {
      await syncTemplates();
    }
  }
});

async function syncTemplates() {
  try {
    const customizations = await getUserCustomizations();
    await chrome.storage.local.set({
      cachedCustomizations: customizations,
      lastSync: Date.now(),
    });

    if (await chrome.storage.sync.get(['showNotifications'])) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Templates Synced',
        message: `Synced ${customizations.count || 0} customizations`,
      });
    }
  } catch (error) {
    console.error('Failed to sync templates:', error);
  }
}

// Initialize sync on startup
syncTemplates();
