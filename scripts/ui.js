// Sidebar Toggle
export const toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const chatContainer = document.getElementById('chat-container');
  
  sidebar.classList.toggle('sidebar-hidden');
  sidebar.classList.toggle('sidebar-visible');
  
  // Update toggle button icon and class based on sidebar state
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const toggleIcon = sidebarToggle.querySelector('i');
  
  if (sidebar.classList.contains('sidebar-hidden')) {
    // Change icon to indicate "open sidebar" when sidebar is hidden
    toggleIcon.classList.remove('fa-bars');
    toggleIcon.classList.add('fa-chevron-right');
    sidebarToggle.classList.add('sidebar-closed');
    // Make sure main content expands
    mainContent.style.width = '100%';
    mainContent.style.marginLeft = '0';
    mainContent.style.left = '0';
    mainContent.style.position = 'absolute';
    mainContent.style.height = '100vh';
    mainContent.style.overflow = 'hidden';
    // Allow chat container to take full space
    chatContainer.style.maxWidth = '100%';
    chatContainer.style.width = '100%';
    chatContainer.style.margin = '0';
    chatContainer.style.borderRadius = '0';
    chatContainer.style.height = '100vh';
    chatContainer.style.maxHeight = '100vh';
    chatContainer.style.left = '0';
    mainContent.style.padding = '0';
  } else {
    // Change back to bars icon when sidebar is visible
    toggleIcon.classList.remove('fa-chevron-right');
    toggleIcon.classList.add('fa-bars');
    sidebarToggle.classList.remove('sidebar-closed');
    // Restore main content width
    mainContent.style.width = 'calc(100% - var(--sidebar-width))';
    mainContent.style.marginLeft = '';
    mainContent.style.padding = '1.5rem';
    mainContent.style.position = 'relative';
    mainContent.style.left = '';
    mainContent.style.top = '';
    mainContent.style.height = '';
    mainContent.style.overflow = '';
    // Restore chat container original styling
    chatContainer.style.maxWidth = '1200px';
    chatContainer.style.width = '100%';
    chatContainer.style.margin = '0 auto';
    chatContainer.style.borderRadius = 'var(--border-radius-lg)';
    chatContainer.style.height = '100%';
    chatContainer.style.maxHeight = '95vh';
    chatContainer.style.left = '';
  }
};

// Search Functionality
export const setupSearch = () => {
  const searchBtn = document.getElementById('search-btn');
  const chatList = document.getElementById('chat-list');

  searchBtn.addEventListener('click', () => {
    let searchInput = document.querySelector('.search-input');
    if (!searchInput) {
      searchInput = createSearchInput(chatList);
    } else {
      toggleSearchInput(searchInput, chatList);
    }
  });
};

const createSearchInput = (chatList) => {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search chats...';
  searchInput.classList.add('search-input');
  chatList.insertAdjacentElement('beforebegin', searchInput);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    chatList.querySelectorAll('li').forEach((chat) => {
      chat.style.display = chat.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  });

  return searchInput;
};

const toggleSearchInput = (searchInput, chatList) => {
  searchInput.classList.toggle('hidden');
  searchInput.value = '';
  chatList.querySelectorAll('li').forEach((chat) => (chat.style.display = ''));
};

// Settings Modal
export const setupSettingsModal = () => {
  const settingsLink = document.getElementById('settings-link');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');

  settingsLink.addEventListener('click', () => toggleModal(settingsModal, false, closeSettingsBtn));
  closeSettingsBtn.addEventListener('click', () => toggleModal(settingsModal, true, settingsLink));
  
  // Add ESC key handler to close the modal
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
      toggleModal(settingsModal, true, settingsLink);
    }
  });
};

const toggleModal = (modal, isHidden, focusElement) => {
  modal.classList.toggle('hidden', isHidden);
  modal.setAttribute('aria-hidden', isHidden.toString());
  
  // Ensure the modal is properly hidden/shown
  if (isHidden) {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'flex';
  }
  
  // Add event listener to close modal when clicking outside
  if (!isHidden) {
    const closeOnOutsideClick = (event) => {
      if (event.target === modal) {
        toggleModal(modal, true, focusElement);
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    document.addEventListener('click', closeOnOutsideClick);
  }
  
  focusElement.focus();
};

// Auto-Save Drafts
export const setupAutoSave = () => {
  const chatInput = document.getElementById('user-input');
  chatInput.value = localStorage.getItem('chat_draft') || '';

  chatInput.addEventListener('input', () => {
    localStorage.setItem('chat_draft', chatInput.value);
  });
};

// Password Prompt
export const createShowPasswordPrompt = () => {
  return new Promise((resolve) => {
    const modal = createPasswordModal(resolve);
    document.body.appendChild(modal);
    modal.querySelector('input').focus();
  });
};

const createPasswordModal = (resolve) => {
  const modal = createElement('div', {
    id: 'password-modal',
  });

  const modalContent = createElement('div', {
    classList: ['modal-content'],
    innerHTML: `
      <label>Enter the password:</label>
      <input type="password">
      <button>Submit</button>
    `,
  });

  modalContent.querySelector('button').addEventListener('click', () => {
    const password = modalContent.querySelector('input').value.trim();
    document.body.removeChild(modal);
    resolve(password);
  });

  modal.appendChild(modalContent);
  return modal;
};

// Detect touch device and add class to body
export const detectTouchDevice = () => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    
    // Make copy buttons always visible on touch devices
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    });
  }
  
  // Apply user-wrapper class to any existing message wrappers with user messages
  // This helps with right alignment in browsers that don't support :has selector
  document.querySelectorAll('.message-wrapper').forEach(wrapper => {
    const userMessage = wrapper.querySelector('.message.user');
    if (userMessage) {
      wrapper.classList.add('user-wrapper');
    }
  });
};

// Call this function when initializing the UI

// Helper Function
const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'style') element.style.cssText = value;
    else if (key === 'innerHTML') element.innerHTML = value;
    else element[key] = value;
  });
  return element;
};