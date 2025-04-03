import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch, setupSettingsModal } from './ui.js';
import { setupChatForm, setupNewChatButton } from './events.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await ensureAuthenticated();
  if (!isAuthenticated) {
    alert('Access denied. Please refresh the page to try again.');
    return;
  }

  restoreChats();
  setupSearch();
  setupChatForm();
  setupNewChatButton();
  setupSettingsModal();
  
  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});

async function ensureAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const expiration = localStorage.getItem('auth_expiration');

  if (token && expiration && Date.now() < parseInt(expiration, 10)) {
    return true;
  }

  const password = await showPasswordPrompt();
  if (!password) return false;

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
      return ensureAuthenticated(); 
    }
  } catch (error) {
    console.error('Authentication error:', error);
    alert('An error occurred while authenticating. Please try again later.');
    return false;
  }
}

function showPasswordPrompt() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'password-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#202123';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '12px';
    modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
    modalContent.style.textAlign = 'center';
    modalContent.style.color = '#d1d5db';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '400px';

    const label = document.createElement('label');
    label.textContent = 'Enter the password:';
    label.style.display = 'block';
    label.style.marginBottom = '10px';
    label.style.fontSize = '1rem';
    label.style.fontWeight = '600';
    label.style.color = '#ffffff';

    const input = document.createElement('input');
    input.type = 'password';
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    input.style.padding = '10px';
    input.style.marginBottom = '20px';
    input.style.border = '1px solid #444654';
    input.style.borderRadius = '8px';
    input.style.backgroundColor = '#343541';
    input.style.color = '#ffffff';
    input.style.fontSize = '1rem';
    input.style.outline = 'none';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.padding = '10px 20px';
    submitButton.style.backgroundColor = '#10a37f';
    submitButton.style.color = '#ffffff';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '8px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.fontSize = '1rem';
    submitButton.style.fontWeight = '600';
    submitButton.style.transition = 'background-color 0.2s ease';

    submitButton.addEventListener('mouseover', () => {
      submitButton.style.backgroundColor = '#0e8c6a';
    });

    submitButton.addEventListener('mouseout', () => {
      submitButton.style.backgroundColor = '#10a37f';
    });

    submitButton.addEventListener('click', () => {
      const password = input.value.trim();
      document.body.removeChild(modal);
      resolve(password);
    });

    modalContent.appendChild(label);
    modalContent.appendChild(input);
    modalContent.appendChild(submitButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    input.focus();
  });
}