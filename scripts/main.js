import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch, setupSettingsModal, setupChatInput } from './ui.js';
import { setupChatForm, setupNewChatButton } from './events.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Prompt for password
  const isAuthenticated = await ensureAuthenticated();
  if (!isAuthenticated) {
    alert('Access denied. Please refresh the page to try again.');
    return; // Stop further execution if not authenticated
  }

  // Initialize the app
  restoreChats();
  setupSearch();
  setupChatForm();
  setupNewChatButton();
  setupSettingsModal();
  setupChatInput();

  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});

async function ensureAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const expiration = localStorage.getItem('auth_expiration');

  // Check if token exists and is still valid
  if (token && expiration && Date.now() < parseInt(expiration, 10)) {
    return true;
  }

  // Prompt user for password
  const password = prompt('Enter the password to access this site:');
  if (!password) return false;

  // Validate password with the backend
  try {
    const response = await fetch('https://chatgpt-worker.knbuchtyy879.workers.dev/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      const { token, expiration } = await response.json();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiration', expiration);
      return true;
    } else {
      alert('Invalid password. Please try again.');
      return ensureAuthenticated(); // Retry on failure
    }
  } catch (error) {
    console.error('Authentication error:', error);
    alert('An error occurred while authenticating. Please try again later.');
    return false;
  }
}