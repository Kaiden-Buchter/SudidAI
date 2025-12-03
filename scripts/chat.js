// Constants
const STORAGE_KEYS = {
  CHATS: 'chatHistories',
  ACTIVE_CHAT: 'activeChatId',
};

// State
export const chatHistories = loadChatHistories();
export let activeChatId = null;

/**
 * Scroll chat to bottom
 */
export function scrollToBottom() {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

/**
 * Load chat histories from localStorage
 */
function loadChatHistories() {
  const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Save chat histories to localStorage
 */
export function saveChatsToLocalStorage() {
  const sanitized = Object.fromEntries(
    Object.entries(chatHistories).map(([chatId, chat]) => [
      chatId,
      {
        ...chat,
        messages: chat.messages.map(msg => ({
          role: msg.role || (msg.sender === 'user' ? 'user' : 'bot'),
          content: msg.content || msg.text,
        })),
      },
    ])
  );
  
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(sanitized));
}

/**
 * Set active chat ID
 */
export function setActiveChatId(chatId) {
  activeChatId = chatId;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, activeChatId);
  document.dispatchEvent(new Event('activeChatChanged'));
}

/**
 * Add message to chat
 */
export function addMessage(role, content, skipHistory = false, messageId = null) {
  if (!activeChatId) return;

  const messagesDiv = document.getElementById('messages');
  const messageWrapper = createMessageElement(role, content, messageId);
  
  messagesDiv.appendChild(messageWrapper);
  scrollToBottom();

  if (!skipHistory) {
    chatHistories[activeChatId].messages.push({ role, content });
    saveChatsToLocalStorage();
  }

  // Highlight code blocks after a short delay
  setTimeout(() => highlightCodeBlocks(messageWrapper), 50);
}

/**
 * Create message element
 */
function createMessageElement(role, content, messageId) {
  const isUser = role === 'user';
  const classList = ['message-wrapper'];
  if (isUser) classList.push('user-wrapper');

  const parsedContent = isUser 
    ? escapeHTML(content)
    : marked.parse(content);

  const wrapper = createElement('div', {
    classList,
    dataset: { messageId },
    innerHTML: `<div class="message ${role}">${parsedContent}</div>`,
  });

  // Process code blocks
  wrapper.querySelectorAll('pre').forEach(pre => {
    processCodeBlock(pre);
  });

  // Add copy button for message
  addMessageCopyButton(wrapper);

  return wrapper;
}

/**
 * Process code block element
 */
function processCodeBlock(pre) {
  pre.classList.add('line-numbers');
  
  const codeElement = pre.querySelector('code');
  if (!codeElement) {
    pre.setAttribute('data-language', 'code');
    return;
  }

  // Detect language
  const language = detectCodeLanguage(codeElement);
  pre.setAttribute('data-language', language);
  
  if (!codeElement.classList.contains(`language-${language}`)) {
    codeElement.classList.add(`language-${language}`);
  }

  // Add copy button
  addCodeCopyButton(pre, codeElement);
}

/**
 * Detect programming language from code element
 */
function detectCodeLanguage(codeElement) {
  // Check for existing language class
  const existingClass = Array.from(codeElement.classList)
    .find(cls => cls.startsWith('language-'));
  
  if (existingClass) {
    return existingClass.replace('language-', '');
  }

  // Detect from content
  const code = codeElement.textContent || '';
  return detectLanguageFromCode(code);
}

/**
 * Detect language from code content
 */
function detectLanguageFromCode(code) {
  const detectors = [
    { lang: 'javascript', patterns: [/function\s+\w+/, /const\s+\w+\s*=/, /console\.log/] },
    { lang: 'python', patterns: [/def\s+\w+\(.*\):/, /import\s+\w+/, /print\(/] },
    { lang: 'html', patterns: [/<html>/, /<div/, /<\/\w+>/] },
    { lang: 'css', patterns: [/@media/, /\{[^}]*:[^}]*\}/] },
    { lang: 'java', patterns: [/public\s+class/, /System\.out/] },
    { lang: 'php', patterns: [/<\?php/, /echo\s+/] },
    { lang: 'ruby', patterns: [/def\s+\w+/, /puts\s+/] },
    { lang: 'go', patterns: [/func\s+main/, /fmt\.Println/] },
    { lang: 'rust', patterns: [/fn\s+main/, /let\s+mut/] },
  ];

  for (const { lang, patterns } of detectors) {
    if (patterns.some(pattern => pattern.test(code))) {
      return lang;
    }
  }

  return 'code';
}

