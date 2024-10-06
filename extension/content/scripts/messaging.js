const Messaging = (() => {
  const isChromeRuntimeAvailable = () => {
    return typeof chrome.runtime !== 'undefined';
  };

  const isSendMessageAvailable = () => {
    return typeof chrome.runtime.sendMessage === 'function';
  };

  const isOnMessageAvailable = () => {
    return typeof chrome.runtime.onMessage.addListener === 'function';
  };

  const logError = (message) => {
    ContentUtils.log('Error:', message);
  };

  const logMessage = (prefix, ...messageParts) => {
    ContentUtils.log(prefix, ...messageParts);
  };

  function sendMessage(message, callback) {
    if (isChromeRuntimeAvailable() && isSendMessageAvailable()) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          logError(chrome.runtime.lastError);
        } else {
          logMessage('Message sent:', message, 'Response:', response);
          if (callback) callback(response);
        }
      });
    } else {
      logError('chrome.runtime or chrome.runtime.sendMessage is not available.');
    }
  }

  function onMessage(callback) {
    if (isChromeRuntimeAvailable() && isOnMessageAvailable()) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        logMessage('Message received:', message, sender);
        handleAppendPrompt(message);
        callback(message, sender, sendResponse);
      });
    } else {
      logError('chrome.runtime or chrome.runtime.onMessage is not available.');
    }
  }

  function handleAppendPrompt(message) {
    if (message.type === 'APPEND_PROMPT') {
      const promptMessage = message.message;
      logMessage('APPEND_PROMPT message received:', promptMessage);
      const promptElement = document.getElementById('prompt-textarea');
      if (promptElement) {
        updatePromptContent(promptMessage, promptElement);
      }
    }
  }

  function updatePromptContent(promptMessage, promptElement) {
    if (promptMessage.includes("")) {
      promptElement.textContent = "html not supported.";
    } else {
      const formattedMessage = formatMessage(promptMessage);
      promptElement.innerHTML += formattedMessage;
    }
  }

  function formatMessage(message) {
    return message.split('\n').map(line => `
${line}
`).join('');
  }

  function sendAliveMessage() {
    sendMessage({ type: 'ALIVE' }, (response) => {
      logMessage('Alive message response:', response);
    });
  }

  return {
    sendMessage,
    onMessage,
    sendAliveMessage,
  };
})();

window.ContentMessaging = Messaging; // Expose to other scripts
