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
          const promptMessage = message.message;
          ContentUtils.log('APPEND_PROMPT message received:', promptMessage);
          const promptElement = document.getElementById('prompt-textarea');
          if (promptElement) {
            const lines = promptMessage.split('\n');
            if(promptMessage.includes("<html")) {
              promptElement.textContent = "html not supported.";
            } else {
              const formattedMessage = lines.map(line => `<p>${line}</p>`).join('');
              promptElement.innerHTML += formattedMessage;
            }
          }
        }

        callback(message, sender, sendResponse);
      });
    } else {
      ContentUtils.log('Error: chrome.runtime or chrome.runtime.onMessage is not available.');
    }
  }

  function sendAliveMessage() {
    sendMessage({ type: 'ALIVE' }, (response) => {
      ContentUtils.log('Alive message response:', response);
    });
  }

  return {
    sendMessage,
    onMessage,
    sendAliveMessage,
  };
})();

window.ContentMessaging = Messaging; // Expose to other scripts
