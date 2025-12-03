import {
  addMessage,
  addNewChat,
  chatHistories,
  saveChatsToLocalStorage,
  activeChatId,
} from './chat.js';
import { createShowPasswordPrompt } from './ui.js';

// State management
let isWaitingForResponse = false;
const API_BASE_URL = 'https://api.sudid.org/api';

/**
 * Setup chat form event listeners
 */
export function setupChatForm() {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send');

  // Handle Enter key submission
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Handle form submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChatSubmission(userInput, sendButton);
  });

  // Update button state when active chat changes
  document.addEventListener('activeChatChanged', () => {
    updateSendButtonState(sendButton, userInput);
  });
}

/**
 * Setup new chat button
 */
export function setupNewChatButton() {
  const newChatBtn = document.getElementById('new-chat-btn');
  newChatBtn?.addEventListener('click', addNewChat);
}

/**
 * Handle chat form submission
 */
async function handleChatSubmission(userInput, sendButton) {
  if (!canSendMessage()) return;

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Update UI state
  isWaitingForResponse = true;
  updateSendButtonState(sendButton, userInput);

  // Add user message and thinking indicator
  const thinkingId = `thinking-${Date.now()}`;
  addMessage('user', userMessage);
  addMessage('bot', '<div class="spinner"></div>', true, thinkingId);
  
  // Clear input and save state
  userInput.value = '';
  localStorage.setItem('chat_draft', '');

  // Send request to API
  await sendChatRequest(activeChatId, userMessage, thinkingId);

  // Reset state
  isWaitingForResponse = false;
  updateSendButtonState(sendButton, userInput);
}

/**
 * Check if message can be sent
 */
function canSendMessage() {
  return activeChatId && !isWaitingForResponse;
}

/**
 * Update send button state
 */
function updateSendButtonState(sendButton, userInput) {
  const isDisabled = !canSendMessage();
  sendButton.disabled = isDisabled;
  userInput.disabled = isDisabled;
}

/**
 * Send chat request to API
 */
async function sendChatRequest(chatId, userMessage, thinkingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(createRequestBody(chatId, userMessage)),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    handleChatResponse(chatId, data, thinkingId);
  } catch (error) {
    console.error('Chat API error:', error);
    handleChatError(thinkingId);
  }
}

/**
 * Create request body for chat API
 */
function createRequestBody(chatId, userMessage) {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' }
  ];

  // Add conversation history
  const history = chatHistories[chatId]?.messages || [];
  messages.push(...history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content || msg.text,
  })));

  // Add new user message
  messages.push({ role: 'user', content: userMessage });

  return { messages };
}

/**
 * Handle successful chat response
 */
function handleChatResponse(chatId, data, thinkingId) {
  const botMessage = data.choices?.[0]?.message?.content || 
    'Sorry, I could not process your request.';

  // Save to history
  chatHistories[chatId].messages.push({ 
    role: 'assistant', 
    content: botMessage 
  });
  saveChatsToLocalStorage();

  // Update UI
  const thinkingElement = document.querySelector(
    `[data-message-id="${thinkingId}"]`
  );
  
  if (thinkingElement && activeChatId === chatId) {
    thinkingElement.querySelector('.message').innerHTML = 
      marked.parse(botMessage);
  }
}

/**
 * Handle chat API error
 */
function handleChatError(thinkingId) {
  const thinkingElement = document.querySelector(
    `[data-message-id="${thinkingId}"]`
  );
  
  if (thinkingElement) {
    thinkingElement.innerHTML = 
      '<div class="message bot">Sorry, something went wrong. Please try again.</div>';
  }
}

/**
 * Get authentication token from storage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}

/**
 * Ensure user is authenticated
 */
export async function ensureAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const expiration = localStorage.getItem('auth_expiration');

  // Check if token exists and is valid
  if (token && expiration && Date.now() < parseInt(expiration, 10)) {
    return true;
  }

  // No valid token, redirect to login
  return false;
}

/**
 * Check if current token is valid
 */
function isTokenValid() {
  const token = localStorage.getItem('auth_token');
  const expiration = localStorage.getItem('auth_expiration');

  return token && expiration && Date.now() < parseInt(expiration, 10);
}
