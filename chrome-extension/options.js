/**
 * Options Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'apiBaseUrl',
    'authToken',
    'autoSync',
    'showNotifications',
  ]);

  document.getElementById('api-base-url').value = settings.apiBaseUrl || '';
  document.getElementById('auth-token').value = settings.authToken || '';
  document.getElementById('auto-sync').checked = settings.autoSync !== false;
  document.getElementById('show-notifications').checked = settings.showNotifications !== false;
}

function setupEventListeners() {
  // Save settings
  document.getElementById('save-btn').addEventListener('click', saveSettings);

  // Reset settings
  document.getElementById('reset-btn').addEventListener('click', resetSettings);

  // Test connection
  document.getElementById('test-connection').addEventListener('click', testConnection);

  // Sync now
  document.getElementById('sync-now').addEventListener('click', syncNow);

  // Export
  document.getElementById('export-btn').addEventListener('click', exportCustomizations);

  // Import
  document.getElementById('import-file').addEventListener('change', (e) => {
    document.getElementById('import-btn').disabled = !e.target.files.length;
  });
  document.getElementById('import-btn').addEventListener('click', importCustomizations);
}

async function saveSettings() {
  const settings = {
    apiBaseUrl: document.getElementById('api-base-url').value,
    authToken: document.getElementById('auth-token').value,
    autoSync: document.getElementById('auto-sync').checked,
    showNotifications: document.getElementById('show-notifications').checked,
  };

  await chrome.storage.sync.set(settings);
  showStatus('Settings saved successfully!', 'success');
}

async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    await chrome.storage.sync.clear();
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  }
}

async function testConnection() {
  const statusEl = document.getElementById('connection-status');
  statusEl.textContent = 'Testing connection...';
  statusEl.className = 'status-message testing';

  try {
    const apiBaseUrl = document.getElementById('api-base-url').value;
    const authToken = document.getElementById('auth-token').value;

    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${apiBaseUrl}/health`, { headers });

    if (response.ok) {
      statusEl.textContent = 'Connection successful!';
      statusEl.className = 'status-message success';
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    statusEl.textContent = `Connection failed: ${error.message}`;
    statusEl.className = 'status-message error';
  }
}

async function syncNow() {
  showStatus('Syncing...', 'testing');
  
  try {
    await chrome.runtime.sendMessage({ action: 'syncTemplates' });
    showStatus('Sync completed!', 'success');
  } catch (error) {
    showStatus(`Sync failed: ${error.message}`, 'error');
  }
}

async function exportCustomizations() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportCustomizations',
      format: 'json',
    });

    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-customizations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus('Export completed!', 'success');
  } catch (error) {
    showStatus(`Export failed: ${error.message}`, 'error');
  }
}

async function importCustomizations() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const response = await chrome.runtime.sendMessage({
      action: 'importCustomizations',
      data,
    });

    showStatus(`Imported ${response.imported.length} customizations`, 'success');
    fileInput.value = '';
    document.getElementById('import-btn').disabled = true;
  } catch (error) {
    showStatus(`Import failed: ${error.message}`, 'error');
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('connection-status');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status-message';
    }, 5000);
  }
}
