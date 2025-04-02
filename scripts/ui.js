export const toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('sidebar-hidden');
  sidebar.classList.toggle('sidebar-visible');
};

export const setupChatInput = () => {
  const chatInput = document.getElementById('user-input'); // Ensure this matches your input's ID

  if (!chatInput) {
    console.error('Chat input element with ID "user-input" not found!');
    return;
  }

  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault(); // Prevent default behavior (e.g., form submission)

      const cursorPosition = chatInput.selectionStart;
      const textBeforeCursor = chatInput.value.substring(0, cursorPosition);
      const textAfterCursor = chatInput.value.substring(cursorPosition);

      // Insert a newline at the cursor position
      chatInput.value = `${textBeforeCursor}\n${textAfterCursor}`;

      // Move the cursor to the position after the newline
      chatInput.selectionStart = chatInput.selectionEnd = cursorPosition + 1;
    }
  });
};

export const setupSearch = () => {
  const searchBtn = document.getElementById('search-btn');
  const chatList = document.getElementById('chat-list');

  searchBtn.addEventListener('click', () => {
    let searchInput = document.querySelector('.search-input');
    if (!searchInput) {
      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search chats...';
      searchInput.classList.add('search-input');
      chatList.insertAdjacentElement('beforebegin', searchInput);
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        chatList.querySelectorAll('li').forEach(chat => {
          chat.style.display = chat.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      });
    } else {
      searchInput.classList.toggle('hidden');
      searchInput.value = '';
      chatList.querySelectorAll('li').forEach(chat => (chat.style.display = ''));
    }
  });
};

export const setupSettingsModal = () => {
  const settingsLink = document.getElementById('settings-link');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');

  // Open the modal
  settingsLink.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    settingsModal.setAttribute('aria-hidden', 'false');
    closeSettingsBtn.focus(); // Move focus to the close button
  });

  // Close the modal
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsModal.setAttribute('aria-hidden', 'true');
    settingsLink.focus(); // Return focus to the settings link
  });
};