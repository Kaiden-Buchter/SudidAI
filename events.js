import { addMessage, addNewChat, chatHistories, saveChatsToLocalStorage, activeChatId } from './chat.js';

export const setupChatForm = () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();

    if (userMessage) {
      addMessage('user', userMessage); // Add user message to the UI
      userInput.value = ''; // Clear input field

      const currentChatId = activeChatId; // Capture the current chat ID

      try {
        // Send user message to the Cloudflare Worker
        const requestBody = {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...(Array.isArray(chatHistories[currentChatId]?.messages)
              ? chatHistories[currentChatId].messages.map((message) => ({
                  role: message.sender === 'user' ? 'user' : 'assistant',
                  content: message.text || message.content, // Normalize structure
                }))
              : []),
            { role: 'user', content: userMessage },
          ],
        };
        console.log('Request Body:', requestBody);
        
        const response = await fetch('https://chatgpt-worker.knbuchtyy879.workers.dev/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response from ChatGPT API');
        }

        const data = await response.json();
        if (!chatHistories[currentChatId]) {
          chatHistories[currentChatId] = { messages: [] };
        }
        
        const botMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
        chatHistories[currentChatId].messages.push({ role: 'assistant', content: botMessage });
        saveChatsToLocalStorage(); // Save the updated chat history
        // Add bot response to the UI
        if (activeChatId === currentChatId) {
          addMessage('bot', botMessage, true);
        }
      } catch (error) {
        console.error('Error communicating with ChatGPT API:', error);
        addMessage('bot', 'Sorry, something went wrong. Please try again.', true);
      }
    }
  });
};

export const setupNewChatButton = () => {
  const newChatBtn = document.getElementById('new-chat-btn');
  newChatBtn.addEventListener('click', addNewChat);
};