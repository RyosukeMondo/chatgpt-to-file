const Observer = (() => {
  let previousStoppedStatus = false;

  /**
   * Handles mutations observed in the DOM.
   * @param {Array} mutations - Array of mutation records.
   */
  function handleMutations(mutations) {
    mutations.forEach(processMutation);
    checkAndExtractSnippets();
  }

  /**
   * Processes each mutation record.
   * @param {MutationRecord} mutation - A mutation record.
   */
  function processMutation(mutation) {
    mutation.addedNodes.forEach(node => {
      if (isPreElementWithOverflowVisible(node)) {
        ContentToggler.addToggleButton(node);
      }
    });
  }

  /**
   * Checks if a node is a <pre> element with overflow visible.
   * @param {Node} node - The DOM node to check.
   * @returns {boolean} - True if the node matches the criteria.
   */
  function isPreElementWithOverflowVisible(node) {
    // console.log(node);
    if (node.nodeType === 1 && node.tagName.toLowerCase() === 'pre') {
      return Array.from(node.classList).some(cls => cls.replace('!', '') === 'overflow-visible');
    }
    return false;
  }

  /**
   * Checks if generation has stopped and extracts snippets and assistant responses if finished.
   */
  function checkAndExtractSnippets() {
    const currentStoppedStatus = checkGenerationStopped();
    if (SnippetExtractor.isGenerationFinished(previousStoppedStatus, currentStoppedStatus)) {
      // Extract and send code snippets
      SnippetExtractor.extractCodeSnippets().forEach(SnippetExtractor.sendSnippet);
      
      // Extract and send assistant responses
      AssistantResponseExtractor.extractAssistantResponses().forEach(AssistantResponseExtractor.sendResponse);
    }
    previousStoppedStatus = currentStoppedStatus;
  }

  /**
   * Checks if the generation process has stopped.
   * @returns {boolean} - True if the stop button is present.
   */
  function checkGenerationStopped() {
    return document.querySelector('button[aria-label="ストリーミングの停止"][data-testid="stop-button"]') !== null;
  }

  /**
   * Initializes the MutationObserver.
   */
  function initObserver() {
    new MutationObserver(handleMutations).observe(document.body, { childList: true, subtree: true });
    ContentUtils.log('MutationObserver initialized.');
  }

  /**
   * Performs an initial check for existing elements.
   */
  function initialCheck() {
    ContentUtils.log('Initial check for existing elements');
    document.querySelectorAll('pre.\\!overflow-visible').forEach(ContentToggler.addToggleButton);
  }

  return {
    initObserver,
    initialCheck,
  };
})();

window.ContentObserver = Observer;