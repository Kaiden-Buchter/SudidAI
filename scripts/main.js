import { restoreChats, setupChatListDelegation } from './chat.js';
import { 
  toggleSidebar, 
  setupSearch, 
  setupSettingsModal, 
  setupAutoSave, 
  detectTouchDevice 
} from './ui.js';
import { 
  setupChatForm, 
  setupNewChatButton, 
  ensureAuthenticated 
} from './events.js';

/**
 * Application initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  const isAuthenticated = await ensureAuthenticated();
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize application components
  initializeApp();
  
  // Setup code highlighting after DOM is loaded
  if (document.readyState === 'complete') {
    setTimeout(initializeCodeHighlighting, 200);
  } else {
    window.addEventListener('load', () => {
      setTimeout(initializeCodeHighlighting, 200);
    });
  }
});

/**
 * Initialize all application features
 */
function initializeApp() {
  setupChatListDelegation(); // Setup event delegation once
  restoreChats();
  setupSearch();
  setupChatForm();
  setupAutoSave();
  setupNewChatButton();
  setupSettingsModal();
  setupLogoutButton();
  detectTouchDevice();
  
  // Setup sidebar toggle
  document.getElementById('sidebar-toggle')
    ?.addEventListener('click', toggleSidebar);
}

/**
 * Setup logout button
 */
function setupLogoutButton() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.href = 'login.html';
    }
  });
}

/**
 * Initialize code highlighting system
 */
function initializeCodeHighlighting() {
  if (!window.Prism) return;
  
  Prism.manual = false;
  highlightAllCodeBlocks();
  setupCodeBlockObserver();
}

/**
 * Setup mutation observer for dynamic code blocks
 */
function setupCodeBlockObserver() {
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) return;
  
  let isProcessing = false;
  
  const observer = new MutationObserver((mutations) => {
    if (isProcessing) return;
    
    const hasRelevantChanges = mutations.some(mutation => 
      mutation.type === 'childList' && 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === Node.ELEMENT_NODE &&
        (node.classList?.contains('message-wrapper') || 
         node.querySelector('pre, code'))
      )
    );
    
    if (hasRelevantChanges) {
      isProcessing = true;
      setTimeout(() => {
        highlightAllCodeBlocks();
        isProcessing = false;
      }, 100);
    }
  });
  
  observer.observe(messagesContainer, { 
    childList: true, 
    subtree: true 
  });
}

/**
 * Highlight all code blocks and ensure proper styling
 */
function highlightAllCodeBlocks() {
  document.querySelectorAll('pre').forEach(pre => {
    if (pre.hasAttribute('data-processed')) return;
    
    pre.setAttribute('data-processed', 'true');
    ensureCodeBlockLanguage(pre);
    ensureCodeBlockCopyButton(pre);
  });
  
  // Highlight code elements
  if (window.Prism) {
    document.querySelectorAll('pre:not([data-highlighted]) code').forEach(code => {
      try {
        Prism.highlightElement(code);
        code.parentElement?.setAttribute('data-highlighted', 'true');
      } catch (error) {
        console.error('Error highlighting code:', error);
      }
    });
  }
}

/**
 * Detect and set programming language for code block
 */
function ensureCodeBlockLanguage(pre) {
  const codeElement = pre.querySelector('code');
  if (!codeElement) {
    pre.setAttribute('data-language', 'code');
    return;
  }
  
  // Check for existing language class
  const codeClass = Array.from(codeElement.classList)
    .find(cls => cls.startsWith('language-'));
  
  if (codeClass) {
    const language = codeClass.replace('language-', '');
    pre.setAttribute('data-language', language);
    return;
  }
  
  // Detect language from content
  const language = detectLanguage(codeElement.textContent || '');
  pre.setAttribute('data-language', language);
  codeElement.classList.add(`language-${language}`);
}

/**
 * Detect programming language from code content
 */
function detectLanguage(code) {
  const patterns = {
    javascript: [/function\s+\w+\s*\(/, /const\s+\w+\s*=/, /console\.log\(/],
    python: [/def\s+\w+\s*\(.*\):/, /import\s+\w+/, /print\s*\(/],
    html: [/<html>/, /<div/, /<\/.*>/],
    css: [/@media/, /\{[^}]*:[^}]*\}/],
    java: [/public\s+class/, /System\.out\.println/],
    cpp: [/#include\s+<iostream>/, /std::/],
    rust: [/fn\s+main\(\)/, /let\s+mut/],
    go: [/func\s+main\(\)/, /fmt\.Println/],
    ruby: [/def\s+\w+/, /puts\s+/],
    php: [/<\?php/, /echo\s+/]
  };
  
  for (const [lang, regexps] of Object.entries(patterns)) {
    if (regexps.some(regex => regex.test(code))) {
      return lang;
    }
  }
  
  return 'code';
}

/**
 * Add copy button to code block if not present
 */
function ensureCodeBlockCopyButton(pre) {
  if (pre.querySelector('.code-copy-btn')) return;
  
  const copyButton = document.createElement('button');
  copyButton.classList.add('code-copy-btn');
  copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
  copyButton.title = 'Copy code';
  
  copyButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const code = pre.querySelector('code')?.textContent || pre.textContent;
    await copyToClipboard(code, copyButton);
  });
  
  pre.appendChild(copyButton);
}

/**
 * Copy text to clipboard with visual feedback
 */
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    showCopySuccess(button);
  } catch (error) {
    // Fallback for older browsers
    fallbackCopyToClipboard(text, button);
  }
}

/**
 * Fallback copy method for browsers without clipboard API
 */
function fallbackCopyToClipboard(text, button) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (error) {
    showCopyError(button);
  }
  
  document.body.removeChild(textarea);
}

/**
 * Show copy success feedback
 */
function showCopySuccess(button) {
  button.innerHTML = '<i class="fa-solid fa-check"></i>';
  setTimeout(() => {
    button.innerHTML = '<i class="fa-regular fa-copy"></i>';
  }, 2000);
}

/**
 * Show copy error feedback
 */
function showCopyError(button) {
  button.innerHTML = '<i class="fa-solid fa-times"></i>';
  setTimeout(() => {
    button.innerHTML = '<i class="fa-regular fa-copy"></i>';
  }, 2000);
}
