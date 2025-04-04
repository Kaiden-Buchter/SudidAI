import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch, setupSettingsModal, setupAutoSave } from './ui.js';
import { setupChatForm, setupNewChatButton, ensureAuthenticated } from './events.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await ensureAuthenticated();
  if (!isAuthenticated) {
    alert('Access denied. Please refresh the page to try again.');
    return;
  }

  restoreChats();
  setupSearch();
  setupChatForm();
  setupAutoSave();
  setupNewChatButton();
  setupSettingsModal();
  
  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});