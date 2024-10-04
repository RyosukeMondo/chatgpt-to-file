// content/scripts/messaging.js

const Messaging = (() => {
  function sendMessage(message, callback) {
    if (typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.sendMessage === 'function') {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          ContentUtils.log('Error sending message:', chrome.runtime.lastError);
        } else {
          ContentUtils.log('Message sent:', message, 'Response:', response);
          if (callback) callback(response);
        }
      });
    } else {
      ContentUtils.log('Error: chrome.runtime or chrome.runtime.sendMessage is not available.');
    }
  }

  function onMessage(callback) {
    if (typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.onMessage.addListener === 'function') {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        ContentUtils.log('Message received:', message, sender);
        
        if (message.type === 'APPEND_PROMPT') {
          // Handle APPEND_PROMPT message
          const promptMessage = message.message;
          // Perform the necessary action with promptMessage
          ContentUtils.log('APPEND_PROMPT message received:', promptMessage);
          // Example: Append the prompt message to a specific element
          const promptElement = document.getElementById('prompt-textarea');
          if (promptElement) {
            const formattedMessage = promptMessage.replace(/\n/g, '<br>');
            promptElement.innerHTML += `<br>${formattedMessage}`;
          }
        }

        callback(message, sender, sendResponse);
      });
    } else {
      ContentUtils.log('Error: chrome.runtime or chrome.runtime.onMessage is not available.');
    }
  }

  return {
    sendMessage,
    onMessage,
  };
})();

window.ContentMessaging = Messaging; // Expose to other scripts
