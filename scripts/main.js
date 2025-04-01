import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch, setupSettingsModal } from './ui.js';
import { setupChatForm, setupNewChatButton } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
  restoreChats();
  setupSearch();
  setupChatForm();
  setupNewChatButton();
  setupSettingsModal();

  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});