/**
 * Add copy button to message wrapper
 */
function addMessageCopyButton(wrapper) {
  const button = createElement('button', {
    classList: ['copy-btn'],
    innerHTML: '<i class="fa-regular fa-copy"></i>',
  });

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const messageElement = wrapper.querySelector('.message');
    const text = messageElement ? messageElement.textContent : '';
    await copyToClipboard(text, button);
  });

  wrapper.appendChild(button);
}

/**
 * Add copy button to code block
 */
function addCodeCopyButton(pre, codeElement) {
  if (pre.querySelector('.code-copy-btn')) return;

  const button = createElement('button', {
    classList: ['code-copy-btn'],
    innerHTML: '<i class="fa-regular fa-copy"></i>',
    title: 'Copy code',
  });

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const text = codeElement.textContent || pre.textContent;
    await copyToClipboard(text, button);
  });

  pre.appendChild(button);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback(button, true);
  } catch (error) {
    fallbackCopy(text, button);
  }
}

/**
 * Fallback copy method
 */
function fallbackCopy(text, button) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showCopyFeedback(button, true);
  } catch (error) {
    showCopyFeedback(button, false);
  }
  
  document.body.removeChild(textarea);
}

/**
 * Show copy feedback
 */
function showCopyFeedback(button, success) {
  const icon = success 
    ? '<i class="fa-solid fa-check"></i>'
    : '<i class="fa-solid fa-times"></i>';
  
  button.innerHTML = icon;
  
  setTimeout(() => {
    button.innerHTML = '<i class="fa-regular fa-copy"></i>';
  }, 2000);
}

/**
 * Highlight code blocks using Prism
 */
function highlightCodeBlocks(wrapper) {
  if (!window.Prism) return;

  wrapper.querySelectorAll('pre:not([data-highlighted]) code').forEach(code => {
    try {
      Prism.highlightElement(code);
      code.parentElement?.setAttribute('data-highlighted', 'true');
    } catch (error) {
      console.error('Error highlighting code:', error);
    }
  });
}

/**
 * Switch to different chat
 */
export function switchChat(chatId) {
  if (activeChatId === chatId) return;

  setActiveChatId(chatId);
  
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  // Load chat history
  chatHistories[chatId]?.messages.forEach(({ role, content }) => {
    addMessage(role === 'user' ? 'user' : 'bot', content, true);
  });

  // Scroll to bottom after loading messages
  setTimeout(() => scrollToBottom(), 100);

  updateActiveChatUI(chatId);
}

/**
 * Update active chat UI
 */
function updateActiveChatUI(chatId) {
  const escapedId = CSS.escape(chatId);

  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`[data-chat-id="${escapedId}"]`);
  activeItem?.classList.add('active');
}

/**
 * Restore chats from storage
 */
export function restoreChats() {
  const chatList = document.getElementById('chat-list');
  chatList.innerHTML = '';

  const groupedChats = groupChatsByCategory();
  
  renderChatGroup(chatList, 'Pinned', groupedChats.pinned);
  renderChatsByDate(chatList, groupedChats.other);

  const lastActiveChatId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
  const firstChatId = Object.keys(chatHistories)[0];
  
  // Use requestAnimationFrame for smoother UI updates
  requestAnimationFrame(() => {
    switchChat(lastActiveChatId || firstChatId);
    // Ensure scroll to bottom after initial load
    setTimeout(() => scrollToBottom(), 150);
  });
}

/**
 * Setup event delegation for chat list (call once on init)
 */
