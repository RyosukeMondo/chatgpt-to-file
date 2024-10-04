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
