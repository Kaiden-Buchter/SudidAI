/**
 * Toggle sidebar visibility
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const toggleIcon = sidebarToggle.querySelector('i');

  sidebar.classList.toggle('sidebar-hidden');
  sidebar.classList.toggle('sidebar-visible');

  // Update toggle button icon
  const isHidden = sidebar.classList.contains('sidebar-hidden');
  
  if (isHidden) {
    toggleIcon.classList.replace('fa-bars', 'fa-chevron-right');
    sidebarToggle.classList.add('sidebar-closed');
  } else {
    toggleIcon.classList.replace('fa-chevron-right', 'fa-bars');
    sidebarToggle.classList.remove('sidebar-closed');
  }
}

/**
 * Setup search functionality
 */
export function setupSearch() {
  const searchBtn = document.getElementById('search-btn');
  const chatList = document.getElementById('chat-list');

  searchBtn.addEventListener('click', () => {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
      toggleSearchInput(searchInput, chatList);
    } else {
      createSearchInput(chatList);
    }
  });
}

/**
 * Create search input element
 */
function createSearchInput(chatList) {
  const searchInput = createElement('input', {
    type: 'text',
    placeholder: 'Search chats...',
    className: 'search-input',
  });

  chatList.parentElement.insertBefore(searchInput, chatList);

  searchInput.addEventListener('input', (e) => {
    filterChats(chatList, e.target.value);
  });

  searchInput.focus();
  return searchInput;
}

/**
 * Toggle search input visibility
 */
function toggleSearchInput(searchInput, chatList) {
  searchInput.classList.toggle('hidden');
  
  if (searchInput.classList.contains('hidden')) {
    searchInput.value = '';
    filterChats(chatList, '');
  } else {
    searchInput.focus();
  }
}

/**
 * Filter chats based on search query
 */
function filterChats(chatList, query) {
  const normalizedQuery = query.toLowerCase();
  
  chatList.querySelectorAll('li').forEach((chatItem) => {
    const chatText = chatItem.textContent.toLowerCase();
    chatItem.style.display = chatText.includes(normalizedQuery) ? '' : 'none';
  });
}

/**
 * Setup settings modal
 */
export function setupSettingsModal() {
  const settingsLink = document.getElementById('settings-link');
  const settingsModal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('close-settings-btn');

  settingsLink.addEventListener('click', () => openModal(settingsModal));
  closeBtn.addEventListener('click', () => closeModal(settingsModal));

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
      closeModal(settingsModal);
    }
  });

  // Close on backdrop click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeModal(settingsModal);
    }
  });
}

/**
 * Open modal
 */
function openModal(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
}

/**
 * Setup auto-save for chat input
 */
export function setupAutoSave() {
  const chatInput = document.getElementById('user-input');
  
  // Restore draft
  chatInput.value = localStorage.getItem('chat_draft') || '';

  // Save on input and auto-resize
  chatInput.addEventListener('input', () => {
    localStorage.setItem('chat_draft', chatInput.value);
    autoResizeTextarea(chatInput);
  });

  // Initial resize for restored content
  if (chatInput.value) {
    autoResizeTextarea(chatInput);
  }
}

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea(textarea) {
  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = 'auto';
  
  // Set new height based on content, respecting max-height
  const newHeight = Math.min(textarea.scrollHeight, 200);
  textarea.style.height = newHeight + 'px';
}

/**
 * Show password prompt modal
 */
export function createShowPasswordPrompt() {
  return new Promise((resolve) => {
    const modal = createPasswordModal(resolve);
    document.body.appendChild(modal);
    
    const input = modal.querySelector('input[type="password"]');
    input?.focus();
  });
}

/**
 * Create password modal
 */
function createPasswordModal(resolve) {
  const modal = createElement('div', {
    id: 'password-modal',
  });

  const modalContent = createElement('div', {
    className: 'modal-content',
    innerHTML: `
      <form id="password-form">
        <input 
          type="text" 
          name="username" 
          autocomplete="username" 
          style="display:none;" 
          aria-hidden="true"
        >
        <label for="password-input">Enter the password:</label>
        <input 
          type="password" 
          id="password-input" 
          name="password" 
          autocomplete="current-password"
          required
        >
        <button type="submit">Submit</button>
      </form>
    `,
  });

  const form = modalContent.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="password"]');
    const password = input.value.trim();
    document.body.removeChild(modal);
    resolve(password);
  });

  modal.appendChild(modalContent);
  return modal;
}

/**
 * Detect touch device and optimize UI
 */
export function detectTouchDevice() {
  const isTouchDevice = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    optimizeForTouch();
  }

  // Apply user-wrapper class for better compatibility
  document.querySelectorAll('.message-wrapper').forEach(wrapper => {
    if (wrapper.querySelector('.message.user')) {
      wrapper.classList.add('user-wrapper');
    }
  });
}

/**
 * Optimize UI for touch devices
 */
function optimizeForTouch() {
  // Make copy buttons always visible
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  });
}

/**
 * Create element helper
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style') {
      element.style.cssText = value;
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else {
      element[key] = value;
    }
  });
  
  return element;
}