export function setupChatListDelegation() {
  const chatList = document.getElementById('chat-list');
  
  // Delegate chat item clicks
  chatList.addEventListener('click', (e) => {
    const chatItem = e.target.closest('.chat-item');
    const ellipsisBtn = e.target.closest('.ellipsis-btn');
    
    if (ellipsisBtn && chatItem) {
      e.stopPropagation();
      const chatId = chatItem.dataset.chatId;
      showEllipsisMenu(ellipsisBtn, chatId);
    } else if (chatItem) {
      const chatId = chatItem.dataset.chatId;
      switchChat(chatId);
    }
  });
}

/**
 * Group chats by category (pinned/other)
 */
function groupChatsByCategory() {
  return Object.entries(chatHistories).reduce(
    (groups, [chatId, chat]) => {
      const key = chat.pinned ? 'pinned' : 'other';
      groups[key].push({ chatId, chat });
      return groups;
    },
    { pinned: [], other: [] }
  );
}

/**
 * Render chat group with label
 */
function renderChatGroup(chatList, label, chats) {
  if (chats.length === 0) return;

  chatList.appendChild(createElement('div', {
    classList: ['date-separator'],
    innerHTML: `<hr><span>${label}</span><hr>`,
  }));

  chats.forEach(({ chatId, chat }) => {
    chatList.appendChild(createChatItem(chatId, chat.name));
  });
}

/**
 * Render chats grouped by date
 */
function renderChatsByDate(chatList, chats) {
  const grouped = chats.reduce((groups, { chatId, chat }) => {
    const date = new Date(parseInt(chatId.split('-')[1], 10));
    const key = date.toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });

    groups[key] = groups[key] || [];
    groups[key].push({ chatId, chat });
    return groups;
  }, {});

  Object.entries(grouped)
    .sort(([, a], [, b]) => b[0].chatId - a[0].chatId)
    .forEach(([monthYear, chats]) => {
      renderChatGroup(chatList, monthYear, chats);
    });
}

/**
 * Create chat item element
 */
function createChatItem(chatId, chatName) {
  const item = createElement('li', {
    classList: ['chat-item'],
    dataset: { chatId },
    innerHTML: `
      <div class="chat-item-content">
        <span class="chat-text">${escapeHTML(chatName)}</span>
      </div>
      <button class="ellipsis-btn">
        <i class="fa-solid fa-ellipsis"></i>
      </button>
    `,
  });

  // Events handled by delegation, no individual listeners needed
  return item;
}

/**
 * Show ellipsis menu
 */
function showEllipsisMenu(button, chatId) {
  // Remove existing menu
  document.querySelector('.menu')?.remove();

  const menu = createEllipsisMenu(chatId);
  document.body.appendChild(menu);

  // Position menu
  positionMenu(menu, button);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== button) {
      menu.remove();
    }
  }, { once: true });
}

/**
 * Create ellipsis menu
 */
function createEllipsisMenu(chatId) {
  const isPinned = chatHistories[chatId]?.pinned;
  
  const menu = createElement('div', {
    classList: ['menu'],
    innerHTML: `
      <button class="menu-item pin-btn">
        <i class="fa-solid fa-thumbtack"></i>
        ${isPinned ? 'Unpin' : 'Pin'}
      </button>
      <button class="menu-item rename-btn">
        <i class="fa-solid fa-pen"></i>
        Rename
      </button>
      <button class="menu-item delete-btn">
        <i class="fa-solid fa-trash"></i>
        Delete
      </button>
    `,
  });

  menu.querySelector('.pin-btn')
    .addEventListener('click', () => handlePinChat(chatId, menu));
  menu.querySelector('.rename-btn')
    .addEventListener('click', () => handleRenameChat(chatId, menu));
  menu.querySelector('.delete-btn')
    .addEventListener('click', () => handleDeleteChat(chatId, menu));

  return menu;
}

/**
 * Position menu relative to button
 */
