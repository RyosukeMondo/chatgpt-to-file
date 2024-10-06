const SnippetExtractor = (() => {
  const sentSnippetIds = new Set();

  function isGenerationFinished(previousStoppedStatus, currentStoppedStatus) {
    const generationFinished = previousStoppedStatus && !currentStoppedStatus;
    ContentUtils.log('Generation finished status:', generationFinished);
    ContentMessaging.sendAliveMessage();
    return generationFinished;
  }

  function extractCodeSnippets() {
    const codeElements = document.querySelectorAll('code');
    const snippets = [];
    codeElements.forEach((codeElem, index) => {
      const codeText = codeElem.innerText;
      const lines = codeText.split('\n');
      if (codeText.includes("\n") && lines.length > 0) {
        snippets.push({
          id: index,
          content: codeText
        });
        ContentUtils.log(`Code snippet detected: ID ${index}`);
      }
    });
    ContentUtils.log(`Total new snippets extracted: ${snippets.length}`);
    return snippets;
  }

  function sendSnippet(snippet) {
    if (sentSnippetIds.has(snippet.id)) {
      ContentUtils.log(`Snippet ID ${snippet.id} already sent. Skipping.`);
      return;
    }

    ContentUtils.log(`Sending snippet ID ${snippet.id} to background...`);

    ContentMessaging.sendMessage({ type: 'NEW_SNIPPETS', snippets: [snippet] }, (response) => {
      sentSnippetIds.add(snippet.id);
      if (chrome.runtime.lastError) {
        ContentUtils.log('Error sending snippets to background:', chrome.runtime.lastError.message);
      } else {
        ContentUtils.log(`Snippet ID ${snippet.id} sent to background successfully.`);
      }
    });
  }

  return {
    isGenerationFinished,
    extractCodeSnippets,
    sendSnippet,
  };
})();

window.ContentSnippetExtractor = SnippetExtractor; // Expose to other scripts
