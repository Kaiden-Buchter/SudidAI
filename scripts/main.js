import { restoreChats } from './chat.js';
import { toggleSidebar, setupSearch, setupSettingsModal, setupAutoSave, detectTouchDevice } from './ui.js';
import { setupChatForm, setupNewChatButton, ensureAuthenticated } from './events.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await ensureAuthenticated();
  if (!isAuthenticated) {
    alert('Access denied. Please refresh the page to try again.');
    return;
  }

  restoreChats();
  setupSearch();
  setupChatForm();
  setupAutoSave();
  setupNewChatButton();
  setupSettingsModal();
  detectTouchDevice(); // Detect touch devices and optimize UI accordingly
  
  // Initialize code highlighting with a proper debounce
  setupCodeHighlighting(); 
  
  // Process any existing code blocks once the page is fully loaded
  // Delay this operation to ensure it doesn't block UI rendering
  if (document.readyState === 'complete') {
    setTimeout(() => {
      fixCodeBlocks();
      ensureScrollbarsVisible();
    }, 200);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        fixCodeBlocks();
        ensureScrollbarsVisible();
      }, 200);
    });
  }
  
  const toggleSidebarBtn = document.getElementById('sidebar-toggle');
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
});

// Function to ensure code highlighting works properly
function setupCodeHighlighting() {
  // Configure Prism for optimal code highlighting
  if (window.Prism) {
    // Ensure Prism is initialized with proper settings
    Prism.manual = false;
    
    // Apply immediately to any existing code blocks
    fixCodeBlocks();
    
    // Re-highlight all code blocks whenever messages are added or updated
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      // Use a flag to prevent infinite loops
      let isProcessing = false;
      
      const observer = new MutationObserver((mutations) => {
        // Skip if we're already processing or if mutations only affected attributes we modify
        if (isProcessing) return;
        
        // Check if any relevant mutations occurred (new messages or code blocks)
        const relevantChanges = mutations.some(mutation => {
          // Check for new nodes that might contain code blocks
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            return Array.from(mutation.addedNodes).some(node => {
              // Only process element nodes
              if (node.nodeType !== Node.ELEMENT_NODE) return false;
              
              // Check if this is a message or contains pre/code elements
              return node.classList?.contains('message-wrapper') || 
                     node.querySelector('pre, code');
            });
          }
          return false;
        });
        
        // Only process if we found relevant changes
        if (relevantChanges) {
          isProcessing = true;
          setTimeout(() => {
            fixCodeBlocks();
            ensureScrollbarsVisible();
            isProcessing = false;
          }, 100);
        }
      });
      
      observer.observe(messagesContainer, { childList: true, subtree: true });
    }
  }
}

