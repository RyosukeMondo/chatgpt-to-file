// contentScript.js

(function() {
  // Utility function for logging
  function log(message, ...optionalParams) {
    console.log(`[ContentScript] ${message}`, ...optionalParams);
  }

  // State to prevent multiple sends
  const sentSnippetIds = new Set();

  // Function to determine if generation is finished
  function isGenerationFinished() {
    const stopButton = document.querySelector('button[aria-label="ストリーミングの停止"][data-testid="stop-button"]');
    const isStopped = stopButton !== null;
    log('Generation finished status:', isStopped);
    return isStopped;
  }

  // Function to extract code snippets
  function extractCodeSnippets() {
    const codeElements = document.querySelectorAll('code');
    const snippets = [];
    codeElements.forEach((codeElem, index) => {
      const codeText = codeElem.innerText;
      const lines = codeText.split('\n');
      // Assuming the first line is a comment with the file path
      if (lines.length > 0 && lines[0].startsWith('//')) {
        snippets.push({
          id: index,
          content: codeText
        });
        log(`Code snippet detected: ID ${index}`);
      } else {
        // Handle snippets without file path comments
        snippets.push({
          id: index,
          content: codeText,
          hasFilePath: false
        });
        log(`Code snippet detected without file path: ID ${index}`);
      }
    });
    log(`Total new snippets extracted: ${snippets.length}`);
    return snippets;
  }

  // Function to add Debug Button next to "コードをコピーする"
  function addDebugButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if(button.textContent.trim() === 'コードをコピーする') {
        // Check if debug button already exists to avoid duplicates
        if (!button.parentElement.querySelector('.debug-button')) {
          const debugButton = document.createElement('button');
          debugButton.className = 'debug-button flex gap-1 items-center py-1';
          debugButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path>
            </svg>
            デバッグ
          `;
          debugButton.style.marginLeft = '8px';
          debugButton.addEventListener('click', () => {
            log('Debug button clicked.');
            const snippet = getSnippetFromElement(button);
            if (snippet) {
              sendSnippet(snippet, true); // true indicates debug mode
            }
          });
          button.parentElement.appendChild(debugButton);
          log('Debug button added.');
        }
      }
    });
  }

  // Helper function to get the associated snippet for a copy button
  function getSnippetFromElement(button) {
    // Traverse DOM to find the corresponding code element
    const codeElem = button.closest('.sticky').parentElement.querySelector('code'); // Adjust selector as needed
    if (codeElem) {
      const codeText = codeElem.innerText;
      const lines = codeText.split('\n');
      if (lines.length > 0) {
        const id = Array.from(document.querySelectorAll('code')).indexOf(codeElem);
        const hasFilePath = lines[0].startsWith('//');
        return {
          id: id,
          content: codeText,
          hasFilePath: hasFilePath
        };
      }
    }
    return null;
  }

  // Function to send a snippet to the background script
  function sendSnippet(snippet, isDebug = false) {
    if (sentSnippetIds.has(snippet.id)) {
      log(`Snippet ID ${snippet.id} already sent. Skipping.`);
      return;
    }
    sentSnippetIds.add(snippet.id);
    log(sentSnippetIds.has(snippet.id));
    log('Snippet to send:', snippet);

    if(false){
      chrome.runtime.sendMessage({ type: 'NEW_SNIPPETS', snippets: [snippet], isDebug: isDebug }, (response) => {
        if (chrome.runtime.lastError) {
          log('Error sending snippets to background:', chrome.runtime.lastError.message);
        } else {
          log(`Snippet ID ${snippet.id} sent to background successfully.`);
          if (!isDebug) {
            sentSnippetIds.add(snippet.id);
          }
        }
      });
    }
  }

  // Observer callback
  function handleMutations(mutations) {
    if (isGenerationFinished()) {
      const newSnippets = extractCodeSnippets();
      newSnippets.forEach(snippet => {
        sendSnippet(snippet);
      });
    }
    addDebugButtons();
  }

  // Initialize MutationObserver
  function initObserver() {
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
    log('MutationObserver initialized.');
  }

  // Initial setup
  function init() {
    initObserver();
    addDebugButtons();
  }

  // Start the observer and add debug buttons
  init();
})();
