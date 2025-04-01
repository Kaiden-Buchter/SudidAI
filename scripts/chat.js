// Constants
const LOCAL_STORAGE_KEY = 'chatHistories';
const ACTIVE_CHAT_KEY = 'activeChatId';

// State
export const chatHistories = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
export let activeChatId = null;

// Utility Functions
const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'classList') element.classList.add(...value);
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else element[key] = value;
  });
  return element;
};

// Chat Management
export const setActiveChatId = (chatId) => {
  activeChatId = chatId;
  saveToLocalStorage(ACTIVE_CHAT_KEY, activeChatId);
  document.dispatchEvent(new Event('activeChatChanged'));
};

export const saveChatsToLocalStorage = () => {
  const normalizedHistories = Object.fromEntries(
    Object.entries(chatHistories).map(([chatId, chat]) => [
      chatId,
      {
        ...chat,
        messages: chat.messages.map(({ role, content, sender, text }) => ({
          role: role || (sender === 'user' ? 'user' : 'bot'),
          content: content || text,
        })),
      },
    ])
  );
  saveToLocalStorage(LOCAL_STORAGE_KEY, normalizedHistories);
};

export const addMessage = (role, content, skipHistory = false, messageId = null) => {
  if (!activeChatId) return;

  const messagesDiv = document.getElementById('messages');
  const messageWrapper = createElement('div', { 
    classList: ['message-wrapper'], 
    dataset: { messageId } 
  });

  // Escape HTML content to prevent rendering of HTML tags
  const escapeHTML = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const escapedContent = role === 'bot' ? marked.parse(content) : escapeHTML(content);

  messageWrapper.innerHTML = `<div class="message ${role}">${escapedContent}</div>`;

  addCopyButtons(messageWrapper);

  messagesDiv.appendChild(messageWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  Prism.highlightAll();

  if (!skipHistory) {
    chatHistories[activeChatId].messages.push({ role, content });
    saveChatsToLocalStorage();
  }
};

const addCopyButtons = (messageWrapper) => {
  messageWrapper.querySelectorAll('pre').forEach(pre => {
    const codeBlock = pre.querySelector('code');
    if (codeBlock) {
      // Add copy button
      const copyButton = createCopyButton(() => codeBlock.textContent);
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    }
  });

  const messageCopyButton = createCopyButton(() => messageWrapper.querySelector('.message').textContent);
  messageWrapper.appendChild(messageCopyButton);
};

const createCopyButton = (getText) => {
  const button = createElement('button', { classList: ['copy-btn'], innerHTML: '<i class="fa-regular fa-copy"></i>' });
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(getText()).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => (button.innerHTML = '<i class="fa-regular fa-copy"></i>'), 2000);
    });
  });
  return button;
};

// UI Updates
export const switchChat = (chatId) => {
  if (activeChatId === chatId) return;

  setActiveChatId(chatId);

  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  const chat = chatHistories[chatId];
  if (chat?.messages) {
    chat.messages.forEach(({ role, content }) => addMessage(role === 'user' ? 'user' : 'bot', content, true));
  }

  updateActiveChatUI(chatId);
};

const updateActiveChatUI = (chatId) => {
  document.querySelectorAll('.chat-item').forEach(chat => chat.classList.remove('active'));
  document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');
};

export const restoreChats = () => {
  const chatList = document.getElementById('chat-list');
  chatList.innerHTML = '';

  Object.keys(chatHistories).forEach(chatId => {
    const chatName = chatHistories[chatId].name;
    const chatItem = createChatItem(chatId, chatName);
    chatList.appendChild(chatItem);
  });

  const lastActiveChatId = localStorage.getItem(ACTIVE_CHAT_KEY);
  if (lastActiveChatId && chatHistories[lastActiveChatId]) {
    switchChat(lastActiveChatId);
  } else if (Object.keys(chatHistories).length > 0) {
    switchChat(Object.keys(chatHistories)[0]);
  }
};

const createChatItem = (chatId, chatName) => {
  const chatItem = createElement('li', { classList: ['chat-item'], dataset: { chatId }, innerHTML: `${chatName} <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>` });
  chatItem.addEventListener('click', () => switchChat(chatId));
  addEllipsisMenu(chatItem.querySelector('.ellipsis-btn'));
  return chatItem;
};

export const addNewChat = () => {
  const chatId = `chat-${Date.now()}`;
  chatHistories[chatId] = { name: `Chat ${Object.keys(chatHistories).length + 1}`, messages: [] };
  saveChatsToLocalStorage();

  const chatList = document.getElementById('chat-list');
  const newChat = createChatItem(chatId, chatHistories[chatId].name);
  chatList.appendChild(newChat);

  switchChat(chatId);
};

// Ellipsis Menu
export const addEllipsisMenu = (ellipsisBtn) => {
  ellipsisBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.menu')?.remove();

    const menu = createEllipsisMenu(ellipsisBtn);
    document.body.appendChild(menu);

    const rect = ellipsisBtn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && event.target !== ellipsisBtn) menu.remove();
    }, { once: true });
  });
};

const createEllipsisMenu = (ellipsisBtn) => {
  const menu = createElement('div', { classList: ['menu'], innerHTML: `
    <button class="menu-item rename-btn">Rename</button>
    <button class="menu-item delete-btn">Delete</button>
  ` });

  menu.querySelector('.rename-btn').addEventListener('click', () => handleRenameChat(ellipsisBtn, menu));
  menu.querySelector('.delete-btn').addEventListener('click', () => handleDeleteChat(ellipsisBtn, menu));

  return menu;
};

const handleRenameChat = (ellipsisBtn, menu) => {
  const newName = prompt('Enter a new name for the chat:');
  if (newName) {
    const chatId = ellipsisBtn.parentElement.dataset.chatId;
    chatHistories[chatId].name = newName;
    ellipsisBtn.parentElement.firstChild.textContent = newName;
    saveChatsToLocalStorage();
  }
  menu.remove();
};

const handleDeleteChat = (ellipsisBtn, menu) => {
  const chatId = ellipsisBtn.parentElement.dataset.chatId;
  delete chatHistories[chatId];
  ellipsisBtn.parentElement.remove();
  saveChatsToLocalStorage();

  if (activeChatId === chatId) {
    const remainingChats = Object.keys(chatHistories);
    if (remainingChats.length > 0) {
      switchChat(remainingChats[0]);
    } else {
      setActiveChatId(null);
      document.getElementById('messages').innerHTML = '';
    }
  }
  menu.remove();
};