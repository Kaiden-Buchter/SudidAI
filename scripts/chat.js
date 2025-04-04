// Constants
const LOCAL_STORAGE_KEY = 'chatHistories';
const ACTIVE_CHAT_KEY = 'activeChatId';

// State
export const chatHistories = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
export let activeChatId = null;

// Utility Functions
const saveToLocalStorage = (key, value) => {
  if (typeof value === 'string') {
    localStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

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
  saveToLocalStorage(
    LOCAL_STORAGE_KEY,
    Object.fromEntries(
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
    )
  );
};

export const addMessage = (role, content, skipHistory = false, messageId = null) => {
  if (!activeChatId) return;

  const messagesDiv = document.getElementById('messages');
  const escapedContent =
    role === 'bot'
      ? marked.parse(content)
      : content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const messageWrapper = createElement('div', {
    classList: ['message-wrapper'],
    dataset: { messageId },
    innerHTML: `<div class="message ${role}">${escapedContent}</div>`,
  });

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
  const wrapperCopyButton = createCopyButton(() => {
    const messageElement = messageWrapper.querySelector('.message');
    return messageElement ? messageElement.textContent : '';
  });
  messageWrapper.appendChild(wrapperCopyButton);

  messageWrapper.querySelectorAll('pre').forEach((element) => {
    const copyButton = createCopyButton(() => element.textContent);
    element.style.position = 'relative';
    element.appendChild(copyButton);
  });
};

const createCopyButton = (getText) => {
  const button = createElement('button', {
    classList: ['copy-btn'],
    innerHTML: '<i class="fa-regular fa-copy"></i>',
  });
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

  chatHistories[chatId]?.messages.forEach(({ role, content }) =>
    addMessage(role === 'user' ? 'user' : 'bot', content, true)
  );

  updateActiveChatUI(chatId);
};

const updateActiveChatUI = (chatId) => {
  const escapedChatId = CSS.escape(chatId);

  document.querySelectorAll('.chat-item').forEach((chat) => chat.classList.remove('active'));
  const chatElement = document.querySelector(`[data-chat-id="${escapedChatId}"]`);
  if (chatElement) {
    chatElement.classList.add('active');
  } else {
    console.warn('No chat item found for chatId:', chatId);
  }
};

export const restoreChats = () => {
  const chatList = document.getElementById('chat-list');
  chatList.innerHTML = '';

  const groupedChats = Object.entries(chatHistories).reduce(
    (groups, [chatId, chat]) => {
      const groupKey = chat.pinned ? 'Pinned' : 'Other';
      groups[groupKey].push({ chatId, chat });
      return groups;
    },
    { Pinned: [], Other: [] }
  );

  renderChatGroup(chatList, 'Pinned', groupedChats.Pinned);
  renderChats(chatList, groupedChats.Other);

  const lastActiveChatId = localStorage.getItem(ACTIVE_CHAT_KEY);
  switchChat(lastActiveChatId || Object.keys(chatHistories)[0]);
};

const renderChatGroup = (chatList, label, chats) => {
  if (chats.length === 0) return;

  chatList.appendChild(
    createElement('div', {
      classList: ['date-separator'],
      innerHTML: `<hr><span>${label}</span>`,
    })
  );

  chats.forEach(({ chatId, chat }) => chatList.appendChild(createChatItem(chatId, chat.name)));
};

const renderChats = (chatList, otherChats) => {
  const groupedByDate = otherChats.reduce((groups, { chatId, chat }) => {
    const date = new Date(parseInt(chatId.split('-')[1], 10));
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    groups[monthYear] = groups[monthYear] || [];
    groups[monthYear].push({ chatId, chat });
    return groups;
  }, {});

  Object.entries(groupedByDate)
    .sort(([, a], [, b]) => b[0] - a[0])
    .forEach(([monthYear, chats]) => renderChatGroup(chatList, monthYear, chats));
};

const createChatItem = (chatId, chatName) => {
  const chatItem = createElement('li', {
    classList: ['chat-item'],
    dataset: { chatId },
    innerHTML: `${chatName} <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>`,
  });
  chatItem.addEventListener('click', () => switchChat(chatId));
  addEllipsisMenu(chatItem.querySelector('.ellipsis-btn'));
  return chatItem;
};

export const addNewChat = () => {
  const chatId = `chat-${Date.now()}`;
  chatHistories[chatId] = { name: `Chat ${Object.keys(chatHistories).length + 1}`, messages: [] };
  saveChatsToLocalStorage();
  restoreChats();
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

    document.addEventListener(
      'click',
      (event) => {
        if (!menu.contains(event.target) && event.target !== ellipsisBtn) menu.remove();
      },
      { once: true }
    );
  });
};

const createEllipsisMenu = (ellipsisBtn) => {
  const chatId = ellipsisBtn.parentElement.dataset.chatId;
  const menu = createElement('div', {
    classList: ['menu'],
    innerHTML: `
    <button class="menu-item pin-btn">${chatHistories[chatId]?.pinned ? 'Unpin' : 'Pin'}</button>
      <button class="menu-item rename-btn">Rename</button>
      <button class="menu-item delete-btn">Delete</button>
    `,
  });

  menu.querySelector('.rename-btn').addEventListener('click', () => handleRenameChat(chatId, menu));
  menu.querySelector('.delete-btn').addEventListener('click', () => handleDeleteChat(chatId, menu));
  menu.querySelector('.pin-btn').addEventListener('click', () => handlePinChat(chatId, menu));

  return menu;
};

const handlePinChat = (chatId, menu) => {
  chatHistories[chatId].pinned = !chatHistories[chatId].pinned;
  saveChatsToLocalStorage();
  restoreChats();
  menu.remove();
};

const handleRenameChat = (chatId, menu) => {
  const newName = prompt('Enter a new name for the chat:');
  if (newName) {
    chatHistories[chatId].name = newName;
    saveChatsToLocalStorage();
    restoreChats();
  }
  menu.remove();
};

const handleDeleteChat = (chatId, menu) => {
  delete chatHistories[chatId];
  saveChatsToLocalStorage();
  restoreChats();

  if (activeChatId === chatId) {
    const remainingChats = Object.keys(chatHistories);
    switchChat(remainingChats[0] || null);
    if (!remainingChats.length) document.getElementById('messages').innerHTML = '';
  }
  menu.remove();
};