/**
 * Popup Script
 * 
 * Handles popup UI interactions and template management
 */

let currentTab = 'browse';
let selectedTemplate = null;
let templates = [];
let customizations = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupSearch();
  setupModal();
  await loadTemplates();
  await loadCustomizations();
});

// Tab switching
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `${tab}-tab`);
  });
  
  // Load appropriate content
  if (tab === 'browse') {
    renderTemplates(templates);
  } else if (tab === 'customized') {
    renderCustomizedTemplates();
  } else if (tab === 'quick') {
    setupQuickInsert();
  }
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const milestoneFilter = document.getElementById('milestone-filter');
  
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  milestoneFilter.addEventListener('change', handleSearch);
}

async function handleSearch() {
  const query = document.getElementById('search-input').value;
  const milestone = document.getElementById('milestone-filter').value;
  
  const filters = {};
  if (milestone) filters.milestone = [milestone];
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'searchTemplates',
      query,
      filters,
    });
    
    templates = response.results || [];
    renderTemplates(templates);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Load templates
async function loadTemplates() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getTemplates',
    });
    
    templates = response.results || [];
    renderTemplates(templates);
  } catch (error) {
    console.error('Failed to load templates:', error);
    showError('Failed to load templates. Check your API configuration.');
  }
}

// Render templates list
function renderTemplates(templateList) {
  const list = document.getElementById('templates-list');
  list.innerHTML = '';
  
  if (templateList.length === 0) {
    list.innerHTML = '<div class="empty-state">No templates found</div>';
    return;
  }
  
  templateList.forEach((template) => {
    const item = createTemplateItem(template);
    list.appendChild(item);
  });
}

function createTemplateItem(template) {
  const item = document.createElement('div');
  item.className = 'template-item';
  item.dataset.templateId = template.templateId;
  
  item.innerHTML = `
    <div class="template-header">
      <h3>${template.name}</h3>
      <span class="badge badge-${template.priority}">${template.priority}</span>
    </div>
    <p class="template-description">${template.description}</p>
    <div class="template-meta">
      <span class="tag">${template.milestone}</span>
      ${template.hasCustomization ? '<span class="badge customized">Customized</span>' : ''}
    </div>
  `;
  
  item.addEventListener('click', () => openTemplateModal(template.templateId));
  
  return item;
}

// Load customizations
async function loadCustomizations() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getUserCustomizations',
    });
    
    customizations = response.customizations || [];
  } catch (error) {
    console.error('Failed to load customizations:', error);
  }
}

function renderCustomizedTemplates() {
  const list = document.getElementById('customized-list');
  list.innerHTML = '';
  
  if (customizations.length === 0) {
    list.innerHTML = '<div class="empty-state">No customizations yet</div>';
    return;
  }
  
  customizations.forEach((customization) => {
    const item = document.createElement('div');
    item.className = 'template-item customized';
    item.innerHTML = `
      <div class="template-header">
        <h3>${customization.template_id}</h3>
        <span class="badge customized">Customized</span>
      </div>
      <div class="template-actions">
        <button class="btn-small" data-action="edit" data-id="${customization.template_id}">Edit</button>
        <button class="btn-small" data-action="use" data-id="${customization.template_id}">Use</button>
        <button class="btn-small" data-action="delete" data-id="${customization.template_id}">Delete</button>
      </div>
    `;
    
    item.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCustomizationAction(btn.dataset.action, btn.dataset.id);
      });
    });
    
    list.appendChild(item);
  });
}

async function handleCustomizationAction(action, templateId) {
  switch (action) {
    case 'edit':
      openTemplateModal(templateId);
      break;
    case 'use':
      await useTemplate(templateId);
      break;
    case 'delete':
      if (confirm('Delete this customization?')) {
        await deleteCustomization(templateId);
      }
      break;
  }
}

// Template modal
function setupModal() {
  const modal = document.getElementById('template-modal');
  const closeBtn = modal.querySelector('.close');
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Modal action buttons
  document.getElementById('customize-btn').addEventListener('click', () => {
    if (selectedTemplate) {
      openCustomizeView(selectedTemplate);
    }
  });
  
  document.getElementById('use-btn').addEventListener('click', async () => {
    if (selectedTemplate) {
      await useTemplate(selectedTemplate.templateId);
    }
  });
  
  document.getElementById('test-btn').addEventListener('click', async () => {
    if (selectedTemplate) {
      await testTemplate(selectedTemplate.templateId);
    }
  });
}

async function openTemplateModal(templateId) {
  const modal = document.getElementById('template-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getTemplatePreview',
      templateId,
    });
    
    selectedTemplate = response;
    title.textContent = response.name;
    
    body.innerHTML = `
      <div class="template-preview">
        <h3>Base Template</h3>
        <pre class="prompt-preview">${escapeHtml(response.basePrompt)}</pre>
        ${response.hasCustomization ? `
          <h3>Your Customized Version</h3>
          <pre class="prompt-preview customized">${escapeHtml(response.customizedPrompt)}</pre>
        ` : ''}
      </div>
    `;
    
    modal.style.display = 'block';
  } catch (error) {
    console.error('Failed to load template preview:', error);
    showError('Failed to load template preview');
  }
}

// Use template
async function useTemplate(templateId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'insertTemplate',
    templateId,
  });
  
  // Track usage
  await chrome.runtime.sendMessage({
    action: 'trackUsage',
    templateId,
    success: true,
  });
  
  window.close();
}

// Test template
async function testTemplate(templateId) {
  // Open test view in new tab or show in modal
  chrome.tabs.create({
    url: chrome.runtime.getURL(`test.html?templateId=${templateId}`),
  });
}

// Quick insert
function setupQuickInsert() {
  const quickSearch = document.getElementById('quick-search');
  const insertBtn = document.getElementById('insert-btn');
  const copyBtn = document.getElementById('copy-btn');
  
  quickSearch.addEventListener('input', debounce(async (e) => {
    const query = e.target.value;
    if (query.length < 2) return;
    
    const response = await chrome.runtime.sendMessage({
      action: 'searchTemplates',
      query,
    });
    
    renderQuickResults(response.results || []);
  }, 300));
  
  insertBtn.addEventListener('click', async () => {
    if (selectedTemplate) {
      await useTemplate(selectedTemplate.templateId);
    }
  });
  
  copyBtn.addEventListener('click', async () => {
    if (selectedTemplate) {
      const response = await chrome.runtime.sendMessage({
        action: 'generatePrompt',
        templateId: selectedTemplate.templateId,
        taskDescription: '',
      });
      
      await navigator.clipboard.writeText(response.prompt);
      showNotification('Copied to clipboard!');
    }
  });
}

function renderQuickResults(results) {
  const container = document.getElementById('quick-results');
  container.innerHTML = '';
  
  results.slice(0, 5).forEach((template) => {
    const item = document.createElement('div');
    item.className = 'quick-result-item';
    item.textContent = template.name;
    item.addEventListener('click', () => {
      selectedTemplate = template;
      document.getElementById('insert-btn').disabled = false;
      document.getElementById('copy-btn').disabled = false;
    });
    container.appendChild(item);
  });
}

// Settings
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Utility functions
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  // Show error notification
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

function showNotification(message) {
  // Show success notification
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 2000);
}

async function deleteCustomization(templateId) {
  try {
    await chrome.runtime.sendMessage({
      action: 'deleteCustomization',
      templateId,
    });
    
    await loadCustomizations();
    if (currentTab === 'customized') {
      renderCustomizedTemplates();
    }
  } catch (error) {
    console.error('Failed to delete customization:', error);
    showError('Failed to delete customization');
  }
}
