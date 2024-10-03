// options.js

// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[OptionsPage] ${message}`, ...optionalParams);
}

document.addEventListener('DOMContentLoaded', () => {
  const receiverPathInput = document.getElementById('receiverPath');
  const destinationInput = document.getElementById('destination');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const capturedSnippetsDiv = document.getElementById('capturedSnippets');

  // Load saved settings
  chrome.storage.sync.get(['receiverPath', 'destination'], (data) => {
    if (data.receiverPath) receiverPathInput.value = data.receiverPath;
    if (data.destination) destinationInput.value = data.destination;
    log('Settings loaded:', data);
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const receiverPath = receiverPathInput.value.trim();
    const destination = destinationInput.value.trim();

    // Basic validation
    if (!receiverPath || !destination) {
      statusDiv.textContent = 'Both fields are required.';
      statusDiv.style.color = 'red';
      log('Save failed: Missing receiverPath or destination.');
      return;
    }

    chrome.storage.sync.set({ receiverPath, destination }, () => {
      statusDiv.textContent = 'Options saved successfully!';
      statusDiv.style.color = 'green';
      log('Settings saved:', { receiverPath, destination });
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
  });

  // Listen for messages from background script to display captured snippets
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DISPLAY_SNIPPET') {
      displaySnippet(message.snippet);
    }
  });

  // Function to display a captured snippet
  function displaySnippet(snippet) {
    const snippetDiv = document.createElement('div');
    snippetDiv.className = 'snippet';
    snippetDiv.innerHTML = `
      <div class="snippet-id">Snippet ID: ${snippet.id}</div>
      <pre><code>${escapeHtml(snippet.content)}</code></pre>
    `;
    capturedSnippetsDiv.prepend(snippetDiv);
    log(`Displayed snippet ID ${snippet.id} on options page.`);
  }

  // Function to escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
