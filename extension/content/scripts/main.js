// content/scripts/main.js

(function() {
  // Initialize MutationObserver and perform initial setup
  ContentObserver.initObserver();
  setTimeout(() => {
    ContentObserver.initialCheck();
  }, 3000); // Delay to allow initial DOM elements to load
})();
