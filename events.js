import { addMessage, addNewChat, chatHistories, saveChatsToLocalStorage, activeChatId } from './chat.js';

export const setupChatForm = () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();

    if (userMessage) {
      addMessage('user', userMessage); // Add user message
      userInput.value = ''; // Clear input field

      const currentChatId = activeChatId; // Capture the current chat ID
      console.log('Current Chat ID:', currentChatId); // Debugging

      // Simulate bot response after a delay
      setTimeout(() => {
        if (chatHistories[currentChatId]) {
          const botMessage = `
### Heading 3
**Bold Text**
*Italic Text*
\`Inline Code\`

\`\`\`javascript
// Code block example
console.log('Hello, world!');
\`\`\`

- List Item 1
- List Item 2
          `;
          
          // Debugging
          console.log('Current Chat ID:', currentChatId);
          console.log('Chat Histories:', chatHistories);
          console.log('Bot Message:', botMessage);
          
          // Add bot response to chat history
          chatHistories[currentChatId].push({ sender: 'bot', text: botMessage });

          // Add bot response to the UI
          if (activeChatId === currentChatId) {
            addMessage('bot', botMessage, true);
          }

          // Save updated chat history to local storage
          saveChatsToLocalStorage();
          console.log('Chat Histories Updated:', chatHistories); // Debugging
        } else {
          console.error('Chat history not found for currentChatId:', currentChatId);
        }
      }, 1000); // 1-second delay for bot response
    }
  });
};

export const setupNewChatButton = () => {
  const newChatBtn = document.getElementById('new-chat-btn');
  newChatBtn.addEventListener('click', addNewChat);
};