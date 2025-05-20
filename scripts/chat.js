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
  
  // Configure marked to properly handle code blocks with language
  marked.setOptions({
    highlight: function(code, lang) {
      if (Prism.languages[lang]) {
        return Prism.highlight(code, Prism.languages[lang], lang);
      }
      return code;
    }
  });
  
  const escapedContent =
    role === 'bot'
      ? marked.parse(content)
      : content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Add user-wrapper class to message wrappers containing user messages for better positioning
  const wrapperClassList = ['message-wrapper'];
  if (role === 'user') {
    wrapperClassList.push('user-wrapper');
  }

  const messageWrapper = createElement('div', {
    classList: wrapperClassList,
    dataset: { messageId },
    innerHTML: `<div class="message ${role}">${escapedContent}</div>`,
  });

  // Add language class and line-numbers class to pre elements
  messageWrapper.querySelectorAll('pre').forEach(pre => {
    pre.classList.add('line-numbers');
    const codeElement = pre.querySelector('code');
    if (codeElement) {
      // Try to find language class
      const codeClass = Array.from(codeElement.classList || []).find(cls => cls.startsWith('language-'));
      let language = 'code';
      
      if (codeClass) {
        language = codeClass.replace('language-', '');
      } else {
        // Try to detect language from content if no class is present
        const codeText = codeElement.textContent || '';
        if (codeText.includes('function') && codeText.includes('{')) language = 'javascript';
        else if (codeText.includes('def ') && codeText.includes(':')) language = 'python';
        else if (codeText.includes('<html>') || codeText.includes('</div>')) language = 'html';
        else if (codeText.includes('@media') || codeText.includes('{')) language = 'css';
        else if (codeText.includes('import ') && codeText.includes(' from ')) language = 'javascript';
        else if (codeText.startsWith('<?php')) language = 'php';
        // More detection rules can be added here
      }
      
      // Set the language attribute and ensure it's visible
      pre.setAttribute('data-language', language);
      
      // Ensure Prism highlights the code
      if (window.Prism && !codeClass) {
        codeElement.classList.add(`language-${language}`);
        try { window.Prism.highlightElement(codeElement); } catch (e) {}
      }
    } else {
      pre.setAttribute('data-language', 'code');
    }
  });

  addCopyButtons(messageWrapper);
  messagesDiv.appendChild(messageWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Ensure code highlighting works properly
  setTimeout(() => {
    try {
      // Properly initialize Prism only on elements that haven't been highlighted
      if (window.Prism) {
        // Only highlight elements that haven't been highlighted yet
        messageWrapper.querySelectorAll('pre:not([data-highlighted]) code').forEach(code => {
          Prism.highlightElement(code);
          code.parentElement.setAttribute('data-highlighted', 'true');
        });
        
        // Make sure language badges are visible
        messageWrapper.querySelectorAll('pre').forEach(pre => {
          // Skip if already properly styled
          if (pre.hasAttribute('data-processed')) return;
          
          // Mark as processed to avoid redundant operations
          pre.setAttribute('data-processed', 'true');
          
          // Make sure code blocks have proper overflow settings
          pre.style.overflow = 'auto';
          pre.style.overflowX = 'auto';
          pre.style.overflowY = 'auto';
          pre.style.maxHeight = '500px';
          pre.style.display = 'block';
          
          // Force language badge to be visible if it has a data-language attribute
          if (pre.getAttribute('data-language')) {
            const lang = pre.getAttribute('data-language');
            pre.setAttribute('data-language', lang); // Re-apply to trigger styles
          }
        });
      }
    } catch (e) {
      console.error('Error initializing syntax highlighting:', e);
    }
  }, 50);

  if (!skipHistory) {
    chatHistories[activeChatId].messages.push({ role, content });
    saveChatsToLocalStorage();
  }
};

