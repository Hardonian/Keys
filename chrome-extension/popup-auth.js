/**
 * Popup Authentication UI
 * 
 * Handles sign in flow for Chrome extension
 */

document.addEventListener('DOMContentLoaded', async () => {
  const signInButton = document.getElementById('sign-in-btn');
  const signOutButton = document.getElementById('sign-out-btn');
  const statusDiv = document.getElementById('auth-status');
  
  // Load auth module
  const authModule = await import('./auth.js');
  const chromeAuth = authModule.default || authModule;
  
  // Check auth status
  const isAuth = await chromeAuth.isAuthenticated();
  
  if (isAuth) {
    showSignedIn();
  } else {
    showSignedOut();
  }
  
  if (signInButton) {
    signInButton.addEventListener('click', async () => {
      try {
        signInButton.disabled = true;
        signInButton.textContent = 'Signing in...';
        
        await chromeAuth.initiateAuth();
        
        showSignedIn();
      } catch (error) {
        console.error('Sign in error:', error);
        if (statusDiv) {
          statusDiv.textContent = `Error: ${error.message}`;
          statusDiv.className = 'error';
        }
      } finally {
        signInButton.disabled = false;
        signInButton.textContent = 'Sign In';
      }
    });
  }
  
  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await chromeAuth.signOut();
      showSignedOut();
    });
  }
  
  function showSignedIn() {
    if (signInButton) signInButton.style.display = 'none';
    if (signOutButton) signOutButton.style.display = 'block';
    if (statusDiv) {
      statusDiv.textContent = 'Signed in';
      statusDiv.className = 'success';
    }
  }
  
  function showSignedOut() {
    if (signInButton) signInButton.style.display = 'block';
    if (signOutButton) signOutButton.style.display = 'none';
    if (statusDiv) {
      statusDiv.textContent = 'Not signed in';
      statusDiv.className = 'info';
    }
  }
});

// Listen for auth messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_SUCCESS') {
    window.location.reload();
  } else if (message.type === 'AUTH_SIGNOUT') {
    window.location.reload();
  }
});
