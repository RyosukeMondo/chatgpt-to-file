const AssistantResponseExtractor = (() => {
  const sentResponseIds = new Set();

  /**
   * Determines if the generation process has finished.
   * @param {boolean} previousStoppedStatus - The previous stopped status.
   * @param {boolean} currentStoppedStatus - The current stopped status.
   * @returns {boolean} - True if generation has finished, else false.
   */
  function isGenerationFinished(previousStoppedStatus, currentStoppedStatus) {
    const generationFinished = previousStoppedStatus && !currentStoppedStatus;
    ContentUtils.log('Generation finished status for Assistant Response:', generationFinished);
    ContentMessaging.sendAliveMessage();
    return generationFinished;
  }

  /**
   * Extracts assistant responses from the DOM.
   * @returns {Array} - An array of assistant response objects.
   */
  function extractAssistantResponses() {
    const assistantElements = document.querySelectorAll("div[data-message-author-role='assistant']");
    const responses = [];
    assistantElements.forEach((element) => {
      const responseText = element.outerHTML.trim();
      if (responseText && !sentResponseIds.has(getElementUniqueId(element))) {
      responses.push({
        id: getElementUniqueId(element),
        content: responseText
      });
      ContentUtils.log(`Assistant response detected: ID ${getElementUniqueId(element)}`);
      }
    });
    ContentUtils.log(`Total new assistant responses extracted: ${responses.length}`);
    return responses;
  }

  /**
   * Sends an assistant response to the background script.
   * @param {Object} response - The assistant response object.
   */
  function sendResponse(response) {
    if (sentResponseIds.has(response.id)) {
      ContentUtils.log(`Assistant response ID ${response.id} already sent. Skipping.`);
      return;
    }

    ContentUtils.log(`Sending assistant response ID ${response.id} to background...`);

    ContentMessaging.sendMessage({ type: 'NEW_ASSISTANT_RESPONSES', responses: [response] }, (response) => {
      sentResponseIds.add(response.id);
      if (chrome.runtime.lastError) {
        ContentUtils.log('Error sending assistant responses to background:', chrome.runtime.lastError.message);
      } else {
        ContentUtils.log(`Assistant response ID ${response.id} sent to background successfully.`);
      }
    });
  }

  /**
   * Generates a unique ID for a DOM element.
   * @param {Element} element - The DOM element.
   * @returns {string} - A unique identifier.
   */
  function getElementUniqueId(element) {
    return element.dataset.uniqueId || (element.dataset.uniqueId = `assistant-${Date.now()}-${Math.random()}`);
  }

  return {
    isGenerationFinished,
    extractAssistantResponses,
    sendResponse,
  };
})();

window.ContentAssistantResponseExtractor = AssistantResponseExtractor; // Expose to other scripts