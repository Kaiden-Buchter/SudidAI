export const chatHistories = JSON.parse(localStorage.getItem('chatHistories')) || {};
export let activeChatId = null;

export const saveChatsToLocalStorage = () => {
  localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
};

export const addMessage = (sender, text, skipHistory = false) => {
  if (!activeChatId) return;

  const messagesDiv = document.getElementById('messages');
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper');

  const parsedText = sender === 'bot' ? marked.parse(text) : text;

  messageWrapper.innerHTML = `
    <div class="message ${sender}">${parsedText}</div>
    <button class="copy-btn"><i class="fa-regular fa-copy"></i></button>
  `;

  messageWrapper.querySelector('.copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => alert('Message copied!'));
  });

  messagesDiv.appendChild(messageWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (!skipHistory) {
    chatHistories[activeChatId].push({ sender, text });
    saveChatsToLocalStorage();
  }
};

export const switchChat = (chatId) => {
  if (activeChatId === chatId) return;

  activeChatId = chatId;
  localStorage.setItem('activeChatId', activeChatId); // Save activeChatId to localStorage

  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  (chatHistories[chatId] || []).forEach(({ sender, text }) => {
    addMessage(sender, text, true);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  document.querySelectorAll('.chat-item').forEach(chat => chat.classList.remove('active'));
  const activeChatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
  if (activeChatElement) {
    activeChatElement.classList.add('active');
  }
};

export const restoreChats = () => {
  const chatList = document.getElementById('chat-list');
  chatList.innerHTML = ''; // Clear existing chats

  Object.keys(chatHistories).forEach((chatId, index) => {
    const newChat = document.createElement('li');
    newChat.classList.add('chat-item');
    newChat.dataset.chatId = chatId;
    newChat.innerHTML = `
      Chat ${index + 1}
      <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>
    `;
    chatList.appendChild(newChat);

    // Add event listener for switching chats
    newChat.addEventListener('click', () => switchChat(chatId));

    // Add ellipsis button functionality
    const ellipsisBtn = newChat.querySelector('.ellipsis-btn');
    addEllipsisMenu(ellipsisBtn);
  });

  // Restore the last active chat from localStorage
  const lastActiveChatId = localStorage.getItem('activeChatId');
  console.log('Restoring last active chat:', lastActiveChatId); // Debugging
  if (lastActiveChatId && chatHistories[lastActiveChatId]) {
    switchChat(lastActiveChatId); // Switch to the last active chat
  } else if (Object.keys(chatHistories).length > 0) {
    switchChat(Object.keys(chatHistories)[0]); // Load the first chat by default
  }
};

export const addNewChat = () => {
  const chatId = `chat-${Date.now()}`;
  chatHistories[chatId] = []; // Initialize an empty chat history
  saveChatsToLocalStorage();

  const chatList = document.getElementById('chat-list');
  const newChat = document.createElement('li');
  newChat.classList.add('chat-item');
  newChat.dataset.chatId = chatId;
  newChat.innerHTML = `
    Chat ${Object.keys(chatHistories).length}
    <button class="ellipsis-btn"><i class="fa-solid fa-ellipsis"></i></button>
  `;
  chatList.appendChild(newChat);

  // Add event listener for switching chats
  newChat.addEventListener('click', () => switchChat(chatId));

  // Add ellipsis button functionality
  const ellipsisBtn = newChat.querySelector('.ellipsis-btn');
  addEllipsisMenu(ellipsisBtn);

  switchChat(chatId); // Automatically switch to the new chat
};

export const addEllipsisMenu = (ellipsisBtn) => {
  ellipsisBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering the chat switch when clicking the ellipsis button

    // Remove any existing menu
    const existingMenu = document.querySelector('.menu');
    if (existingMenu) existingMenu.remove();

    // Create the menu
    const menu = document.createElement('div');
    menu.classList.add('menu');
    menu.innerHTML = `
      <button class="menu-item rename-btn">Rename</button>
      <button class="menu-item delete-btn">Delete</button>
    `;
    document.body.appendChild(menu);

    // Position the menu near the ellipsis button
    const rect = ellipsisBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;

    // Add functionality for renaming the chat
    menu.querySelector('.rename-btn').addEventListener('click', () => {
      const newName = prompt('Enter a new name for the chat:');
      if (newName) {
        ellipsisBtn.parentElement.firstChild.textContent = newName;
      }
      menu.remove();
    });

    // Add functionality for deleting the chat
    menu.querySelector('.delete-btn').addEventListener('click', () => {
      const chatId = ellipsisBtn.parentElement.dataset.chatId;
      delete chatHistories[chatId];
      ellipsisBtn.parentElement.remove();
      saveChatsToLocalStorage();

      // Switch to another chat if the active chat is deleted
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

    // Close the menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && event.target !== ellipsisBtn) {
        menu.remove();
      }
    }, { once: true });
  });
};