(function() {
  // Function to determine if generation is finished
  function isGenerationFinished() {
    // Implement logic to determine if ChatGPT has finished generating
    // This might vary based on ChatGPT's DOM structure
    // For example, check for the presence of a "Stop generating" button or absence of a loading spinner
    return !document.querySelector('.loading-spinner-selector'); // Replace with actual selector
  }

  // Function to extract code snippets
  function extractCodeSnippets() {
    const codeElements = document.querySelectorAll('code');
    const snippets = [];
    codeElements.forEach((codeElem, index) => {
      // Assuming the first line is a comment with the file path
      const codeText = codeElem.innerText;
      const lines = codeText.split('\n');
      if (lines.length > 0 && lines[0].startsWith('//')) {
        snippets.push({
          id: index,
          content: codeText
        });
      }
    });
    return snippets;
  }

  // Observe DOM changes to detect when new content is added
  const observer = new MutationObserver((mutations) => {
    if (isGenerationFinished()) {
      const newSnippets = extractCodeSnippets();
      if (newSnippets.length > 0) {
        // Send snippets to background script
        chrome.runtime.sendMessage({ type: 'NEW_SNIPPETS', snippets: newSnippets });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Optionally, check periodically if generation is finished
  /*
  setInterval(() => {
    if (isGenerationFinished()) {
      const newSnippets = extractCodeSnippets();
      if (newSnippets.length > 0) {
        chrome.runtime.sendMessage({ type: 'NEW_SNIPPETS', snippets: newSnippets });
      }
    }
  }, 3000);
  */
})();
