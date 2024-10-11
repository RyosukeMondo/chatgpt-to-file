// path: D:/repos/chatgpt-to-file/extension/content/scripts/observer.js

const Observer = (() => {
  let previousStoppedStatus = false;

  function handleMutations(mutations) {
    mutations.forEach(processMutation);
    checkAndExtractSnippets();
  }

  function processMutation(mutation) {
    mutation.addedNodes.forEach(node => {
      if (isPreElementWithOverflowVisible(node)) {
        ContentToggler.addToggleButton(node);
      }
    });
  }

  function isPreElementWithOverflowVisible(node) {
    console.log(node);
    if (node.nodeType === 1 && node.tagName.toLowerCase() === 'pre') {
      return Array.from(node.classList).some(cls => cls.replace('!', '') === 'overflow-visible');
    }
    return false;
  }

  function checkAndExtractSnippets() {
    const currentStoppedStatus = checkGenerationStopped();
    if (SnippetExtractor.isGenerationFinished(previousStoppedStatus, currentStoppedStatus)) {
      SnippetExtractor.extractCodeSnippets().forEach(SnippetExtractor.sendSnippet);

    }
    previousStoppedStatus = currentStoppedStatus;
  }

  function checkGenerationStopped() {
    return document.querySelector('button[aria-label="ストリーミングの停止"][data-testid="stop-button"]') !== null;
  }

  function initObserver() {
    new MutationObserver(handleMutations).observe(document.body, { childList: true, subtree: true });
    ContentUtils.log('MutationObserver initialized.');
  }

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
