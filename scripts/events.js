import {
  addMessage,
  addNewChat,
  chatHistories,
  saveChatsToLocalStorage,
  activeChatId,
} from './chat.js';

// Utility Functions
const updateSendButtonState = (sendButton, userInput) => {
  const isDisabled = !activeChatId;
  sendButton.disabled = isDisabled;
  userInput.disabled = isDisabled;
};

const createRequestBody = (currentChatId, userMessage) => {
  const systemMessage = { role: 'system', content: 'You are a helpful assistant.' };
  const chatMessages = chatHistories[currentChatId]?.messages?.map((message) => ({
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.text || message.content, // Normalize structure
  })) || [];

  return {
    messages: [systemMessage, ...chatMessages, { role: 'user', content: userMessage }],
  };
};

const handleChatResponse = async (currentChatId, userMessage) => {
  let thinkingMessageId = null;

  try {
    // Add a "thinking" spinner to the UI
    thinkingMessageId = `thinking-${Date.now()}`;
    addMessage('bot', '<div class="spinner"></div>', true, thinkingMessageId);

    const requestBody = createRequestBody(currentChatId, userMessage);

    const response = await fetch('https://chatgpt-worker.knbuchtyy879.workers.dev/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch response from ChatGPT API');
    }

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
    chatHistories[currentChatId].messages.push({ role: 'assistant', content: botMessage });
    saveChatsToLocalStorage();

    // Replace the "thinking" message with the bot's response
    if (activeChatId === currentChatId) {
      const thinkingMessageElement = document.querySelector(`[data-message-id="${thinkingMessageId}"]`);
      if (thinkingMessageElement) {
        const messageContent = thinkingMessageElement.querySelector('.message');
        if (messageContent) {
          messageContent.innerHTML = marked.parse(botMessage); // Update only the content
        }
      }
    }
  } catch (error) {
    console.error('Error communicating with ChatGPT API:', error);

    // Replace the "thinking" message with an error message
    if (thinkingMessageId) {
      const thinkingMessageElement = document.querySelector(`[data-message-id="${thinkingMessageId}"]`);
      if (thinkingMessageElement) {
        thinkingMessageElement.innerHTML = `<div class="message bot">Sorry, something went wrong. Please try again.</div>`;
      }
    }
  }
};

// Event Handlers
const handleChatFormSubmit = async (e, userInput, sendButton) => {
  e.preventDefault();

  if (!activeChatId) {
    console.warn('No active chat. Cannot send messages.');
    return;
  }

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  addMessage('user', userMessage); // Add user message to the UI
  userInput.value = ''; // Clear input field

  const currentChatId = activeChatId; // Capture the current chat ID
  await handleChatResponse(currentChatId, userMessage);
};

// Setup Functions
export const setupChatForm = () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send');

  // Initialize send button state
  updateSendButtonState(sendButton, userInput);

  // Add event listener for form submission
  chatForm.addEventListener('submit', (e) => handleChatFormSubmit(e, userInput, sendButton));

  // Update the send button state whenever the active chat changes
  document.addEventListener('activeChatChanged', () => updateSendButtonState(sendButton, userInput));
};

export const setupNewChatButton = () => {
  const newChatBtn = document.getElementById('new-chat-btn');
  newChatBtn.addEventListener('click', addNewChat);
};