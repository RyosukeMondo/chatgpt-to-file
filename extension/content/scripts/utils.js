// content/scripts/utils.js

const Utils = (() => {
  function log(message, ...optionalParams) {
    console.log(`[ContentScript] ${message}`, ...optionalParams);
  }

  return {
    log,
  };
})();

window.ContentUtils = Utils; // Expose to other scripts