function positionMenu(menu, button) {
  const rect = button.getBoundingClientRect();
  const menuHeight = 150;
  const spaceBelow = window.innerHeight - rect.bottom;

  if (spaceBelow < menuHeight) {
    menu.style.top = `${rect.top - menuHeight + window.scrollY}px`;
  } else {
    menu.style.top = `${rect.bottom + window.scrollY}px`;
  }
  
  menu.style.left = `${rect.left + window.scrollX}px`;
}

/**
 * Handle pin/unpin chat
 */
function handlePinChat(chatId, menu) {
  chatHistories[chatId].pinned = !chatHistories[chatId].pinned;
  saveChatsToLocalStorage();
  
  // Debounced restore to prevent multiple rapid updates
  debounceRestoreChats();
  menu.remove();
}

/**
 * Handle rename chat
 */
function handleRenameChat(chatId, menu) {
  menu.remove();
  showRenameModal(chatId);
}

/**
 * Handle delete chat
 */
function handleDeleteChat(chatId, menu) {
  menu.remove();
  showDeleteConfirmModal(chatId);
}

/**
 * Show rename modal
 */
function showRenameModal(chatId) {
  const modal = createElement('div', {
    classList: ['modal'],
    innerHTML: `
      <div class="modal-content">
        <h2>Rename Chat</h2>
        <input type="text" id="rename-input" class="modal-input" 
               value="${escapeHTML(chatHistories[chatId].name)}" 
               placeholder="Enter new name">
        <div class="modal-buttons">
          <button class="modal-btn cancel-btn">Cancel</button>
          <button class="modal-btn confirm-btn">Rename</button>
        </div>
      </div>
    `,
  });

  document.body.appendChild(modal);
  
  const input = modal.querySelector('#rename-input');
  input.focus();
  input.select();

  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.confirm-btn').addEventListener('click', () => {
    const newName = input.value.trim();
    if (newName) {
      chatHistories[chatId].name = newName;
      saveChatsToLocalStorage();
      debounceRestoreChats();
    }
    modal.remove();
  });

  // Enter to confirm, Escape to cancel
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      modal.querySelector('.confirm-btn').click();
    } else if (e.key === 'Escape') {
      modal.remove();
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmModal(chatId) {
  const modal = createElement('div', {
    classList: ['modal'],
    innerHTML: `
      <div class="modal-content">
        <h2>Delete Chat</h2>
        <p>Are you sure you want to delete "${escapeHTML(chatHistories[chatId].name)}"?</p>
        <p class="modal-warning">This action cannot be undone.</p>
        <div class="modal-buttons">
          <button class="modal-btn cancel-btn">Cancel</button>
          <button class="modal-btn delete-btn">Delete</button>
        </div>
      </div>
    `,
  });

  document.body.appendChild(modal);

  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.delete-btn').addEventListener('click', () => {
    delete chatHistories[chatId];
    saveChatsToLocalStorage();

    if (activeChatId === chatId) {
      const remainingChats = Object.keys(chatHistories);
      if (remainingChats.length > 0) {
        switchChat(remainingChats[0]);
      } else {
        document.getElementById('messages').innerHTML = '';
      }
    }
    
    debounceRestoreChats();
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Debounce helper for restoreChats
let restoreChatsTimeout;
function debounceRestoreChats() {
  clearTimeout(restoreChatsTimeout);
  restoreChatsTimeout = setTimeout(() => restoreChats(), 100);
}

/**
 * Add new chat
 */
export function addNewChat() {
  const chatId = `chat-${Date.now()}`;
  const chatNumber = Object.keys(chatHistories).length + 1;
  
  chatHistories[chatId] = {
    name: `Chat ${chatNumber}`,
    messages: [],
  };
  
  saveChatsToLocalStorage();
  debounceRestoreChats();
  switchChat(chatId);
}

/**
 * Utility: Create element with options
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'classList') {
      element.classList.add(...value);
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (key === 'style') {
      element.style.cssText = value;
    } else {
      element[key] = value;
    }
  });
  
  return element;
}

/**
 * Utility: Escape HTML
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
