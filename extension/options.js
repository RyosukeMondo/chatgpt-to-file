// options.js

// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[OptionsPage] ${message}`, ...optionalParams);
}

document.addEventListener('DOMContentLoaded', () => {
  const destinationInput = document.getElementById('destination');
  const saveButton = document.getElementById('save');
  const syncButton = document.getElementById('sync');
  const statusDiv = document.getElementById('status');
  const capturedSnippetsDiv = document.getElementById('capturedSnippets');
  const fileListDiv = document.getElementById('fileList');

  // Connection Status Indicators
  const tabStatusIndicator = document.getElementById('tab-status');
  const backgroundStatusIndicator = document.getElementById('background-status');
  const websocketStatusIndicator = document.getElementById('websocket-status');

  // Load saved settings
  chrome.storage.sync.get(['destination'], (data) => {
    if (data.destination) destinationInput.value = data.destination;
    log('Settings loaded:', data);
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    // \ -> \, put / at the end, remove multiple /s
    const destination = (destinationInput.value.trim() + "/").replace(/\\/g, '/').replace(/\/+/g, '/');

    // Basic validation
    if (!destination) {
      statusDiv.textContent = 'Both fields are required.';
      statusDiv.style.color = 'red';
      log('Save failed: Missing destination.');
      return;
    }

    chrome.storage.sync.set({ destination }, () => {
      statusDiv.textContent = 'Options saved successfully!';
      statusDiv.style.color = 'green';
      log('Settings saved:', { destination });
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
  });

  // Sync button send message to background script
  syncButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SYNC' });
    log('Sent sync request to background script.');
  });

  // Listen for messages from background script to display captured snippets
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DISPLAY_SNIPPET') {
      displaySnippet(message.snippet);
    } else if (message.type === 'DISPLAY_FILE') {
      saveFile(message.file);
      addFileToList(message.file);
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

  // Function to save received file
  function saveFile(file) {
    const { filePath, content } = file;
    const fullPath = `${destinationInput.value}/${filePath}`.replace(/\\/g, '/').replace(/\/+/g, '/');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullPath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log(`Saved file to ${fullPath}`);
  }

  // Function to add received file to the list
  function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.textContent = `File: ${file.filePath}`;
    fileListDiv.appendChild(fileItem);
    log(`Added file to list: ${file.filePath}`);
  }

  // Function to escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize connection with background script for status updates
  const port = chrome.runtime.connect({ name: 'options' });

  port.onMessage.addListener((msg) => {
    if (msg.type === 'STATUS_UPDATE') {
      const { tab, background, websocket } = msg.status;
      updateIndicator(tabStatusIndicator, tab);
      updateIndicator(backgroundStatusIndicator, background);
      updateIndicator(websocketStatusIndicator, websocket);
      log('Received status update:', msg.status);
    }
  });

  // Function to update the color of the status indicator
  function updateIndicator(element, status) {
    switch (status) {
      case 'connected':
      case 'active':
        element.style.backgroundColor = 'green';
        break;
      case 'connecting':
        element.style.backgroundColor = 'yellow';
        break;
      case 'disconnected':
      case 'error':
        element.style.backgroundColor = 'red';
        break;
      default:
        element.style.backgroundColor = 'gray';
    }
  }
});
