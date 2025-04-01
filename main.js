import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch } from './ui.js';
import { setupChatForm, setupNewChatButton } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
  restoreChats();
  setupSearch();
  setupChatForm();
  setupNewChatButton();

  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});