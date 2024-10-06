const Observer = (() => {
  let previousStoppedStatus = false; // Track previous stopped status

  function handleMutations(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName.toLowerCase() === 'pre') {
          const classList = Array.from(node.classList);
          const hasOverflowVisible = classList.some(cls => cls.replace('!', '') === 'overflow-visible');

          if (hasOverflowVisible) {
            ContentToggler.addToggleButton(node);
          }
        }
      });
    });

    // Check if generation has finished
    const currentStoppedStatus = checkGenerationStopped();
    if (SnippetExtractor.isGenerationFinished(previousStoppedStatus, currentStoppedStatus)) {
      const newSnippets = SnippetExtractor.extractCodeSnippets();
      newSnippets.forEach(snippet => {
        SnippetExtractor.sendSnippet(snippet);
      });
    }
    previousStoppedStatus = currentStoppedStatus;
  }

  function checkGenerationStopped() {
    const stopButton = document.querySelector('button[aria-label="ストリーミングの停止"][data-testid="stop-button"]');
    const isStopped = stopButton !== null;
    return isStopped;
  }

  function initObserver() {
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
    ContentUtils.log('MutationObserver initialized.');
  }

  function initialCheck() {
    ContentUtils.log('Initial check for existing <pre> elements');
    document.querySelectorAll('pre.\\!overflow-visible')?.forEach(preElement => {
      ContentToggler.addToggleButton(preElement);
    });
  }

  return {
    initObserver,
    initialCheck,
  };
})();

window.ContentObserver = Observer; // Expose to other scripts
