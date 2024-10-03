// contentScript.js

(function() {
  // Utility function for logging
  function log(message, ...optionalParams) {
    console.log(`[ContentScript] ${message}`, ...optionalParams);
  }

  // State to prevent multiple sends
  const sentSnippetIds = new Set();
  let previousStoppedStatus = false; // Track previous stopped status

  // Function to determine if generation is finished
  function isGenerationFinished() {
    const stopButton = document.querySelector('button[aria-label="ストリーミングの停止"][data-testid="stop-button"]');
    const isStopped = stopButton !== null;

    // Only return true if isStopped changed from true to false
    const generationFinished = previousStoppedStatus && !isStopped;
    log('Generation finished status:', generationFinished);

    // Update the previousStoppedStatus for the next check
    previousStoppedStatus = isStopped;
    
    return generationFinished;
  }

  // Function to extract code snippets
  function extractCodeSnippets() {
    const codeElements = document.querySelectorAll('code');
    const snippets = [];
    codeElements.forEach((codeElem, index) => {
      const codeText = codeElem.innerText;
      const lines = codeText.split('\n');
      // Assuming the first line is a comment with the file path
      if (codeText.includes("\n") && lines.length > 0) {
        snippets.push({
          id: index,
          content: codeText
        });
        log(`Code snippet detected: ID ${index}`);
      }
    });
    log(`Total new snippets extracted: ${snippets.length}`);
    return snippets;
  }

  // Function to send a snippet to the background script
  function sendSnippet(snippet, isDebug = false) {
    if (sentSnippetIds.has(snippet.id)) {
      log(`Snippet ID ${snippet.id} already sent. Skipping.`);
      return;
    }

    log(`Sending snippet ID ${snippet.id} to background...`);
    chrome.runtime.sendMessage({ type: 'NEW_SNIPPETS', snippets: [snippet], isDebug: isDebug }, (response) => {
      sentSnippetIds.add(snippet.id);
      if (chrome.runtime.lastError) {
        log('Error sending snippets to background:', chrome.runtime.lastError.message);
      } else {
        log(`Snippet ID ${snippet.id} sent to background successfully.`);
      }
    });
  }

  // Observer callback
  function handleMutations(mutations) {
    if (isGenerationFinished()) {
      const newSnippets = extractCodeSnippets();
      newSnippets.forEach(snippet => {
        sendSnippet(snippet);
      });
    }
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
