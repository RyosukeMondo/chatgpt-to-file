(function() {
  // Initialize MutationObserver and perform initial setup
  ContentObserver.initObserver();
  setTimeout(() => {
    ContentObserver.initialCheck();
  }, 3000); // Delay to allow initial DOM elements to load

  // Initialize Messaging onMessage listener
  Messaging.onMessage((message, sender, sendResponse) => {
    ContentUtils.log('Message received in main.js:', message);
    // Handle the message or pass it to another handler
    sendResponse({ status: 'Message received' });
  });
})();
