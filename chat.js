export const chatHistories = JSON.parse(localStorage.getItem('chatHistories')) || {};
export let activeChatId = null;

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
  localStorage.setItem('chatHistories', JSON.stringify(normalizedHistories));
};

export const addMessage = (role, content, skipHistory = false) => {
  if (!activeChatId) return;

  const messagesDiv = document.getElementById('messages');
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper');
  messageWrapper.innerHTML = `<div class="message ${role}">${role === 'bot' ? marked.parse(content) : content}</div>`;

  // Add "Copy" buttons to <pre> blocks
  messageWrapper.querySelectorAll('pre').forEach(pre => {
    const codeBlock = pre.querySelector('code');
    if (codeBlock) {
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-btn';
      copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent).then(() => {
          copyButton.textContent = 'Copied!';
          setTimeout(() => (copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>'), 2000);
        });
      });
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    }
  });

  // Add "Copy Message" button
  const messageCopyButton = document.createElement('button');
  messageCopyButton.className = 'copy-btn message-copy-btn';
  messageCopyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
  messageCopyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(messageWrapper.querySelector('.message').textContent).then(() => {
      messageCopyButton.textContent = 'Copied!';
      setTimeout(() => (messageCopyButton.innerHTML = '<i class="fa-regular fa-copy"></i>'), 2000);
    });
  });
  messageWrapper.appendChild(messageCopyButton);

  messagesDiv.appendChild(messageWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (!skipHistory) {
    chatHistories[activeChatId].messages.push({ role, content });
    saveChatsToLocalStorage();
  }
};

export const switchChat = (chatId) => {
  if (activeChatId === chatId) return;

  activeChatId = chatId;
  localStorage.setItem('activeChatId', activeChatId);

  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  const chat = chatHistories[chatId];
  if (chat && chat.messages) {
    chat.messages.forEach(({ role, content }) => {
      addMessage(role === 'user' ? 'user' : 'bot', content, true);
    });
  }

  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  document.querySelectorAll('.chat-item').forEach(chat => chat.classList.remove('active'));
  document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');
};

export const restoreChats = () => {
  const chatList = document.getElementById('chat-list');
  chatList.innerHTML = '';

  Object.keys(chatHistories).forEach((chatId) => {
    const chatName = chatHistories[chatId].name;
    const newChat = document.createElement('li');
    newChat.classList.add('chat-item');
    newChat.dataset.chatId = chatId;
    newChat.innerHTML = `${chatName} <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>`;
    chatList.appendChild(newChat);

    newChat.addEventListener('click', () => switchChat(chatId));
    addEllipsisMenu(newChat.querySelector('.ellipsis-btn'));
  });

  const lastActiveChatId = localStorage.getItem('activeChatId');
  if (lastActiveChatId && chatHistories[lastActiveChatId]) {
    switchChat(lastActiveChatId);
  } else if (Object.keys(chatHistories).length > 0) {
    switchChat(Object.keys(chatHistories)[0]);
  }
};

export const addNewChat = () => {
  const chatId = `chat-${Date.now()}`;
  chatHistories[chatId] = { name: `Chat ${Object.keys(chatHistories).length + 1}`, messages: [] };
  saveChatsToLocalStorage();

  const chatList = document.getElementById('chat-list');
  const newChat = document.createElement('li');
  newChat.classList.add('chat-item');
  newChat.dataset.chatId = chatId;
  newChat.innerHTML = `${chatHistories[chatId].name} <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>`;
  chatList.appendChild(newChat);

  newChat.addEventListener('click', () => switchChat(chatId));
  addEllipsisMenu(newChat.querySelector('.ellipsis-btn'));

  switchChat(chatId);
};

export const addEllipsisMenu = (ellipsisBtn) => {
  ellipsisBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    document.querySelector('.menu')?.remove();

    const menu = document.createElement('div');
    menu.classList.add('menu');
    menu.innerHTML = `
      <button class="menu-item rename-btn">Rename</button>
      <button class="menu-item delete-btn">Delete</button>
    `;
    document.body.appendChild(menu);

    const rect = ellipsisBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;

    // Rename chat functionality
    menu.querySelector('.rename-btn').addEventListener('click', () => {
      const newName = prompt('Enter a new name for the chat:');
      if (newName) {
        const chatId = ellipsisBtn.parentElement.dataset.chatId;
        chatHistories[chatId].name = newName; // Save the new name in chatHistories
        ellipsisBtn.parentElement.firstChild.textContent = newName; // Update the UI
        saveChatsToLocalStorage(); // Save to localStorage
      }
      menu.remove();
    });

    // Delete chat functionality
    menu.querySelector('.delete-btn').addEventListener('click', () => {
      const chatId = ellipsisBtn.parentElement.dataset.chatId;
      delete chatHistories[chatId];
      ellipsisBtn.parentElement.remove();
      saveChatsToLocalStorage();

      if (activeChatId === chatId) {
        const remainingChats = Object.keys(chatHistories);
        if (remainingChats.length > 0) {
          switchChat(remainingChats[0]);
        } else {
          activeChatId = null;
          document.getElementById('messages').innerHTML = '';
        }
      }
      menu.remove();
    });

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && event.target !== ellipsisBtn) menu.remove();
    }, { once: true });
  });
};