const addCopyButtons = (messageWrapper) => {
  // Add copy button for the entire message
  const wrapperCopyButton = createCopyButton(() => {
    const messageElement = messageWrapper.querySelector('.message');
    return messageElement ? messageElement.textContent : '';
  });
  messageWrapper.appendChild(wrapperCopyButton);

  // Add copy buttons to each code block
  messageWrapper.querySelectorAll('pre:not([data-has-copy-btn])').forEach((element) => {
    // Mark this pre element as having a copy button to avoid duplicates
    element.setAttribute('data-has-copy-btn', 'true');
    
    // Make sure each code block has proper styling applied directly
    element.style.position = 'relative';
    element.style.overflow = 'auto';
    element.style.overflowX = 'auto';
    element.style.overflowY = 'auto';
    element.style.maxWidth = '100%';
    element.style.maxHeight = '500px';
    element.style.whiteSpace = 'pre';
    element.style.display = 'block';
    
    // Make sure language is detected and applied
    const codeElement = element.querySelector('code');
    if (codeElement) {
      // Try to find language class
      const codeClass = Array.from(codeElement.classList || []).find(cls => cls.startsWith('language-'));
      let language = 'code';
      
      if (codeClass) {
        language = codeClass.replace('language-', '');
      } else {
        // Try to detect language from content
        const codeText = codeElement.textContent || '';
        if (codeText.includes('function') && codeText.includes('{')) language = 'javascript';
        else if (codeText.includes('def ') && codeText.includes(':')) language = 'python';
        else if (codeText.includes('<html>') || codeText.includes('</div>')) language = 'html';
        else if (codeText.includes('@media') || codeText.includes('{')) language = 'css';
        else if (codeText.match(/print\s*\(/)) language = element.textContent.includes('import') ? 'python' : 'javascript';
        else if (codeText.includes('cat(')) language = 'r';
        else if (codeText.match(/puts(tln)?\s*["']/)) language = 'ruby';
      }
      
      // Force set the language attribute directly on the pre element
      element.setAttribute('data-language', language);
    } else {
      element.setAttribute('data-language', 'code');
    }
    
    // Create copy button with proper function
    const copyButton = document.createElement('button');
    copyButton.classList.add('code-copy-btn');
    copyButton.title = "Copy code";
    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
    
    // Remove any previous copy button to avoid duplicates
    const existingBtn = element.querySelector('.code-copy-btn');
    if (existingBtn) element.removeChild(existingBtn);
    
    // Add click handler
    copyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        const textToCopy = codeElement ? codeElement.textContent : element.textContent;
        await navigator.clipboard.writeText(textToCopy);
        
        // Visual confirmation
        copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyButton.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        
        setTimeout(() => {
          copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
          copyButton.style.backgroundColor = '';
        }, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
        // Use fallback
        const textarea = document.createElement('textarea');
        textarea.value = codeElement ? codeElement.textContent : element.textContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
      }
    });
    
    // Add the button
    element.appendChild(copyButton);
  });
};

const createCopyButton = (getText) => {
  const button = createElement('button', {
    classList: ['copy-btn'],
    innerHTML: '<i class="fa-regular fa-copy"></i>',
  });
  button.addEventListener('click', async (e) => {
    // Prevent default to avoid issues
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const text = getText();
      // Try to use the modern clipboard API
      await navigator.clipboard.writeText(text);
      
      // Visual confirmation
      button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      button.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      button.style.borderColor = 'rgba(16, 185, 129, 0.6)';
      
      // Reset after a delay
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
        button.style.backgroundColor = '';
        button.style.borderColor = '';
      }, 2000);
      
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error('Copy failed:', err);
      
      // Try fallback method
      const textArea = document.createElement('textarea');
      textArea.value = getText();
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      } catch (err) {
        console.error('Fallback copy failed:', err);
        button.innerHTML = '<i class="fa-solid fa-times"></i> Failed';
      }
      
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 2000);
      document.body.removeChild(textArea);
    }
    
    return false;
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
    innerHTML: `<div class="chat-item-content"><span class="chat-text">${chatName}</span></div><button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>`,
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
    
    // Calculate if menu would be below viewport
    const menuHeight = 150; // Approximate menu height
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    
    // Position menu above button if not enough space below
    if (spaceBelow < menuHeight) {
      menu.style.top = `${rect.top - menuHeight + window.scrollY}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
      menu.classList.add('menu-above');
    } else {
      menu.style.top = `${rect.bottom + window.scrollY}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
    }

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