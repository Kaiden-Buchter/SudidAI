import {
  addMessage,
  addNewChat,
  chatHistories,
  saveChatsToLocalStorage,
  activeChatId,
} from './chat.js';

let isWaitingForResponse = false;

// Utility Functions
const updateSendButtonState = (sendButton, userInput) => {
  const isDisabled = !activeChatId || isWaitingForResponse;
  sendButton.disabled = isDisabled;
  userInput.disabled = isDisabled;
};

const createRequestBody = (currentChatId, userMessage) => ({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    ...(chatHistories[currentChatId]?.messages || []).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content,
    })),
    { role: 'user', content: userMessage },
  ],
});

const handleChatResponse = async (currentChatId, userMessage, thinkingMessageId) => {
  try {
    const response = await fetch('https://chatgpt-worker.knbuchtyy879.workers.dev/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(createRequestBody(currentChatId, userMessage)),
    });

    if (!response.ok) throw new Error('Failed to fetch response from ChatGPT API');

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
    chatHistories[currentChatId].messages.push({ role: 'assistant', content: botMessage });
    saveChatsToLocalStorage();

    const thinkingElement = document.querySelector(`[data-message-id="${thinkingMessageId}"]`);
    if (thinkingElement && activeChatId === currentChatId) {
      thinkingElement.querySelector('.message').innerHTML = marked.parse(botMessage);
    }
  } catch (error) {
    console.error('Error communicating with ChatGPT API:', error);
    const thinkingElement = document.querySelector(`[data-message-id="${thinkingMessageId}"]`);
    if (thinkingElement) {
      thinkingElement.innerHTML = `<div class="message bot">Sorry, something went wrong. Please try again.</div>`;
    }
  }
};

// Event Handlers
const handleChatFormSubmit = async (userInput, sendButton) => {
  if (!activeChatId || isWaitingForResponse) return;

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  isWaitingForResponse = true;
  updateSendButtonState(sendButton, userInput);

  const thinkingMessageId = `thinking-${Date.now()}`;
  addMessage('user', userMessage);
  addMessage('bot', '<div class="spinner"></div>', true, thinkingMessageId);
  userInput.value = '';

  await handleChatResponse(activeChatId, userMessage, thinkingMessageId);

  isWaitingForResponse = false;
  updateSendButtonState(sendButton, userInput);
};

// Setup Functions
export const setupChatForm = () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send');

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChatFormSubmit(userInput, sendButton);
  });

  document.addEventListener('activeChatChanged', () => updateSendButtonState(sendButton, userInput));
};

export const setupNewChatButton = () => {
  document.getElementById('new-chat-btn').addEventListener('click', addNewChat);
};