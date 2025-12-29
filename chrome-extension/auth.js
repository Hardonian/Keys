/**
 * Chrome Extension Authentication Handler
 * 
 * Implements secure token exchange flow:
 * 1. User signs in on web app
 * 2. Extension opens auth window
 * 3. Exchange short-lived code for token
 * 4. Store token securely with short TTL
 */

const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const AUTH_CODE_KEY = 'auth_code';
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the web app URL for authentication
 */
function getAuthUrl() {
  const apiBaseUrl = chrome.runtime.getManifest().homepage_url || 'https://your-app.com';
  return `${apiBaseUrl}/extension-auth`;
}

/**
 * Generate a random state for OAuth flow
 */
function generateState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Open auth window and wait for callback
 */
async function initiateAuth() {
  return new Promise((resolve, reject) => {
    const state = generateState();
    const authUrl = `${getAuthUrl()}?state=${state}&extension_id=${chrome.runtime.id}`;
    
    // Store state for verification
    chrome.storage.local.set({ auth_state: state });
    
    // Open auth window
    chrome.windows.create({
      url: authUrl,
      type: 'popup',
      width: 500,
      height: 600,
    }, (window) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      // Listen for auth completion
      const listener = async (message, sender, sendResponse) => {
        if (message.type === 'AUTH_SUCCESS' && message.state === state) {
          chrome.runtime.onMessage.removeListener(listener);
          
          // Store token
          await storeToken(message.token, message.expiresIn);
          
          // Close auth window
          if (window.id) {
            chrome.windows.remove(window.id);
          }
          
          resolve(message.token);
        } else if (message.type === 'AUTH_ERROR') {
          chrome.runtime.onMessage.removeListener(listener);
          if (window.id) {
            chrome.windows.remove(window.id);
          }
          reject(new Error(message.error || 'Authentication failed'));
        }
      };
      
      chrome.runtime.onMessage.addListener(listener);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        if (window.id) {
          chrome.windows.remove(window.id);
        }
        reject(new Error('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  });
}

/**
 * Store auth token securely
 */
async function storeToken(token, expiresIn) {
  const expiry = Date.now() + (expiresIn || TOKEN_TTL);
  await chrome.storage.local.set({
    [TOKEN_STORAGE_KEY]: token,
    [TOKEN_EXPIRY_KEY]: expiry,
  });
}

/**
 * Get stored auth token if valid
 */
async function getToken() {
  const result = await chrome.storage.local.get([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
  
  if (!result[TOKEN_STORAGE_KEY]) {
    return null;
  }
  
  // Check if token is expired
  if (result[TOKEN_EXPIRY_KEY] && Date.now() > result[TOKEN_EXPIRY_KEY]) {
    await clearToken();
    return null;
  }
  
  return result[TOKEN_STORAGE_KEY];
}

/**
 * Clear stored token
 */
async function clearToken() {
  await chrome.storage.local.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY, AUTH_CODE_KEY]);
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated() {
  const token = await getToken();
  return token !== null;
}

/**
 * Sign out
 */
async function signOut() {
  await clearToken();
  // Notify content scripts
  chrome.runtime.sendMessage({ type: 'AUTH_SIGNOUT' });
}

/**
 * Get auth token, initiating auth flow if needed
 */
async function ensureAuthenticated() {
  let token = await getToken();
  
  if (!token) {
    // Initiate auth flow
    token = await initiateAuth();
  }
  
  return token;
}

// Export for use in other extension files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initiateAuth,
    getToken,
    clearToken,
    isAuthenticated,
    signOut,
    ensureAuthenticated,
  };
}

// Make available globally for background script
if (typeof window === 'undefined') {
  global.chromeAuth = {
    initiateAuth,
    getToken,
    clearToken,
    isAuthenticated,
    signOut,
    ensureAuthenticated,
  };
}
