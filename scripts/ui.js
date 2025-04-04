// Sidebar Toggle
export const toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('sidebar-hidden');
  sidebar.classList.toggle('sidebar-visible');
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
};

const toggleModal = (modal, isHidden, focusElement) => {
  modal.classList.toggle('hidden', isHidden);
  modal.setAttribute('aria-hidden', isHidden.toString());
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