// Helper function to fix all code blocks in the document
function fixCodeBlocks() {
  // Only process pre elements that haven't been processed or need updating
  document.querySelectorAll('pre:not([data-processed]), pre:not([style*="overflow"])').forEach(pre => {
    // Prevent duplicate processing
    pre.setAttribute('data-processed', 'true');
    
    // Force scrollbars to appear with inline styles (highest specificity)
    // Note: Do NOT set overflow to visible as it cancels out overflow-x and overflow-y
    pre.style.overflow = 'auto';      // Set the main overflow first
    pre.style.overflowX = 'auto';     // Then specify x direction
    pre.style.overflowY = 'auto';     // And y direction
    pre.style.maxWidth = '100%';
    pre.style.maxHeight = '500px';    // Add max-height to ensure vertical scrolling
    pre.style.position = 'relative';
    pre.style.whiteSpace = 'pre';
    pre.style.display = 'block';      // Ensure block display
    
    // Ensure language detection works
    if (!pre.getAttribute('data-language')) {
      const codeElement = pre.querySelector('code');
      if (codeElement) {
        // Try to find language class
        const codeClass = Array.from(codeElement.classList || []).find(cls => cls.startsWith('language-'));
        let language = 'code';
        
        if (codeClass) {
          language = codeClass.replace('language-', '');
        } else {
          // Try to detect language from content
          const codeText = codeElement.textContent || '';
          
          // JavaScript/TypeScript detection
          if (codeText.includes('function') && codeText.includes('{')) language = 'javascript';
          else if (codeText.includes('console.log(') || codeText.includes('const ') || codeText.includes('let ')) language = 'javascript';
          else if (codeText.includes('import ') && codeText.includes(' from ')) language = 'javascript';
          
          // Python detection
          else if (codeText.includes('def ') && codeText.includes(':')) language = 'python';
          else if (codeText.match(/print\s*\(/)) language = codeText.includes('import') ? 'python' : language;
          
          // Web languages
          else if (codeText.includes('<html>') || codeText.includes('</div>')) language = 'html';
          else if (codeText.includes('@media') || (codeText.includes('{') && codeText.includes('}'))) language = 'css';
          else if (codeText.startsWith('<?php')) language = 'php';
          
          // C-family languages
          else if (codeText.includes('#include <stdio.h>')) language = 'c';
          else if (codeText.includes('#include <iostream>')) language = 'cpp';
          else if (codeText.match(/public\s+class/) && codeText.includes('public static void main')) language = 'java';
          else if (codeText.includes('System.out.println')) language = 'java';
          else if (codeText.match(/namespace|public\s+class/) && codeText.includes('Console.WriteLine')) language = 'csharp';
          
          // Ruby/Ruby-like
          else if (codeText.match(/puts\s+['"]/) || codeText.match(/puts\(['"]/) ) language = 'ruby';
          
          // Functional languages
          else if (codeText.includes('[<EntryPoint>]') || (codeText.includes('let main') && codeText.includes('printfn'))) language = 'fsharp';
          else if (codeText.match(/module\s+\w+\s*where/i) || codeText.match(/^main\s*=/)) language = 'haskell';
          else if (codeText.includes('IO.puts')) language = 'elixir';
          
          // Other common languages  
          else if (codeText.includes('fn main()')) language = 'rust';
          else if (codeText.includes('func main()') && codeText.includes('fmt.Println')) language = 'go';
          else if (codeText.includes('fun main()')) language = 'kotlin';
          else if (codeText.match(/print.*\("Hello,\s*World!"\)/i) && codeText.includes('import Foundation')) language = 'swift';
          else if (codeText.includes('cat(')) language = 'r';
          else if (codeText.includes('echo "Hello, World!"')) language = 'bash';
          else if (codeText.includes('void main()') && codeText.includes('print(')) language = 'dart';
          else if (codeText.includes('object ') && codeText.includes('def main')) language = 'scala';
          else if (codeText.includes('println "Hello, World!"')) language = 'groovy';
          else if (codeText.includes('putStrLn')) language = 'haskell';
          else if (codeText.includes('print_endline')) language = 'ocaml';
          else if (codeText.includes('Sub Main()') && codeText.includes('Console.WriteLine')) language = 'vb';
          else if (codeText.includes('@autoreleasepool') || codeText.includes('NSLog')) language = 'objective-c';
          else if (codeText.includes('Write-Host')) language = 'powershell';
          else if (codeText.includes('section .data') || codeText.includes('global _start')) language = 'assembly';
          else if (codeText.includes('procedure') && codeText.includes('begin') && codeText.includes('end')) language = 'pascal';
          
          // New languages
          else if (codeText.includes('puts "Hello, World!"')) language = 'lua';
          else if (codeText.includes('Transcript show:')) language = 'smalltalk';
          else if (codeText.includes('echo "Hello, World!"') && !codeText.includes('#!/bin/bash')) language = 'nim';
          else if (codeText.match(/with\s+Ada\.Text_IO/)) language = 'ada';
          else if (codeText.includes('Writeln(') || codeText.includes('program ')) language = 'pascal';
          else if (codeText.includes('System.debug(')) language = 'apex';
          else if (codeText.includes('trace(')) language = 'actionscript';
          else if (codeText.includes('console.log "Hello, World!"')) language = 'coffeescript';
          else if (codeText.includes('Js.log(')) language = 'reasonml';
          else if (codeText.includes('<?hh')) language = 'hack';
          else if (codeText.includes('(display ') && codeText.includes('(newline)')) language = 'scheme';
          else if (codeText.match(/static\s+void\s+\w+\(Args/)) language = 'x++';
        }
        
        // Set the language attribute
        pre.setAttribute('data-language', language);
        
        // Ensure proper class is set for highlighting
        if (!codeClass) {
          codeElement.classList.add(`language-${language}`);
        }
      } else {
        pre.setAttribute('data-language', 'code');
      }
    }
    
    // Make sure copy button is present and working
    if (!pre.querySelector('.code-copy-btn')) {
      const copyButton = document.createElement('button');
      copyButton.classList.add('code-copy-btn');
      copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyButton.title = "Copy code";
      
      copyButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          const codeElement = pre.querySelector('code');
          const textToCopy = codeElement ? codeElement.textContent : pre.textContent;
          
          await navigator.clipboard.writeText(textToCopy);
          
          // Visual confirmation
          copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          copyButton.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
          copyButton.style.borderColor = 'rgba(16, 185, 129, 0.6)';
          
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyButton.style.backgroundColor = '';
            copyButton.style.borderColor = '';
          }, 2000);
        } catch (err) {
          console.error('Copy failed:', err);
          
          // Fallback method
          const textarea = document.createElement('textarea');
          textarea.value = pre.querySelector('code')?.textContent || pre.textContent;
          document.body.appendChild(textarea);
          textarea.select();
          
          try {
            document.execCommand('copy');
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          } catch (e) {
            copyButton.innerHTML = '<i class="fa-solid fa-times"></i> Failed';
          }
          
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
          }, 2000);
          
          document.body.removeChild(textarea);
        }
      });
      
      // Append the button to pre tag
      pre.appendChild(copyButton);
    }
  });
  
  // Apply syntax highlighting to code blocks that need it
  try {
    // Instead of highlighting all elements, only highlight those that haven't been properly highlighted yet
    document.querySelectorAll('pre:not([data-highlighted]) code').forEach(code => {
      if (window.Prism) {
        Prism.highlightElement(code);
        code.parentElement.setAttribute('data-highlighted', 'true');
      }
    });
  } catch (e) {
    console.error('Error applying syntax highlighting:', e);
  }
}

// Force scrollbars to recalculate and display properly
function ensureScrollbarsVisible() {
  document.querySelectorAll('pre').forEach(pre => {
    // Force a repaint by toggling display
    const originalDisplay = pre.style.display;
    pre.style.display = 'none';
    
    // Force layout recalculation
    void pre.offsetHeight; 
    
    // Restore display and ensure scrollbars are shown
    pre.style.display = originalDisplay || 'block';
    
    // Get the code element inside the pre tag
    const codeElement = pre.querySelector('code');
    
    // Explicitly set overflow properties with !important via CSS
    pre.setAttribute('style', pre.getAttribute('style') + '; overflow: auto !important; overflow-x: auto !important; overflow-y: auto !important;');
    
    // If content exceeds width or height, ensure scrollbars are visible
    const needsScroll = pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight;
    
    // If we have code content that's wider than the container
    if (codeElement && codeElement.scrollWidth > pre.clientWidth) {
      pre.classList.add('needs-scrollbar');
    } else if (needsScroll) {
      pre.classList.add('needs-scrollbar');
    }
    
    // If we're on a touch device, add special touch class for better scrolling
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      pre.classList.add('touch-scrollable');
    }
  });
}