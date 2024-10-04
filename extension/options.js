// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[OptionsPage] ${message}`, ...optionalParams);
}

// Utility function to normalize file paths
function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
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
    if (data.destination) {
      destinationInput.value = data.destination;
      loadFilesForDestination(data.destination); // Load files for current destination
    }
    log('Settings loaded:', data);
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const destination = normalizePath(destinationInput.value.trim());
    if (!destination) {
      displayStatus('Destination path is required.', 'error');
      log('Save failed: Missing destination.');
      return;
    }
    clearFilesForDestination(destination); // Clear existing files for the current destination
    chrome.storage.sync.set({ destination }, () => {
      displayStatus('Options saved successfully!', 'success');
      log('Settings saved:', { destination });
      loadFilesForDestination(destination); // Load files for new destination
      setTimeout(() => { clearStatus(); }, 3000);
    });
  });

  // Sync button send message to background script
  syncButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SYNC' }, (response) => {
      if (chrome.runtime.lastError) {
        displayStatus('Failed to send sync request.', 'error');
        log('Sync request failed:', chrome.runtime.lastError);
      } else {
        displayStatus('Sync request sent.', 'success');
        log('Sent sync request to background script.');
      }
    });
  });

  // Listen for messages from background script to display captured snippets and files
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DISPLAY_SNIPPET') {
      displaySnippet(message.snippet);
    } else if (message.type === 'DISPLAY_FILE') {
      saveFile(message.file);
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
    const normalizedFilePath = normalizePath(filePath);

    // Get current destination
    const destination = normalizePath(document.getElementById('destination').value.trim());
    if (!destination) {
      log('Save failed: Missing destination.');
      return;
    }

    // Save to localStorage with key as destination + normalizedFilePath
    const key = `${destination}/${normalizedFilePath}`;
    localStorage.setItem(key, content);
    log(`Saved file to localStorage with key ${key}`);

    // Update file list
    addFileToList({ filePath: normalizedFilePath });
  }

  // Function to add received file to the list
  function addFileToList(file) {
    const filePath = file.filePath;
    const existingFiles = Array.from(fileListDiv.children).map(item => item.getAttribute('data-filepath'));

    // Check if file is already in the list
    if (!existingFiles.includes(filePath)) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.setAttribute('data-filepath', filePath);
      fileItem.innerHTML = `
        <button class="view-button" data-filepath="${filePath}">View</button>
        <button class="delete-button" data-filepath="${filePath}">Delete</button>
        <strong>File:</strong> ${filePath}
        <pre class="file-content" style="display: none;"></pre>
      `;
      fileListDiv.appendChild(fileItem);
      log(`Added file to list: ${filePath}`);

      // Add event listeners for View and Delete buttons
      fileItem.querySelector('.view-button').addEventListener('click', () => toggleFileContent(filePath));
      fileItem.querySelector('.delete-button').addEventListener('click', () => deleteFile(filePath));
    }
  }

  // Function to toggle file content visibility
  function toggleFileContent(filePath) {
    const fileItem = Array.from(fileListDiv.children).find(item => item.getAttribute('data-filepath') === filePath);
    if (fileItem) {
      const contentPre = fileItem.querySelector('.file-content');
      if (contentPre.style.display === 'none') {
        const content = localStorage.getItem(filePath) || 'No content available.';
        contentPre.textContent = content;
        contentPre.style.display = 'block';
      } else {
        contentPre.style.display = 'none';
      }
    }
  }

  // Function to delete a file
  function deleteFile(filePath) {
    if (confirm(`Are you sure you want to delete ${filePath}?`)) {
      localStorage.removeItem(filePath);
      const fileItem = Array.from(fileListDiv.children).find(item => item.getAttribute('data-filepath') === filePath);
      if (fileItem) {
        fileListDiv.removeChild(fileItem);
        log(`Deleted file: ${filePath}`);
      }
    }
  }

  // Function to load files for the current destination
  function loadFilesForDestination(destination) {
    fileListDiv.innerHTML = ''; // Clear current list
    const normalizedDestination = normalizePath(destination);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (normalizePath(key).startsWith(normalizedDestination)) {
        const relativePath = normalizePath(key).replace(`${normalizedDestination}`, '');
        addFileToList({ filePath: relativePath });
      }
    }
  }

  // Function to clear files for the current destination
  function clearFilesForDestination(destination) {
    const keysToRemove = [];
    const normalizedDestination = normalizePath(destination);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (normalizePath(key).startsWith(normalizedDestination)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    log(`Cleared files for destination: ${destination}`);
  }

  // Function to display status messages
  function displayStatus(message, type) {
    statusDiv.textContent = message;
    if (type === 'success') {
      statusDiv.className = 'status-success';
    } else if (type === 'error') {
      statusDiv.className = 'status-error';
    }
  }

  // Function to clear status messages
  function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = '';
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
